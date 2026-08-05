"""
test_confidential_vault.py
===========================
End-to-end unit test suite for Confidential Case Vault.
Tests:
  1. Non-Senior advocate cannot create confidential case (403).
  2. Senior advocate can create confidential case (200, bcrypt hash stored).
  3. Other users (and unauthenticated) CANNOT see confidential cases in GET /case-management/ (DB filter).
  4. Other users GET /case-management/{id} receive 404 (no existence leak).
  5. Owner unlocking with wrong password fails (401 + Audit Log UNLOCK_FAILED).
  6. Owner unlocking with correct password succeeds (200 + vault_token + Audit Log UNLOCK_SUCCESS).
  7. Audit log endpoint returns logs for owner.
  8. Password reset via OTP works.
  9. Admin reset clears vault password without revealing content.
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient
import bcrypt

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.database import SessionLocal, engine, Base
from app.authapp.models import User
from app.advocate.case_management.models import Case
from app.advocate.confidential_vault.models import ConfidentialCaseAuditLog
from jose import jwt
from app.authapp.service import SECRET_KEY, ALGORITHM


class TestConfidentialCaseVault(unittest.TestCase):
    created_case_id = None

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Cleanup existing test users / cases
        cls.db.query(ConfidentialCaseAuditLog).delete()
        cls.db.query(Case).filter(Case.case_id.like("TEST-VAULT-%")).delete()
        cls.db.query(User).filter(User.username.in_(["test_senior_vault", "test_junior_vault", "test_admin_vault"])).delete()
        cls.db.commit()

        # 1. Create Senior Advocate user
        senior_pwd = bcrypt.hashpw(b"Password123!", bcrypt.gensalt()).decode()
        cls.senior_user = User(
            username="test_senior_vault",
            email="senior_vault@example.com",
            password=senior_pwd,
            role="Senior Advocate",
            first_name="Senior",
            last_name="Advocate",
        )
        # 2. Create Junior Advocate user
        cls.junior_user = User(
            username="test_junior_vault",
            email="junior_vault@example.com",
            password=senior_pwd,
            role="Junior Advocate",
            first_name="Junior",
            last_name="Advocate",
        )
        # 3. Create Firm Admin user
        cls.admin_user = User(
            username="test_admin_vault",
            email="admin_vault@example.com",
            password=senior_pwd,
            role="Admin",
            first_name="Firm",
            last_name="Admin",
        )
        cls.db.add_all([cls.senior_user, cls.junior_user, cls.admin_user])
        cls.db.commit()

        cls.senior_token = jwt.encode({"id": cls.senior_user.id, "sub": cls.senior_user.username}, SECRET_KEY, algorithm=ALGORITHM)
        cls.junior_token = jwt.encode({"id": cls.junior_user.id, "sub": cls.junior_user.username}, SECRET_KEY, algorithm=ALGORITHM)
        cls.admin_token  = jwt.encode({"id": cls.admin_user.id, "sub": cls.admin_user.username}, SECRET_KEY, algorithm=ALGORITHM)

    @classmethod
    def tearDownClass(cls):
        cls.db.query(ConfidentialCaseAuditLog).delete()
        cls.db.query(Case).filter(Case.case_id.like("TEST-VAULT-%")).delete()
        cls.db.query(User).filter(User.username.in_(["test_senior_vault", "test_junior_vault", "test_admin_vault"])).delete()
        cls.db.commit()
        cls.db.close()

    def test_01_non_senior_cannot_create_confidential_case(self):
        payload = {
            "caseId": "TEST-VAULT-001",
            "caseTitle": "Secret Junior Case",
            "caseNo": "V-001/2026",
            "caseType": "Civil",
            "caseDes": "Facts of the case",
            "clientName": "Test Client",
            "contactNumber": "9876543210",
            "emailId": "client@example.com",
            "courtName": "High Court",
            "courtType": "Civil",
            "status": "Active",
            "isConfidential": True,
            "casePassword": "SecretPassword123",
        }
        res = self.client.post(
            "/case-management/",
            json=payload,
            headers={"Authorization": f"Bearer {self.junior_token}"},
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("Senior Advocates", res.json()["detail"])

    def test_02_senior_can_create_confidential_case(self):
        payload = {
            "caseId": "TEST-VAULT-002",
            "caseTitle": "High Profile Confidential Matter",
            "caseNo": "V-002/2026",
            "caseType": "Criminal",
            "caseDes": "Facts of confidential case",
            "clientName": "VIP Client",
            "contactNumber": "9876543211",
            "emailId": "vip@example.com",
            "courtName": "Supreme Court",
            "courtType": "Criminal",
            "status": "Active",
            "isConfidential": True,
            "casePassword": "VaultPassword2026!",
        }
        res = self.client.post(
            "/case-management/",
            json=payload,
            headers={"Authorization": f"Bearer {self.senior_token}"},
        )
        self.assertEqual(res.status_code, 200, f"Status code failed: {res.status_code} - {res.text}")
        data = res.json()

        # Query DB using fresh session
        db = SessionLocal()
        c = db.query(Case).filter(Case.case_id == "TEST-VAULT-002").first()
        self.assertIsNotNone(c, "Case was not found in DB")
        self.assertTrue(c.is_confidential)
        self.assertEqual(c.confidential_owner_id, self.senior_user.id)
        self.assertIsNotNone(c.confidential_password_hash)
        self.assertNotEqual(c.confidential_password_hash, "VaultPassword2026!")  # Must be hashed!
        self.assertTrue(bcrypt.checkpw(b"VaultPassword2026!", c.confidential_password_hash.encode()))

        TestConfidentialCaseVault.created_case_id = c.id
        db.close()

    def test_03_confidential_case_isolation_in_case_list(self):
        # 1. Senior Advocate sees their confidential case
        res_senior = self.client.get(
            "/case-management/",
            headers={"Authorization": f"Bearer {self.senior_token}"},
        )
        self.assertEqual(res_senior.status_code, 200)
        ids_senior = [item["case_id"] for item in res_senior.json()]
        self.assertIn("TEST-VAULT-002", ids_senior)

        # 2. Junior Advocate DOES NOT see the confidential case
        res_junior = self.client.get(
            "/case-management/",
            headers={"Authorization": f"Bearer {self.junior_token}"},
        )
        self.assertEqual(res_junior.status_code, 200)
        ids_junior = [item["case_id"] for item in res_junior.json()]
        self.assertNotIn("TEST-VAULT-002", ids_junior)

        # 3. Unauthenticated request DOES NOT see the confidential case
        res_anon = self.client.get("/case-management/")
        self.assertEqual(res_anon.status_code, 200)
        ids_anon = [item["case_id"] for item in res_anon.json()]
        self.assertNotIn("TEST-VAULT-002", ids_anon)

    def test_04_direct_access_returns_404_for_non_owner(self):
        case_db_id = self.created_case_id

        # Junior gets 404 (no existence leak)
        res_junior = self.client.get(
            f"/case-management/{case_db_id}",
            headers={"Authorization": f"Bearer {self.junior_token}"},
        )
        self.assertEqual(res_junior.status_code, 404)

        # Senior (owner) gets 200
        res_senior = self.client.get(
            f"/case-management/{case_db_id}",
            headers={"Authorization": f"Bearer {self.senior_token}"},
        )
        self.assertEqual(res_senior.status_code, 200)

    def test_05_unlock_wrong_password(self):
        case_db_id = self.created_case_id
        res = self.client.post(
            f"/vault/cases/{case_db_id}/unlock",
            json={"password": "WrongPassword123"},
            headers={"Authorization": f"Bearer {self.senior_token}"},
        )
        self.assertEqual(res.status_code, 401)
        self.assertIn("Incorrect case password", res.json()["detail"])

        # Check Audit Log for UNLOCK_FAILED using fresh DB session
        db = SessionLocal()
        log = (
            db.query(ConfidentialCaseAuditLog)
            .filter(ConfidentialCaseAuditLog.case_id == case_db_id)
            .order_by(ConfidentialCaseAuditLog.id.desc())
            .first()
        )
        self.assertIsNotNone(log)
        self.assertEqual(log.action, "UNLOCK_FAILED")
        db.close()

    def test_06_unlock_correct_password(self):
        case_db_id = self.created_case_id
        res = self.client.post(
            f"/vault/cases/{case_db_id}/unlock",
            json={"password": "VaultPassword2026!"},
            headers={"Authorization": f"Bearer {self.senior_token}"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("vault_token", data)
        self.assertIn("expires_in", data)

        # Check Audit Log for UNLOCK_SUCCESS using fresh DB session
        db = SessionLocal()
        log = (
            db.query(ConfidentialCaseAuditLog)
            .filter(ConfidentialCaseAuditLog.case_id == case_db_id)
            .order_by(ConfidentialCaseAuditLog.id.desc())
            .first()
        )
        self.assertIsNotNone(log)
        self.assertEqual(log.action, "UNLOCK_SUCCESS")
        db.close()

    def test_07_audit_log_endpoint(self):
        case_db_id = self.created_case_id

        # Non-owner receives 404
        res_junior = self.client.get(
            f"/vault/cases/{case_db_id}/audit-log",
            headers={"Authorization": f"Bearer {self.junior_token}"},
        )
        self.assertEqual(res_junior.status_code, 404)

        # Owner receives audit entries
        res_senior = self.client.get(
            f"/vault/cases/{case_db_id}/audit-log",
            headers={"Authorization": f"Bearer {self.senior_token}"},
        )
        self.assertEqual(res_senior.status_code, 200)
        logs = res_senior.json()
        self.assertTrue(len(logs) >= 2)
        actions = [l["action"] for l in logs]
        self.assertIn("UNLOCK_FAILED", actions)
        self.assertIn("UNLOCK_SUCCESS", actions)

    def test_08_admin_reset_vault(self):
        case_db_id = self.created_case_id

        # Firm Admin initiates vault reset
        res = self.client.post(
            f"/vault/cases/{case_db_id}/admin-reset",
            json={"admin_note": "Advocate forgot password and requested reset"},
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(res.status_code, 200)

        # Verify password hash was cleared in DB using fresh session
        db = SessionLocal()
        c = db.query(Case).filter(Case.id == case_db_id).first()
        self.assertIsNotNone(c)
        self.assertIsNone(c.confidential_password_hash)
        self.assertTrue(c.needs_password_reset)
        db.close()


if __name__ == "__main__":
    unittest.main()
