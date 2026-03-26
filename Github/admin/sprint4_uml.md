# Sprint-4 UML (PlantUML)

Note: If your PlantUML tool parses the whole Markdown file, it may fail on code fences (``` lines).
Use this raw file for direct rendering:
- `admin/sprint4_uml.puml`

## Use Case Diagram

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Security Analyst" as Analyst
actor "SIEM / Detection Engine" as SIEM

rectangle "ALDS Sprint-4 Automation" {
  usecase "UC-016\nAuto-Revoke\nCompromised API Keys" as UC016
  usecase "UC-018\nAuto-Block Admin\nConsole Logins" as UC018
  usecase "UC-019\nAutomated Containment\nTicket Creation" as UC019
  usecase "Write Mitigation\nEvidence (JSONL)" as UCEvidence
}

SIEM --> UC016
SIEM --> UC018
SIEM --> UC019

Analyst --> UC016
Analyst --> UC018
Analyst --> UC019

UC016 .> UCEvidence : <<include>>
UC018 .> UCEvidence : <<include>>
UC019 .> UCEvidence : <<include>>
@enduml
```

## Class Diagram

```plantuml
@startuml
skinparam classAttributeIconSize 0

class MitigationResult {
  +uc_id: str
  +action: str
  +status: str
  +reason: str
  +timestamp: str
}

class Sprint4AutomationEngine {
  -evidence_file: Path
  -revoked_api_keys: set<(str,str)>
  -blocked_admin_users: set<str>
  -tickets: list<dict>
  -_append_evidence(uc_id, event, action, status, details): void
  +uc_016_revoke_api_key(user_id, api_key_id, compromised): MitigationResult
  +uc_018_block_admin_login(username, is_admin_console, risk_score, threshold=0.85): MitigationResult
  +uc_019_create_containment_ticket(entity, severity, context): MitigationResult
  +run_uc_action(uc_id, payload): MitigationResult
}

class CLI {
  +_build_arg_parser()
  +_parse_payload(payload_json, payload_file)
}

Sprint4AutomationEngine --> MitigationResult : returns
CLI --> Sprint4AutomationEngine : creates/uses
@enduml
```

## Sequence Diagram (UC Dispatcher)

```plantuml
@startuml
actor "Caller (CLI/API)" as Caller
participant "Sprint4AutomationEngine" as Engine
participant "UC-016 Logic" as UC016
participant "UC-018 Logic" as UC018
participant "UC-019 Logic" as UC019
database "Evidence JSONL" as Evidence

Caller -> Engine : run_uc_action(uc_id, payload)

alt uc_id == "UC-016"
  Engine -> UC016 : uc_016_revoke_api_key(...)
  UC016 --> Engine : MitigationResult
  Engine -> Evidence : append UC-016 evidence
else uc_id == "UC-018"
  Engine -> UC018 : uc_018_block_admin_login(...)
  UC018 --> Engine : MitigationResult
  Engine -> Evidence : append UC-018 evidence
else uc_id == "UC-019"
  Engine -> UC019 : uc_019_create_containment_ticket(...)
  UC019 --> Engine : MitigationResult
  Engine -> Evidence : append UC-019 evidence
else unsupported uc_id
  Engine --> Caller : MitigationResult(status=failed, action=unsupported)
end

Engine --> Caller : MitigationResult
@enduml
```
