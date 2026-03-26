# Project Report — ALDS Sprint 3

**Prepared by:** Muhammad Aaffan Khan Niazi  
**Role:** SOC Intern, Ebryx  
**Date:** February 28, 2026

---

## 1) Executive Summary

This project delivers an Adaptive Login Defense System (ALDS) that combines application-layer prevention with SOC-style monitoring. The system detects risky login behavior, applies automatic mitigations in real time, and forwards evidence into ELK and Wazuh for operational visibility.

The implementation is demo-ready and focused on four core security use cases:
- UC-012: Brute-force detection with account lock enforcement
- UC-013: Geofence and blacklist-based IP blocking
- UC-014: Session hijack detection with forced session termination
- UC-015: Impossible-travel detection with MFA step-up enforcement

---

## 2) Project Objectives

The primary objectives were:
1. Build a practical IPS-style login defense workflow, not only alerting.
2. Ensure suspicious behavior leads to enforceable controls in runtime.
3. Produce auditable evidence through logs, mitigations, and dashboard data.
4. Provide deterministic simulation and verification scripts for reliable demos.

---

## 3) System Architecture Overview

The deployed stack integrates:
- **FastAPI backend (`app/main.py`)** for login handling, risk analysis, and mitigation logic.
- **SQLite database (`alds.db`)** for users, login events, session state, blacklist entries, and mitigation logs.
- **ELK pipeline** (Logstash + Filebeat + Elasticsearch + Kibana) for ingestion and analytics.
- **Wazuh manager/indexer/dashboard** for SOC-centric monitoring and active-response integration.
- **Automation scripts (`scripts/*.ps1`)** for end-to-end run, verification, and reporting.

High-level data flow:
1. Login requests are evaluated for suspicious patterns and risk.
2. Events are stored in `login_events` and actions in `mitigation_log`.
3. Logstash/Filebeat ingest data into Elasticsearch indices.
4. Sync scripts mirror Elasticsearch indices to Wazuh Indexer for dashboard parity.
5. Wazuh alert and active-response integration provides additional SOC evidence.

---

## 4) Security Controls Implemented

### UC-012 — Brute Force / Account Lock
- Detects repeated failed or malicious login attempts.
- Auto-locks user after repeated high-risk failures.
- Returns blocked outcomes (`account_locked_block`) for enforcement proof.

### UC-013 — Geofence + Blacklist Enforcement
- Flags geofence-violating logins (e.g., suspicious country context).
- Adds offending IPs into blacklist storage.
- Performs pre-auth hard block for blacklisted IPs.

### UC-014 — Session Hijack Response
- Detects device fingerprint anomalies for active users.
- Terminates existing active sessions for containment.
- Records session kill mitigation for audit trail.

### UC-015 — Impossible Travel + MFA Step-up
- Computes travel feasibility using geo-coordinates and login timing.
- Flags impossible travel behavior.
- Enforces MFA requirement instead of normal login completion.

---

## 5) Evidence and Verification

The project includes scripted verification and reporting:
- `scripts/demo_verify.ps1`: Validates API health and IPS behavior (UC-012/013/015 checks).
- `scripts/verify_wazuh_active_response.ps1`: Validates active-response wiring/proof path.
- `scripts/demo_run.ps1`: Orchestrates verification and report generation in one flow.
- `scripts/generate_demo_summary.ps1`: Produces backend evidence report.

From latest generated summary (`demo_reports/backend_summary_latest.txt`), evidence includes:
- 83 total events and 8 mitigation records captured in sample window.
- Blocking event evidence present for:
  - `account_locked_block`
  - `geofence_violation`
  - `ip_blacklist_block`
  - `mfa_challenge_required`
- Mitigation actions observed:
  - `account_lock`
  - `ip_block`
  - `session_kill`
  - `mfa_stepup`

This confirms both **detection** and **enforcement** are functioning in the implemented scenarios.

---

## 6) SOC Relevance (Ebryx Internship Perspective)

From a SOC intern perspective, this project demonstrates practical blue-team value:
- Alert triage support through normalized, contextual login telemetry.
- Containment and prevention actions tied to suspicious behavior.
- Repeatable evidence generation useful for incident reviews and demos.
- Cross-tool visibility (Kibana + Wazuh) aligned with monitoring workflows.

It bridges detection engineering, response automation, and SIEM observability in a single lab environment.

---

## 7) Challenges and Limitations

1. Wazuh runtime active-response wiring may vary by Docker shell/API compatibility.
2. Local demo environment uses default/lab credentials and should be hardened before production use.
3. SQLite is appropriate for prototyping; production deployments should use a hardened, scalable DB stack.

---

## 8) Recommendations for Next Phase

1. Integrate stronger identity controls (adaptive MFA provider + risk policy engine).
2. Add alert severity tuning and false-positive reduction logic.
3. Introduce persistent case management integration (e.g., SOC ticketing/IR workflow).
4. Add performance and load testing for high-event scenarios.
5. Harden secrets/auth configuration across ELK/Wazuh services.

---

## 9) Conclusion

ALDS Sprint 3 successfully implements an application-layer IPS demonstration with verifiable prevention outcomes and SIEM visibility. The system moves beyond passive logging by enforcing account lock, IP blocking, session invalidation, and MFA step-up based on threat indicators. With scripted verification and generated evidence reports, the project is suitable for academic evaluation, SOC demonstration, and future extension toward production-grade adaptive defense.
