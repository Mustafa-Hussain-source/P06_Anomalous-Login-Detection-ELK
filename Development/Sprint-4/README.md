### Project: Anomalous Login Detection System (ALDS) - P06
Code: P06

Team: Names and IDs of Team Members
- Muhammad Aaffan Khan Niazi - 26100015
- Mustafa Hussain - 26100399
- Shehroz Faryad - 25100022
- Mohammad Mustafa - 26100286

### LIST OF REQUIREMENTS COMPLETED IN THE SPRINT

Completed Use Cases:
- UC-016: Auto-Revoke Compromised API Keys
  Developer: Muhammad Aaffan Khan Niazi
- UC-018: Auto-Block Administrative Console Logins
  Developer: Muhammad Aaffan Khan Niazi
- UC-019: Automated Containment Ticket Creation
  Developer: Muhammad Aaffan Khan Niazi
- UC-017: Login Attempt from Blocked Geographic Region
  Developer: Shehroz Faryad
- UC-020: Password Spray Attack Detection & Temporary Access Restriction
  Developer: Shehroz Faryad

Implemented artifacts:
- UC automation engine: `Development/Sprint-4/uc_automation.py`
- System tests for UC automation: `Development/Sprint-4/test_uc_automation.py`
- Sprint-4 test cases file: `Development/Sprint-4/ALDS_Test_Cases_10UC.xlsx`
- Mitigation evidence logs: `Development/Sprint-4/artifacts/*.jsonl`
- Wazuh custom detection rules: `wazuh-docker/single-node/config/wazuh_manager/local_rules.xml`
- Logstash enrichment pipeline (GeoIP simulation): `elk-bridge/logstash/pipeline/wazuh.conf`
- ELK stack deployment: `elk-bridge/docker-compose.elk.yml`
- Test environment: Victim VM (Linux Mint with Wazuh agent) / Attacker VM (VPN-enabled for simulation)
- Attack simulation tools: Hydra (password spray simulation) SSH (manual failed login attempts)


------------------------------------------------------------------------------------------------

### HOW TO ACCESS THE SYSTEM

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

### HOW TO ACCESS THE SYSTEM (For UC-017 and UC-020)

Option 1: Run ELK Stack

Navigate to: elk-bridge
Run: docker compose -f docker-compose.elk.yml up -d

Ensure Wazuh manager is running separately from:
wazuh-docker/single-node

Option 2: Generate Attack Events

Password Spray Simulation:
hydra -L users.txt -p wrongpassword ssh://192.168.56.104 -t 4

Manual Failed Login:
ssh user1@192.168.56.104

Option 3: View Detection in Kibana

Open: http://localhost:5602
Go to Discover → wazuh-alerts-*

Example Queries:

Blocked Country Use Case:
use_case.name : "Blocked Country Login Attempt"

Password Spray Use Case:
rule.id : "100210"

Combined Filter (Demo):
rule.id : "5760" and simulated_geo.policy : "blocked_country"

Evidence Output:
Wazuh alerts log:
/var/ossec/logs/alerts/alerts.json
Elasticsearch index:
wazuh-alerts-*
Enriched fields include:
simulated_geo.country_name
simulated_geo.policy
use_case.name
tags

Credentials:

No default credentials required for simulation.
Test users created on victim VM (e.g., user1, user2).


GeoIP functionality is simulated using Logstash enrichment due to lab environment constraints.
Active Response is configured for temporary containment instead of permanent blocking.
The system demonstrates a full pipeline: detection (Wazuh), enrichment (Logstash), visualization (Kibana), and response (Active Response).


------------------------------------------------------------------------------------------------

### ADDITIONAL INFORMATION

- Sprint-4 secure coding/threat-modeling evidence is included in:
  `Development/Sprint-4/P06_Secure Coding-Threat Modeling_Sprint4.docx`
- Kubernetes manifests are available in:
  `Development/Sprint-4/k8s/`
- This README reflects the cleaned Sprint-4 folder structure after documentation pruning and artifact retention.
- Team member IDs can be finalized in this file before final submission.
