# Locked Roadmap — Sprint 4 to Final (March 2026)

## 0) Strategic Direction (Locked)
- Scope now centers on completing UC-016 to UC-020 while preserving UC-001 to UC-015 stability.
- Full-stack online hosting on one cloud VM is mandatory.
- Bi-weekly demos remain the primary grading pressure point.
- Feature work continues now; hardening and evidence packaging follow immediately after feature closure.
- SonarQube and Docker live demo readiness is mandatory.

---

## 1) Final Product Vision
A deployable full-stack IDS/IPS platform that shows:
1. Web application + persistent database.
2. Detection pipeline that flags suspicious behavior.
3. Automated mitigation (lock/block/terminate/step-up/revoke/disable).
4. Observable proof in dashboards/logs.
5. AI-assisted false-positive / false-negative classification as an analysis layer.

---

## 2) Delivery Scope by Use Cases

## Already completed baseline
- UC-001 to UC-015 (team-claimed complete; verification still required in one unified matrix).

## Sprint 4 completion target
- UC-016: Auto-Revoke Compromised API Keys
- UC-017: Auto-Disable VPN Access on Suspected Compromise
- UC-018: Auto-Block Administrative Console Logins
- UC-019: Automated Containment Ticket Creation
- UC-020: IPS Rollback on False Positives

---

## 3) Six-Week Execution Plan (1.5 months)

## Week 1 — Architecture Lock + UC-016/017 Build
- Freeze technical architecture for UC-016 to UC-020 integration.
- Implement UC-016 and UC-017 end-to-end (API + DB + mitigation logs + dashboard visibility).
- Start cloud VM provisioning track in parallel.

## Week 2 — UC-018/019 Build + Integration Testing
- Implement UC-018 and UC-019 end-to-end.
- Add integration tests for mitigation chains and failure scenarios.
- Demo checkpoint: show UC-016 to UC-019 working on local stack.

## Week 3 — UC-020 + Safety Controls
- Implement UC-020 rollback semantics with explicit audit trail.
- Ensure rollback cannot silently erase mitigation evidence.
- Demo checkpoint: show true-positive mitigation and false-positive rollback path.

## Week 4 — Cloud Full-Stack Deployment
- Deploy full stack to selected cloud VM.
- Harden startup scripts for one-command recovery.
- Validate external reachability, dashboard access, and stable runtime.

## Week 5 — AI Layer + Evidence Assembly
- Integrate Pandas-based model script for FP/FN/TP/TN analysis.
- Export reproducible metrics and confusion-matrix artifacts.
- Record all required videos and demo evidence.

## Week 6 — Final Lockdown
- Run full dress rehearsals (bi-weekly demo style + final presentation style).
- Complete placeholders in repo docs and final deliverables folders.
- Conduct go/no-go gate and freeze submission candidate.

---

## 4) Non-Negotiable Demo Gates

## Gate A (End Week 2)
- UC-016 to UC-019 trigger and mitigation visible in logs/dashboard.

## Gate B (End Week 3)
- UC-020 rollback works and creates explicit rollback evidence.

## Gate C (End Week 4)
- Same functionality demonstrated on cloud VM deployment.

## Gate D (End Week 6)
- SonarQube + Docker + end-to-end UC journey + AI FP/FN report all demo-ready.

---

## 5) Canonical Runtime Decision

## Recommended canonical path: Docker-first
Why:
- Team has 5 machines and needs identical behavior.
- Full-stack portability to cloud VM is easier with compose-based bootstrap.
- Demo recovery from failure is faster.

## Practical policy
- Docker-first is canonical for all demo and production-like runs.
- Local non-docker dev is allowed only for rapid coding, not for final proof.

---

## 6) Success Criteria (Final)
1. UC-001 to UC-020 mapped in one traceability matrix.
2. Cloud VM full-stack deployment runs consistently.
3. Mitigation + rollback paths are demonstrable and logged.
4. SonarQube and Docker demos are stable.
5. AI FP/FN analysis is included as “decision support,” not as mandatory enforcement.
