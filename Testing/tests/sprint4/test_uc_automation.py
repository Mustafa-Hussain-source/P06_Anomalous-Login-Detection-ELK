import json
import tempfile
import unittest
from pathlib import Path

from uc_automation import Sprint4AutomationEngine


class TestSprint4Automation(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.evidence_file = Path(self.temp_dir.name) / "evidence.jsonl"
        self.engine = Sprint4AutomationEngine(evidence_file=self.evidence_file)

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def _read_evidence(self) -> list[dict]:
        with self.evidence_file.open("r", encoding="utf-8") as handle:
            return [json.loads(line) for line in handle if line.strip()]

    def test_uc016_revokes_compromised_key_and_writes_evidence(self) -> None:
        result = self.engine.run_uc_action(
            "UC-016",
            {"user_id": "u-1", "api_key_id": "key-1", "compromised": True},
        )

        self.assertEqual(result.status, "success")
        self.assertTrue(self.evidence_file.exists())

        evidence = self._read_evidence()
        self.assertEqual(evidence[0]["uc_id"], "UC-016")
        self.assertEqual(evidence[0]["event"], "compromised_api_key_detected")
        self.assertEqual(evidence[0]["action"], "api_key_revoke")
        self.assertIn("timestamp", evidence[0])

    def test_uc018_blocks_only_high_risk_admin_console_login(self) -> None:
        skipped = self.engine.run_uc_action(
            "UC-018",
            {"username": "admin1", "is_admin_console": True, "risk_score": 0.30},
        )
        success = self.engine.run_uc_action(
            "UC-018",
            {"username": "admin1", "is_admin_console": True, "risk_score": 0.90},
        )

        self.assertEqual(skipped.status, "skipped")
        self.assertEqual(success.status, "success")
        self.assertIn("admin1", self.engine.blocked_admin_users)

    def test_uc019_creates_ticket_for_valid_entity(self) -> None:
        result = self.engine.run_uc_action(
            "UC-019",
            {"entity": "svc-account-01", "severity": "critical", "context": {"source": "siem"}},
        )

        self.assertEqual(result.status, "success")
        self.assertTrue(self.engine.tickets)
        self.assertTrue(self.engine.tickets[0]["ticket_id"].startswith("CT-"))

    def test_uc019_fails_when_entity_missing(self) -> None:
        result = self.engine.run_uc_action("UC-019", {"entity": ""})
        self.assertEqual(result.status, "failed")

    def test_unsupported_uc_fails(self) -> None:
        result = self.engine.run_uc_action("UC-999", {})
        self.assertEqual(result.status, "failed")
        self.assertEqual(result.action, "unsupported")


if __name__ == "__main__":
    unittest.main()
