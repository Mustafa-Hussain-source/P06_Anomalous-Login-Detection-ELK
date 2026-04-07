# Project: ALDS (Abnormal Login Detection System) — Sprint 2 (PO6)

**Team:** Mohammad Mustafa (26100286), Muhammad Aaffan Khan Niazi (26100015), Mustafa Hussain (26100399), Shehroz Faryad (25100022)


## LIST OF REQUIREMENTS COMPLETED IN THE SPRINT

* UC-008: Triage Alert in Kibana *(Developed by: Mohammad Mustafa | Status: Done)*

* UC-009: Contain Account *(Developed by: Shehroz Faryad | Status: In progress)*

* UC-010: Tune Detection *(Developed by: Mustafa Hussain | Status: In progress)*

* UC-011: Generate Weekly Report *(Developed by: Aaffan Khan Niazi | Status: Done)*

* Real-time authentication log collection using ELK Stack and Wazuh *(Developed by: Shehroz Faryad)*

* Detection of suspicious login patterns (e.g., brute-force attempts, location anomalies) *(Developed by: Aaffan Khan Niazi)*

* Dashboard-based monitoring and alert visualization *(Developed by: Mohammad Mustafa and Mustafa Hussain)*

* Alert generation and triage support *(Developed by: Mohammad Mustafa)*

* Weekly reporting functionality *(Developed by: Aaffan Khan Niazi)*
  

## HOW TO ACCESS THE SYSTEM

### 1) System Overview

The system detects abnormal login behavior in real time using:

* ELK Stack (Elasticsearch, Logstash, Kibana)
* Wazuh for security monitoring

### 2) Access Components

* **Kibana Dashboard:**
  Used for visualizing login activity and triaging alerts

* **Logstash Pipelines:**
  Process authentication logs and forward them to Elasticsearch

* **Wazuh:**
  Generates alerts based on defined security rules

*(Add URLs, credentials, or local setup instructions if required)*


## ADDITIONAL INFORMATION

* **Sprint Duration:** Dec 05, 2025 – January 25, 2026
* **Sprint Focus:** Real-time detection of unusual/suspicious login activity

### Key Functional Highlights

* Detection of:

  * Multiple rapid login attempts (brute-force behavior)
  * Sudden login location changes (potential account compromise)

* Provides:

  * Real-time alerts
  * Dashboard-based monitoring
  * Reduced manual log inspection

### Threat Modeling (STRIDE)

* Threat modeling is maintained as a continuous process
* Covers:

  * Spoofing
  * Tampering
  * Repudiation
  * Information Disclosure
  * Denial of Service
  * Elevation of Privilege

### Expected Outcomes

* Faster detection of suspicious login activity
* Reduced investigation time via dashboards
* Improved alert accuracy through tuning
* Structured weekly reporting for auditing

### Notes

* Sprint 2 establishes foundational capabilities for anomaly detection
* Detection rules and threat models are continuously refined in future sprints

