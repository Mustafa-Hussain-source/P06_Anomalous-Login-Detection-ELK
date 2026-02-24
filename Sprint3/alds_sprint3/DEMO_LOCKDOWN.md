# Demo Lockdown Plan (Sprint 3 ALDS)

Date: 2026-02-24  
Goal: ship a credible, defensible IPS demo.

---

## What "locked tight" means

1. Detection: suspicious behavior is detected and classified (UC-012 to UC-015).
2. Prevention/Response: controls are actively enforced in runtime (not only logged).
3. Evidence: one timeline appears across API logs, mitigation log, and ELK/Wazuh views.

---

## Current State

Implemented:
- Account lock enforcement (UC-012) blocks login requests.
- Geofence enforcement (UC-013) blocks suspicious login requests.
- Session kill / MFA step-up actions are recorded and propagated as alerts.
- Event + mitigation telemetry is visible in ELK/Wazuh pipeline.

Open risk:
- Wazuh manager runtime wiring can vary by Docker shell/API compatibility.
- Keep deterministic local active-response proof as an alternate validation path.

---

## Must-have command checklist

```powershell
# Core IPS verification
.\scripts\demo_verify.ps1

# Apply Wazuh manager active-response wiring
.\scripts\enable_wazuh_active_response.ps1

# Verify wiring + deterministic local script proof
.\scripts\verify_wazuh_active_response.ps1

# Full one-command run
.\scripts\demo_run.ps1
```

---

## Definition of Done

- [x] Blacklisted IP login attempt is denied in real-time.
- [x] MFA-required user cannot complete normal login without challenge path.
- [x] UC-012 and UC-013 visibly prevent access (not only log).
- [x] One script verifies controls end-to-end.
- [x] Consistent TXT backend report is generated after each demo run.

---

## Scope statement

ALDS Sprint 3 implements an application-layer IPS solution that detects suspicious login behavior, enforces preventive controls in the auth flow, and records auditable security actions through an ELK/Wazuh monitoring pipeline.
