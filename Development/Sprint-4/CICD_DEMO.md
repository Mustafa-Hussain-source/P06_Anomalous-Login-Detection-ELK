# Sprint-4 CI/CD Demo Flow

## Objective
Demonstrate that code quality and tests run automatically on push/PR.

## Workflow Files
- `.github/workflows/ci.yml`
- `.github/workflows/build.yml`

## What `ci.yml` Runs
1. Python setup (3.12).
2. Dependency install from `Development/Sprint-3/requirements.txt`.
3. Syntax compile check for Sprint-3 backend (`app`).
4. Syntax compile check for Sprint-4 automation files.
5. Sprint-4 unit tests (`test_uc_automation.py`).
6. Dependency consistency check (`pip check`).

## What `build.yml` Runs
1. SonarQube scan via `SonarSource/sonarqube-scan-action@v6`.
2. Uses `SONAR_TOKEN` from repository secrets.

## Demo Steps (GitHub UI)
1. Push a commit to `main` or open/update a PR.
2. Open repository `Actions` tab.
3. Show `ci` workflow run and successful job steps.
4. Show `Build` workflow run and SonarQube scan step.
5. Open Sonar project dashboard and show quality status for latest commit.

## Evidence to Capture
- Screenshot of green `ci` run.
- Screenshot of SonarQube scan completion.
- URL of workflow run in report/demo notes.
