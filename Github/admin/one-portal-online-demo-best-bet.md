# One Portal Online Demo - Best Bet (Instructor-Facing)

Date: 2026-03-08
Context: Instructor requires online deployment and real-time demonstration from one portal.

## Executive Decision
Best bet is **Single-Origin Cloud Portal**:
- Deploy backend + portal together on one cloud VM.
- Serve everything from one public base URL (same origin).
- Keep GitHub Pages as a backup/static showcase, not primary live demo surface.

Why this is the safest path:
1. One URL looks clean and professional for grading.
2. No CORS or mixed-content issues during live demo.
3. Real-time UC trigger -> mitigation -> ticket/email status works with minimal moving parts.
4. Fast rollback if anything fails (restart one stack on one host).

## Recommended Deployment Shape
Primary provider:
- Oracle Always Free VM (as already recommended in `admin/cloud-deployment-targets.md`).
- Azure student VM as fallback if Oracle capacity blocks provisioning.

Runtime stack on VM:
- Reverse proxy: Caddy or Nginx.
- FastAPI service: ALDS app (`/api/*`).
- Static portal bundle: dashboard/portal (`/`).
- Optional: ELK/Wazuh internal services exposed only if needed for demo proof.

Public URL behavior:
- `https://<team-domain-or-ip>/` -> portal UI
- `https://<team-domain-or-ip>/api/...` -> backend endpoints

This gives true one-portal behavior.

## Why Not GitHub Pages As Primary Live Portal
GitHub Pages is static-only and cannot safely run server-side secrets for email/ticket actions.
If Pages is primary UI, backend must still live elsewhere and introduces cross-origin/runtime risk.

Practical policy:
- Primary live demo: single VM origin.
- Secondary artifact: GitHub Pages mirror that points to API for non-graded browsing.

## Demo-Critical Features To Show Live
1. Trigger UC-016 from portal and show mitigation evidence update.
2. Trigger UC-018 and show admin-block action recorded.
3. Trigger UC-019 and show:
   - Ticket created (persistent record).
   - Ticket emailed to mapped SOC username/email.
   - Delivery status visible in portal (`sent` or `failed` with reason).
4. Show logs/evidence feed updating in real time.

## Minimum Technical Commitments
1. Persist tickets in DB (not in-memory only).
2. Store username -> email mapping server-side.
3. Add email sender module with environment-based secrets.
4. Add endpoint(s):
   - `POST /api/simulate/uc-016`
   - `POST /api/simulate/uc-018`
   - `POST /api/simulate/uc-019`
   - `GET /api/tickets?limit=25`
   - `GET /api/sprint4/evidence?limit=25`
5. Add idempotency protection to avoid duplicate tickets from repeat clicks.

## 7-Day Execution Plan (Best Bet)
Day 1:
- Provision VM, DNS/IP, firewall, TLS.
- Deploy reverse proxy and verify one public URL.

Day 2:
- Deploy FastAPI service with systemd or Docker Compose.
- Route backend under `/api`.

Day 3:
- Add ticket persistence + ticket list API.
- Wire UC-019 runtime path to persistent ticket creation.

Day 4:
- Integrate email provider (SMTP/API), store delivery status.
- Add retry + failure logging.

Day 5:
- Build/adjust portal to call relative `/api` endpoints.
- Add ticket table + email status indicators.

Day 6:
- End-to-end rehearsal with instructor-style script.
- Capture evidence screenshots and fallback runbook.

Day 7:
- Buffer day for fixes, performance tune, and final dry run.

## Risk Controls (Live Demo Safety)
1. Keep local Docker fallback ready with same build.
2. Pre-load sample data and keep one known-good UC sequence.
3. Add health endpoint and quick restart script.
4. Use a demo mailbox to avoid provider throttling surprises.
5. Freeze code 24 hours before demo.

## Final Recommendation Statement
For grading reliability and real-time demonstration quality, use a **single cloud VM serving one URL for both portal and API**. Treat GitHub Pages as optional supporting showcase, not the primary live demo surface.
