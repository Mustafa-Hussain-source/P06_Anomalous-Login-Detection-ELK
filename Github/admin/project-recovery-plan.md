# P06 Project Recovery Admin Plan (March 2026)

## 1) Current Reality Check

### Strong assets already present
- Sprint 3 contains substantial runnable implementation (`FastAPI + SQLite + ELK + Wazuh + scripts`).
- End-to-end runbooks exist in Sprint 3 (`RUNNING_GUIDE.md`, `DEMO_LOCKDOWN.md`).
- Sprint 1 top-level README explains project objective/use-cases.
- Sprint 2 has a scope narrative and status table (UC-008 to UC-011).

### Gaps blocking final cohesion
- Major top-level deliverable docs are placeholders:
  - Root README has minimal content.
  - Requirements, Management Plan, Architecture docs are empty placeholders.
  - Testing strategy/results are placeholders.
  - Security reports are placeholders.
  - Final deliverables (Code/Presentation/Report) are placeholders.
  - Sprint 4 README is placeholder.
- Sprint review evidence indicates compliance misses in earlier checks (notably Sprint 2/prototype artifacts and demo expectations).
- Deployment references are inconsistent across docs (old paths still present in some sprint files).
- A risky credential exposure exists in Sprint 2 pipeline config (`simple-pipeline.conf` contains hardcoded secrets).

---

## 2) Instructor Review Signals (What this means)

- Sprint 1 review: mostly good, but SonarQube demo was missed.
- Sprint 2 review: evaluation deferred and marked largely incomplete at that checkpoint.
- Prototype review: partial score with missing code/readme/video packaging in prototype folder.

**Interpretation:** the project has technical depth, but grading risk is now mostly documentation, packaging, and demonstrable deployment consistency.

---

## 3) Unified 4-Sprint Synchronization Plan

## Sprint 1 (Foundation) -> Normalize as “Data + Detection Baseline”
- Freeze and document all implemented ingestion/detection UCs (Windows/Linux, brute-force, impossible travel, off-hours, privileged account watch).
- Link each UC to actual files/configs/evidence.
- Add “what is production-ready vs prototype-only” labels.

## Sprint 2 (Operationalization) -> Normalize as “SOC Workflow + Reporting”
- Finalize status of UC-008/009/010 (currently in-progress in docs).
- Keep UC-011 weekly report as completed and attach reproducible execution steps.
- Remove or sanitize hardcoded credentials from legacy configs.

## Sprint 3 (Execution Core) -> Normalize as “Deployable Security Platform”
- Treat Sprint 3 as source-of-truth runtime stack.
- Pin verified startup sequence and health checks.
- Produce one deterministic demo script + one deterministic verification script output bundle.

## Sprint 4 (Final Integration) -> Build as “Closure Sprint”
- Fill Sprint 4 README with closure objectives:
  - integration hardening,
  - final evidence package,
  - grading checklist closure,
  - final presentation narrative.
- Connect all prior sprints into one traceability table (UC -> implementation -> test -> evidence -> report section).

---

## 4) Deployability Plan (Requirement B)

## Definition of Deployable (must pass all)
1. Fresh machine setup works using a single documented path.
2. Services boot without manual file edits.
3. Health checks pass for API, Elasticsearch, Kibana, Wazuh dashboard/indexer.
4. At least 3 key scenarios are reproducibly demonstrated:
   - suspicious login detection,
   - mitigation/response action,
   - dashboard evidence.
5. Logs + screenshots + command outputs are saved in `Final-Deliverables/Code` and `Final-Deliverables/Report` references.

## Recommended deployment target strategy
- **Demo/Staging (required now):** local Docker Desktop + PowerShell scripted startup (already closest to current state).
- **Online hosting (for grading requirement):** choose one concrete host and scope it minimally:
  - Option A: host only FastAPI online + provide local ELK/Wazuh demo.
  - Option B: full cloud VM (ELK+Wazuh+API) if team has infra time.

**Best practical path for deadline safety:** ship a fully deterministic local deployment first, then add hosted API endpoint as incremental compliance evidence.

---

## 5) Team Task Split (You + 4 teammates)

## Owner 1 (You) - Program Integrator / Final QA
- Own master checklist, sprint synchronization, acceptance gate.
- Run final dry-runs and sign off “release candidate”.

## Owner 2 - Deployment & DevOps
- Harden docker compose startup, env files, secrets handling.
- Produce one-command startup/teardown scripts + health check report.

## Owner 3 - Detection Logic & Use-Case Traceability
- Verify each UC status and evidence.
- Build UC traceability matrix for report and presentation.

## Owner 4 - Documentation & Final Deliverables
- Fill placeholders: requirements, architecture, management plan, testing/security reports, final report/presentation readmes.
- Ensure all docs reference real artifacts/commands.

## Owner 5 - Testing & Evidence Packaging
- Build test matrix with expected/actual.
- Collect run outputs, screenshots, logs, demo videos, and review-ready artifacts.

---

## 6) 12-Day Rescue Schedule (Adjust once final deadline is confirmed)

## Days 1-2
- Freeze scope, confirm “must-submit” grading checklist.
- Remove secrets and align config paths.

## Days 3-4
- Validate end-to-end deployment from clean setup.
- Produce health-check script and baseline logs.

## Days 5-6
- Complete UC traceability table and close Sprint 2/3 status ambiguities.
- Draft Sprint 4 closure doc.

## Days 7-8
- Fill all placeholder project docs.
- Complete testing strategy, results, and security report content.

## Days 9-10
- Build final report storyline and presentation structure.
- Record/update required demo videos.

## Days 11-12
- Full rehearsal, repo cleanup, final evidence packaging.
- Instructor-style mock review and final submission lock.

---

## 7) Missing vs Needed vs Best Case

## Missing (currently absent/incomplete)
- Concrete requirements/spec content.
- Architecture documentation content.
- Testing strategy and results content.
- Security report content.
- Sprint 4 plan and closure documentation.
- Final deliverables content (code package notes, presentation notes, final report body).

## Needed (minimum to pass strongly)
- Deterministic deployment proof.
- Traceable mapping from use-cases to implementation/testing evidence.
- Complete, non-placeholder documentation package.
- Sanitized configs/secrets and consistent instructions.

## Best-case scenario
- One clean “from clone to demo” runbook executed successfully by anyone on the team.
- Full traceability matrix + tested UCs + polished report/presentation.
- Hosted component evidence included (at minimum API), plus local full-stack demo certainty.

---

## 8) Immediate Actions for Next 24 Hours

1. Confirm final submission date and mandatory grading checklist from instructor.
2. Decide hosting scope (API-only online vs full-stack online).
3. Remove exposed credentials from Sprint 2 config and move to environment variables.
4. Create a single source-of-truth root README that links sprint artifacts.
5. Start filling placeholder docs in order: Requirements -> Architecture -> Testing -> Security -> Final Report.

---

## 9) Confidence Assessment

- **Technical implementation confidence:** Medium-High (Sprint 3 appears substantial).
- **Submission/readiness confidence:** Medium-Low until documentation + evidence packaging is completed.
- **If plan above is executed with ownership discipline:** High chance to recover strongly before final submission.
