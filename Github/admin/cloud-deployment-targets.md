# Full-Stack Cloud VM Deployment Targets (Free-Tier First)

## Decision Goal
Pick one provider for full-stack hosting (API + DB + ELK + Wazuh + dashboards) with minimal cost and maximal demo reliability.

---

## Option 1 — Oracle Cloud Always Free (Recommended Primary)

## Why it fits this project
- Strong free-tier value for long-running VM workloads.
- Good fit for self-managed Docker Compose stack.
- Suitable for team objective: one shared VM for all 5 teammates.

## Risks
- Regional capacity constraints can block instance creation.
- Setup can be slightly more complex at first.

## Mitigation
- Create account + reserve instance early.
- Keep one backup provider path ready.

---

## Option 2 — Azure Student / Free Credits (Recommended Backup)

## Why it fits this project
- Familiar ecosystem and predictable VM tooling.
- Works well for demos and instructor-recognized cloud branding.

## Risks
- Free credits are time-limited.
- Cost risk after credit exhaustion if VM is left running.

## Mitigation
- Strict VM stop/start policy.
- Set billing alerts from day one.

---

## Option 3 — Other fallback VMs (DigitalOcean / AWS Lightsail / etc.)
- Use only if Oracle and Azure paths fail.
- Usually better predictability, but less free coverage.

---

## Recommended Selection Policy
1. Try Oracle first for sustained free hosting.
2. If blocked by provisioning limits, switch to Azure immediately.
3. Keep infrastructure scripts cloud-agnostic (Docker + env files + reverse proxy).

---

## Minimum VM Spec Target
- 4 vCPU preferred (2 vCPU minimum).
- 12 GB RAM preferred (8 GB minimum for reduced load).
- 100+ GB storage preferred.
- Ubuntu LTS recommended.

Note: ELK + Wazuh together are memory-heavy; undersized VMs will fail during demos.

---

## Mandatory Services on VM
- FastAPI backend
- SQLite/Postgres (as chosen)
- Elasticsearch
- Logstash
- Kibana
- Wazuh manager/indexer/dashboard
- Reverse proxy (Nginx/Caddy) for unified external access

---

## Networking & Access Checklist
- Open only required ports (80/443 + restricted admin ports).
- Keep dashboard/admin endpoints behind authentication.
- Enforce SSH key-based login.
- Disable default passwords before live demo.

---

## Team Deployment Workflow (Single Course)
1. One owner provisions VM and baseline OS hardening.
2. Repo clone + env file setup on VM.
3. Docker-first stack bring-up.
4. Health check + smoke tests.
5. Remaining teammates test via shared URLs and log issues.

---

## Immediate Next Action
- Start Oracle provisioning now.
- In parallel, prepare Azure fallback account and deployment notes.
