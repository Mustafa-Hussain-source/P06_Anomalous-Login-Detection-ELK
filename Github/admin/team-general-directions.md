# Team General Directions (Single Course Alignment)

## Direction 1 — Deployment Lead
- Own full-stack cloud VM setup end-to-end.
- Deliver one-command startup and one-command recovery.
- Maintain uptime and demo environment stability.

## Direction 2 — UC-016/017 Security Automation Lead
- Implement and validate API key revoke and VPN disable flows.
- Ensure each action leaves clear mitigation evidence in logs and DB.

## Direction 3 — UC-018/019 Security Orchestration Lead
- Implement admin-console block and automated containment ticketing.
- Ensure ticket payload has enough context for triage.

## Direction 4 — UC-020 + AI Validation Lead
- Implement rollback for false positives with strict audit log trail.
- Integrate Pandas-based classifier outputs for FP/FN/TP/TN analysis.

## Direction 5 (You) — Integrator + Demo Owner
- Enforce architecture consistency across all streams.
- Approve merge only when use case has code + test + evidence.
- Run bi-weekly demo rehearsal and final storyline control.

---

## Cross-Team Rules
1. No feature is “done” without dashboard/log evidence.
2. No merge without rollback-safe behavior for high-impact mitigations.
3. No environment drift: demo path is Docker-first and documented.
4. Every UC must map to: trigger -> detection -> mitigation -> verification evidence.

---

## Weekly Sync Format (30 minutes)
- 10 min: progress by UC.
- 10 min: blockers requiring cross-owner help.
- 10 min: demo-risk review and next gate confirmation.
