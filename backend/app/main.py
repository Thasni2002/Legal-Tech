import os
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine, SessionLocal
from app.authapp.models import User
from app.authapp.seed import create_default_user
from app.advocate.consultations.models import Consultation
from app.advocate.finance_management.models import Invoice
from app.advocate.client_management.routes import router as client_router
from app.authapp import router as auth_router
from app.advocate.consultations import router as consultations_router
from app.advocate.finance_management import router as finance_router
from app.advocate.permissions import router as permissions_router
from app.advocate.lawfirm_management.routes import router as lawfirm_router
from app.advocate.case_management.routes import router as case_router
from app.utils.scheduler import start_scheduler
from app.advocate.dashboard import router as dashboard_router
from app.advocate.tasks import router as tasks_router
from app.advocate.tasks.models import Task, TaskMessage

app = FastAPI()

from fastapi.staticfiles import StaticFiles
# Mount uploads directory to serve files statically
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
if not os.path.exists(uploads_dir):
    os.makedirs(uploads_dir)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("VALIDATION ERROR:", exc.errors())
    print("BODY:", exc.body)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )

# CORS setup
_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
)

ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables
Base.metadata.create_all(bind=engine)


# Startup event
@app.on_event("startup")
def startup():
    db = SessionLocal()
    create_default_user(db)
    from app.advocate.permissions.service import seed_roles_and_permissions
    seed_roles_and_permissions(db)
    
    # Auto-seed database from database_seed.json if empty on startup
    try:
        from app.advocate.case_management.models import Case
        from sqlalchemy import MetaData, Table, text, inspect
        # If case table is empty, auto-seed the database
        case_count = db.query(Case).count()
        if case_count == 0:
            root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            seed_path = os.path.join(root_dir, "database_seed.json")
            if os.path.exists(seed_path):
                print(f"Auto-importing database seed on startup from {seed_path}...")
                import json
                with open(seed_path, "r", encoding="utf-8") as f:
                    seed_data = json.load(f)
                
                inspector = inspect(engine)
                is_mysql = "mysql" in engine.url.drivername.lower()
                with engine.begin() as conn:
                    if is_mysql:
                        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
                        
                    for t_name, rows in seed_data.items():
                        if inspector.has_table(t_name):
                            table = Table(t_name, MetaData(), autoload_with=engine)
                            conn.execute(table.delete())
                            if rows:
                                conn.execute(table.insert(), rows)
                                
                    if is_mysql:
                        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
                print("Successfully auto-imported database state on startup.")
    except Exception as seed_err:
        print(f"Error auto-importing database state on startup: {seed_err}")
    
    # Clean up duplicate assigned cases
    try:
        from app.advocate.lawfirm_management.models import AssignedCase
        from sqlalchemy import func
        duplicates = db.query(
            AssignedCase.case_number,
            AssignedCase.advocate_name,
            func.max(AssignedCase.id).label('max_id')
        ).group_by(
            AssignedCase.case_number,
            AssignedCase.advocate_name
        ).having(
            func.count(AssignedCase.id) > 1
        ).all()
        
        deleted_count = 0
        for case_num, adv_name, max_id in duplicates:
            result = db.query(AssignedCase).filter(
                AssignedCase.case_number == case_num,
                AssignedCase.advocate_name == adv_name,
                AssignedCase.id != max_id
            ).delete(synchronize_session=False)
            deleted_count += result
        if deleted_count > 0:
            db.commit()
            print(f"Successfully cleaned up {deleted_count} duplicate assigned cases records.")
    except Exception as e:
        print(f"Error cleaning up duplicate assigned cases: {e}")
        
    db.close()

    # Automatically add columns to existing tables if they don't exist
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    try:
        if inspector.has_table('case_management_cases'):
            columns = [col['name'] for col in inspector.get_columns('case_management_cases')]
            if 'cnr_number' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE case_management_cases ADD COLUMN cnr_number VARCHAR(100) NULL;"))
                print("Successfully added cnr_number column to case_management_cases table.")
            if 'created_at' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE case_management_cases ADD COLUMN created_at DATETIME NULL;"))
                print("Successfully added created_at column to case_management_cases table.")
            if 'updated_at' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE case_management_cases ADD COLUMN updated_at DATETIME NULL;"))
                print("Successfully added updated_at column to case_management_cases table.")
        if inspector.has_table('consultations'):
            columns = [col['name'] for col in inspector.get_columns('consultations')]
            if 'updated_at' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE consultations ADD COLUMN updated_at DATETIME NULL;"))
                print("Successfully added updated_at column to consultations table.")
        if inspector.has_table('assigned_cases'):
            columns = [col['name'] for col in inspector.get_columns('assigned_cases')]
            if 'client_name' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE assigned_cases ADD COLUMN client_name VARCHAR(255) NULL;"))
                print("Successfully added client_name column to assigned_cases table.")
            # Populate client_name for existing records by joining case_management_cases
            try:
                with engine.begin() as conn:
                    conn.execute(text("""
                        UPDATE assigned_cases ac
                        JOIN case_management_cases c ON ac.case_number = c.case_no
                        SET ac.client_name = c.client_name
                        WHERE ac.client_name IS NULL;
                    """))
                print("Successfully updated NULL client_name fields in assigned_cases.")
            except Exception as update_err:
                print(f"Error updating existing client_names in assigned_cases: {update_err}")

        if inspector.has_table('advocate_tasks'):
            columns = [col['name'] for col in inspector.get_columns('advocate_tasks')]
            if 'is_pinned' not in columns:
                with engine.begin() as conn:
                    # using integer 0 since SQLite doesn't have a strict BOOLEAN type, and 0 is false. MySQL also works with 0.
                    conn.execute(text("ALTER TABLE advocate_tasks ADD COLUMN is_pinned BOOLEAN DEFAULT 0;"))
                print("Successfully added is_pinned column to advocate_tasks table.")
        if inspector.has_table('users'):
            columns = [col['name'] for col in inspector.get_columns('users')]
            if 'google_refresh_token' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE users ADD COLUMN google_refresh_token VARCHAR(500) NULL;"))
                print("Successfully added google_refresh_token column to users table.")
        if inspector.has_table('advocates'):
            columns = [col['name'] for col in inspector.get_columns('advocates')]
            if 'hashed_password' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE advocates ADD COLUMN hashed_password VARCHAR(255) NULL;"))
                print("Successfully added hashed_password column to advocates table.")
            if 'temp_password' not in columns:
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE advocates ADD COLUMN temp_password VARCHAR(255) NULL;"))
                print("Successfully added temp_password column to advocates table.")
    except Exception as e:
        print(f"Error checking/adding migration columns: {e}")

    # Ensure Assigned Tasks tables exist and have all required columns
    try:
        from app.advocate.tasks.models import Task as _Task, TaskMessage as _TaskMsg
        from app.database import Base as _Base
        # Create tables if they don't exist at all
        _Base.metadata.create_all(bind=engine, tables=[_Task.__table__, _TaskMsg.__table__])

        # Migrate advocate_tasks: add any columns that are missing (table may exist from old schema)
        if inspector.has_table('advocate_tasks'):
            existing_cols = {col['name'] for col in inspector.get_columns('advocate_tasks')}
            needed_cols = {
                'description':       "ALTER TABLE advocate_tasks ADD COLUMN description TEXT NULL",
                'priority':          "ALTER TABLE advocate_tasks ADD COLUMN priority VARCHAR(50) NULL DEFAULT 'Medium'",
                'due_date':          "ALTER TABLE advocate_tasks ADD COLUMN due_date VARCHAR(100) NULL",
                'senior_advocate_id':"ALTER TABLE advocate_tasks ADD COLUMN senior_advocate_id INT NOT NULL DEFAULT 0",
                'junior_advocate_id':"ALTER TABLE advocate_tasks ADD COLUMN junior_advocate_id INT NOT NULL DEFAULT 0",
                'case_id':           "ALTER TABLE advocate_tasks ADD COLUMN case_id INT NULL",
                'case_title':        "ALTER TABLE advocate_tasks ADD COLUMN case_title VARCHAR(255) NULL",
                'case_no':           "ALTER TABLE advocate_tasks ADD COLUMN case_no VARCHAR(100) NULL",
                'senior_name':       "ALTER TABLE advocate_tasks ADD COLUMN senior_name VARCHAR(255) NULL",
                'junior_name':       "ALTER TABLE advocate_tasks ADD COLUMN junior_name VARCHAR(255) NULL",
                'status':            "ALTER TABLE advocate_tasks ADD COLUMN status VARCHAR(50) NULL DEFAULT 'todo'",
                'created_at':        "ALTER TABLE advocate_tasks ADD COLUMN created_at DATETIME NULL",
                'updated_at':        "ALTER TABLE advocate_tasks ADD COLUMN updated_at DATETIME NULL",
            }
            with engine.begin() as conn:
                for col_name, alter_sql in needed_cols.items():
                    if col_name not in existing_cols:
                        conn.execute(text(alter_sql))
                        print(f"advocate_tasks: added missing column '{col_name}'")

        # Migrate advocate_task_messages similarly
        if inspector.has_table('advocate_task_messages'):
            existing_cols = {col['name'] for col in inspector.get_columns('advocate_task_messages')}
            needed_cols = {
                'task_id':     "ALTER TABLE advocate_task_messages ADD COLUMN task_id INT NOT NULL DEFAULT 0",
                'sender_id':   "ALTER TABLE advocate_task_messages ADD COLUMN sender_id INT NOT NULL DEFAULT 0",
                'sender_name': "ALTER TABLE advocate_task_messages ADD COLUMN sender_name VARCHAR(255) NULL",
                'sender_role': "ALTER TABLE advocate_task_messages ADD COLUMN sender_role VARCHAR(100) NULL",
                'message':     "ALTER TABLE advocate_task_messages ADD COLUMN message TEXT NOT NULL",
                'message_type':"ALTER TABLE advocate_task_messages ADD COLUMN message_type VARCHAR(50) NULL DEFAULT 'general'",
                'created_at':  "ALTER TABLE advocate_task_messages ADD COLUMN created_at DATETIME NULL",
            }
            with engine.begin() as conn:
                for col_name, alter_sql in needed_cols.items():
                    if col_name not in existing_cols:
                        conn.execute(text(alter_sql))
                        print(f"advocate_task_messages: added missing column '{col_name}'")

        print("Advocate tasks tables migration complete.")
    except Exception as te:
        print(f"Error migrating tasks tables: {te}")

    # Start hearing reminder scheduler
    start_scheduler()


# Health check
@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}


# Routers
app.include_router(auth_router)
app.include_router(consultations_router)
app.include_router(finance_router)
app.include_router(client_router)
app.include_router(lawfirm_router)
app.include_router(permissions_router)
app.include_router(case_router)
app.include_router(dashboard_router)
app.include_router(tasks_router)