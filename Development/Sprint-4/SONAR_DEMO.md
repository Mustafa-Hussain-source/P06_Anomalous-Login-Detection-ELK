# SonarQube Demo and Evidence (Sprint-4)

## Objective
Close the Sprint-4 SonarQube requirement with verifiable CI evidence for changed Python code.

## Prerequisites
- Repository secret `SONAR_TOKEN` is configured in GitHub Actions secrets.
- `build.yml` workflow exists in `.github/workflows/`.
- `sonar-project.properties` is configured for Sprint-3/Sprint-4 code paths.

## What Gets Scanned
- `Development/Sprint-3/app`
- `Development/Sprint-4`

## Trigger a Sonar Scan
1. Commit and push your current branch.
2. Open GitHub Actions tab.
3. Run workflow `Build` (or trigger by push to `main`).
4. Confirm job `SonarQube` completes successfully.

## Evidence to Capture
- Screenshot of successful `SonarQube` job in Actions.
- Screenshot of Sonar project overview (Quality Gate status).
- Link to workflow run URL.
- Date/time of run and commit SHA.

## Phase-I Acceptance Criteria
- Sonar scan completes with no workflow failure.
- No new blocker/critical issues in modified Sprint-4 code.
- Evidence archived in Sprint-4 deliverables notes.

## Troubleshooting
- `SONAR_TOKEN` missing:
  - Add repository secret and rerun workflow.
- Analysis includes unexpected folders:
  - Check `sonar-project.properties` `sonar.sources` and `sonar.exclusions`.
- Quality Gate fails:
  - Open Sonar issue list, fix flagged code, push, and rerun.
