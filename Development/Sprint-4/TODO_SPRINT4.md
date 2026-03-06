# Sprint 4 TODO (Simple)

Date started: 01-Mar-2026
Phase-I target: 08-Mar-2026
Final target: 29-Mar-2026

## Must Do First (Phase-I)
- [x] UC-016 implemented: auto-revoke compromised API keys.
- [x] UC-018 implemented: auto-block administrative console logins.
- [x] UC-019 implemented: automated containment ticket creation.
- [x] System test cases written and executed for UC-016/018/019.
- [x] STRIDE updates documented for new threat paths.
- [ ] SonarQube issues for Sprint-4 code fixed.
- [x] CI/CD demo flow prepared.
- [x] Kubernetes deployment demo prepared.

## Final Submission (Sprint-4 Final)
- [ ] Architecture updates completed.
- [ ] README and plan updates completed.
- [ ] AI test cases and testing evidence completed.
- [ ] Final 3–4 minute demo video recorded.

## Notes
- Keep all new Sprint-4 implementation code in this folder first, then integrate with Sprint-3 runtime.
- Any mitigation added must generate verifiable evidence (event + action + timestamp).

## Progress Update (06-Mar-2026)
- Implemented `uc_automation.py` engine with dispatch, validation, and JSONL evidence logging.
- Added `test_uc_automation.py` system tests and executed all tests successfully.
- Integrated Sprint-4 UC-016/018/019 runtime calls into Sprint-3 `app/main.py` login mitigation flow.
- Added CI/CD demo runbook in `CICD_DEMO.md` and aligned workflow checks to Sprint-3/Sprint-4 paths.
- Added Kubernetes manifests in `k8s/` and demo runbook in `KUBERNETES_DEMO.md`.
- Added SonarQube demo runbook in `SONAR_DEMO.md` and scoped `sonar-project.properties` to Sprint-3/Sprint-4 code.
