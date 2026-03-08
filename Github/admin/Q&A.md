# P06 Recovery Q&A (Answered Decision Log)

## A) Deadline & Grading Constraints
1. What is the exact final submission date/time?
   - Answer: Approximately 1.5 months remain (exact date/time not fixed yet).
2. What are the exact mandatory final deliverables (files/videos/demos/presentations)?
   - Answer: Primary focus is project demo and final presentation; repository must remain online; videos are recommended and being provided.
3. Is online hosting mandatory for the full stack, or is partial hosting acceptable if the full demo is reproducible locally?
   - Answer: Full-stack online hosting is mandatory.

## B) Deployment Decisions
4. Which deployment target do you want to commit to now?
   - Answer: Full stack hosted on one cloud VM.
5. Do you already have cloud resources/accounts available (AWS/Azure/GCP/DigitalOcean/etc.)?
   - Answer: Provider preference is Oracle first, Azure acceptable fallback.
6. Should we enforce Docker-only startup as the canonical path, or keep mixed local + Docker options?
   - Answer: Not finalized by user; recommended by Copilot: Docker-first canonical path for deployment/demo consistency.

## C) Scope & Feature Freeze
7. Which use-cases are strictly “must-demo” in final evaluation?
   - Answer: Flexible by team; core expectation is web app + DB + anomaly detection + mitigation flow.
8. Are UC-008/009/010 expected to be fully complete, or can they be partially completed with clear limitations?
   - Answer: Should do the job sufficiently; strict completeness not explicitly mandated.
9. Do you want to freeze new feature development and focus only on hardening + evidence packaging?
   - Answer: Continue feature development now, hardening/evidence packaging after.

## D) Team Allocation
10. Share your 4 teammates’ names and strengths (DevOps, backend, docs, testing, presentation).
   - Answer: Names not shared yet; all teammates currently available and capable.
11. Any teammate availability constraints over the next 2 weeks?
   - Answer: No major constraints.
12. Do you want me to convert the admin plan into person-wise daily assignments after you provide names?
   - Answer: No daily personal plan needed; general direction per person is preferred.

## E) Evidence & Presentation
13. Do you have existing demo videos that can be reused, or do all videos need to be re-recorded?
   - Answer: Videos need to be recorded (or refreshed) for current state.
14. Is there a required report template/format from LUMS for the final report?
   - Answer: No strict structured report template confirmed.
15. Do instructors require SonarQube/Docker live demos again in final evaluation?
   - Answer: Yes, live SonarQube and Docker demonstrations are expected.

## F) Governance & Risk
16. Are we allowed to remove legacy/insecure configs (e.g., hardcoded credentials) if we preserve functionality?
      - Answer: Yes.
17. Should we prioritize submission safety (stable, smaller scope) over adding ambitious new features?
      - Answer: Yes, prioritize submission safety first.
18. Any compliance/security constraints from supervisor (data retention, PII masking, logging restrictions)?
      - Answer: No major additional compliance constraints reported.

---

## Extra Clarification Added by User
- Full use-case list extends to UC-020.
- UC-001 to UC-015 are treated as completed baseline.
- Current active completion scope is UC-016 to UC-020.
- A Pandas-based AI analysis script is required as value-add:
   - classify outcomes as TP / FP / TN / FN,
   - support final narrative and rollback justification.

---

## What I will do immediately after your answers
- Produce a locked execution roadmap with dates.
- Generate owner-wise task board (You + 4 teammates).
- Produce a final deliverables checklist mapped to your exact grading rubric.
- Define go/no-go criteria for final submission day.
