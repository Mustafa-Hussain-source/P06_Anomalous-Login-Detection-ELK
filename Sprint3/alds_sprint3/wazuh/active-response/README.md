# Active Response Scripts (ALDS Sprint 3)

Scripts consume a Wazuh JSON alert via STDIN and write results to SQLite.

## Environment
- Optional: `ALDS_DB_PATH` to override the default DB location.
- Default DB: `alds_sprint3/alds.db`.

## Scripts
- `account_lock.py` (UC-012)
- `ip_block.py` (UC-013)
- `session_kill.py` (UC-014)
- `mfa_stepup.py` (UC-015)

## Expected Alert Fields
- UC-012: `username`
- UC-013: `srcip` or `ip_address`
- UC-014: `user_id`
- UC-015: `username`

## Wazuh Wiring
See `ossec.conf.snippet` for active-response configuration examples.
Use `alert-sample.json` to test script input locally.
