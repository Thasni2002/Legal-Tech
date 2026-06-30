import os
from dotenv import load_dotenv
import sqlalchemy
load_dotenv()
engine = sqlalchemy.create_engine(os.getenv('DATABASE_URL'))
try:
    with engine.connect() as conn:
        try:
            conn.execute(sqlalchemy.text("ALTER TABLE assigned_cases ADD COLUMN client_name VARCHAR(255) NULL;"))
            print("client_name column added successfully.")
        except Exception as e:
            print("client_name column error (might already exist):", e)
        try:
            conn.execute(sqlalchemy.text("ALTER TABLE assigned_cases ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;"))
            print("created_at column added successfully.")
        except Exception as e:
            print("created_at column error (might already exist):", e)
        conn.commit()
        print("Database migration complete.")
except Exception as e:
    print('Connection or query execution error:', e)
