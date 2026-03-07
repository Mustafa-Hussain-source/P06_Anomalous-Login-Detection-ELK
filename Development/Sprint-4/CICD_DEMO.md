# Sprint-4 CI/CD Demo Flow

## Objective
Demonstrate that code quality and tests run automatically on push/PR.

## Workflow Files
- `.github/workflows/ci-cd.yml`

## What `ci-cd.yml` Runs
1. Python setup (3.12).
2. Dependency install from `Development/Sprint-3/requirements.txt`.
3. Syntax compile check for Sprint-3 backend (`app`).
4. Syntax compile check for Sprint-4 automation files.
5. Sprint-4 unit tests (`test_uc_automation.py`).
6. Dependency consistency check (`pip check`).
7. Docker image build validation for Sprint-3 API (`Development/Sprint-3/Dockerfile`).
8. SonarCloud scan when `SONAR_TOKEN` secret is configured.

## Sonar Secret Behavior
1. If `SONAR_TOKEN` exists, Sonar scan runs in job `SonarQube Scan`.
2. If `SONAR_TOKEN` is missing, pipeline stays green and `SonarQube Scan` prints a skip note with setup guidance.

## Demo Steps (GitHub UI)
1. Push a commit to `main` or open/update a PR.
2. Open repository `Actions` tab.
3. Show `ci-cd` workflow run and successful `Python Checks` + `Docker Build Validation` jobs.
4. Show `SonarQube Scan`; if token is missing, show the skip note message in that job.
5. Open Sonar project dashboard and show quality status for latest commit.

## Evidence to Capture
- Screenshot of green `ci` run.
- Screenshot of SonarQube scan completion.
- URL of workflow run in report/demo notes.
