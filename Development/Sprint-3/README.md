# Project: ALDS Sprint 3

Team: Mohammad Mustafa (26100286), Muhammad Aaffan Khan Niazi (26100015), Mustafa Hussain (26100399), Shehroz Faryad (25100022)


## LIST OF REQUIREMENTS COMPLETED IN THE SPRINT

* FastAPI backend integrated with SQLite database *(Developed by: Aaffan Khan Niazi)*
* Dashboard interface for triggering simulations *(Developed by: Mustafa Hussain and Mohammad Mustafa)*
* Logstash pipeline configured to read from SQLite database *(Developed by: Shehroz Faryad)*
* Wazuh integration with custom rules *(Developed by: Shehroz Faryad)*
* Active response scripts for:

  * Account lock
  * IP blocking
  * Session termination
  * MFA step-up *(Developed by: Mustafa Hussain)*

---

## HOW TO ACCESS THE SYSTEM

### 1) Setup and Installation

* Navigate to project directory:
  cd "D:\LUMS\Spring'26\SPROJ P06\Sprint3\alds_sprint3"

* Install dependencies:
  pip install -r requirements.txt

### 2) Start the Backend API

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

### 3) Access the Dashboard

* Open the following file in your browser:
  dashboard/index.html

### 4) Configure and Run Logstash (WSL)

* Set environment variables:
  export SQLITE_JDBC_JAR=/home/alds/sqlite-jdbc.jar
  export ALDS_DB_PATH=/home/alds/alds.db

* Run Logstash:
  logstash -f /home/alds/logstash/pipeline.conf

### 5) Configure Wazuh

* Copy:
  wazuh/rules.xml
  into the Wazuh rules directory.

* Register active response scripts:

  * wazuh/active-response/account_lock.py
  * wazuh/active-response/ip_block.py
  * wazuh/active-response/session_kill.py
  * wazuh/active-response/mfa_stepup.py

### 6) Trigger System Events

* Use the dashboard buttons to generate simulation events.
  

## ADDITIONAL INFORMATION

* SQLite database is automatically created at:
  alds_sprint3/alds.db
  when the API starts.

* Ensure Logstash pipeline paths are correctly updated in:
  logstash/pipeline.conf

* Required project structure:

  * Backend: alds_sprint3/app
  * Dashboard: alds_sprint3/dashboard
  * Logstash: alds_sprint3/logstash
  * Wazuh: alds_sprint3/wazuh

