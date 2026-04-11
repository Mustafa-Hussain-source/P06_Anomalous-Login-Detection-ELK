# Integrated Backend + Frontend Smoke Run

Generated: 2026-04-06T13:20:10.730521+00:00
Backend: http://127.0.0.1:8010
Frontend: http://127.0.0.1:4173

## Summary

- Total checks: 4
- Passed: 4
- Failed: 0

## Checks

| Name | Passed | Detail |
|---|---|---|
| frontend_served | True | status=200 length=465 |
| backend_ingestion_health | True | status=healthy |
| backend_kpi_payload | True | keys=['avg_risk', 'blocked_events', 'false_positive_rate', 'mitigations', 'mttd_seconds'] |
| backend_weekly_payload | True | events_total=65 |