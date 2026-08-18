import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database import engine

def sync_schema():
    with engine.connect() as conn:
        # Check SQLite or MySQL database for column presence
        try:
            conn.execute(text("ALTER TABLE advocates ADD COLUMN razorpay_key_id VARCHAR(255)"))
            print("Added razorpay_key_id column.")
        except Exception as e:
            print("razorpay_key_id column already exists or skipping:", e)
            
        try:
            conn.execute(text("ALTER TABLE advocates ADD COLUMN razorpay_key_secret VARCHAR(255)"))
            print("Added razorpay_key_secret column.")
        except Exception as e:
            print("razorpay_key_secret column already exists or skipping:", e)
            
        conn.commit()
        print("Schema sync completed successfully.")

if __name__ == "__main__":
    sync_schema()
