Project: Anomalous Login Detection System (ALDS) - P06
Code: P06

Team: Names and IDs of Team Members
- Muhammad Aaffan Khan Niazi - 26100015
- Mustafa Hussain - <ID_PENDING>
- Shehroz Faryad - 25100022
- Team Member 4 - <ID_PENDING>
- Team Member 5 - <ID_PENDING>

SPRINT-4 SUBMISSION GUIDELINES

1. This "Readme" file is uploaded in the Sprint-4 folder.
2. Submission details are followed from the Project Deadlines document.

------------------------------------------------------------------------------------------------

LIST OF REQUIREMENTS COMPLETED IN THE SPRINT

Completed Use Cases:
- UC-016: Auto-Revoke Compromised API Keys
  Developer: Muhammad Aaffan Khan Niazi
- UC-018: Auto-Block Administrative Console Logins
  Developer: Muhammad Aaffan Khan Niazi
- UC-019: Automated Containment Ticket Creation
  Developer: Muhammad Aaffan Khan Niazi

Implemented artifacts:
- UC automation engine: `Development/Sprint-4/uc_automation.py`
- System tests for UC automation: `Development/Sprint-4/test_uc_automation.py`
- Sprint-4 test cases file: `Development/Sprint-4/ALDS_Test_Cases_10UC.xlsx`
- Mitigation evidence logs: `Development/Sprint-4/artifacts/*.jsonl`

------------------------------------------------------------------------------------------------

HOW TO ACCESS THE SYSTEM

Option 1: Run Sprint-4 UC automation locally
1. Open terminal in `Development/Sprint-4`.
2. Run sample UC workflow:
   `python uc_automation.py`
3. Run unit tests:
   `python -m unittest -v test_uc_automation.py`

Option 2: Run specific UC simulation
- UC-016:
  `python uc_automation.py --uc-id UC-016 --payload-json "{\"user_id\":\"u-7\",\"api_key_id\":\"key-9\",\"compromised\":true}"`
- UC-018:
  `python uc_automation.py --uc-id UC-018 --payload-json "{\"username\":\"admin-2\",\"is_admin_console\":true,\"risk_score\":0.97}"`
- UC-019:
  `python uc_automation.py --uc-id UC-019 --payload-json "{\"entity\":\"ip:185.93.50.10\",\"severity\":\"critical\",\"context\":{\"source\":\"siem\"}}"`

Evidence Output:
- Default evidence file: `Development/Sprint-4/sprint4_mitigation_evidence.jsonl`
- Artifact evidence files: `Development/Sprint-4/artifacts/runtime_mitigation_evidence.jsonl`, `Development/Sprint-4/artifacts/sprint4_demo_evidence.jsonl`

Credentials:
- No default user credentials are required for the local Sprint-4 UC simulation scripts.
- If deployed service credentials are needed for live infra, use the team deployment secrets file (not committed to repository).

------------------------------------------------------------------------------------------------

ADDITIONAL INFORMATION

- Sprint-4 secure coding/threat-modeling evidence is included in:
  `Development/Sprint-4/P06_Secure Coding-Threat Modeling_Sprint4.docx`
- Kubernetes manifests are available in:
  `Development/Sprint-4/k8s/`
- This README reflects the cleaned Sprint-4 folder structure after documentation pruning and artifact retention.
- Team member IDs can be finalized in this file before final submission.
