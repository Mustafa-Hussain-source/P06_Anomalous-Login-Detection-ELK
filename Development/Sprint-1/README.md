# Anomalous Login Detection via ELK Stack  
### Group Number: P06

![Status](https://img.shields.io/badge/Status-Completed-brightgreen)
![ELK](https://img.shields.io/badge/ELK%20Stack-Elastic%2FLogstash%2FKibana-blue)
![Security](https://img.shields.io/badge/Category-Cybersecurity-red)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## Project Overview
This project focuses on building an Anomalous Login Detection System using the ELK Stack (Elasticsearch, Logstash, Kibana).  
The system centralizes authentication logs from Windows and Linux environments and applies correlation rules to identify login-based security threats, including:

- Suspicious logins outside normal working hours  
- Impossible travel events  
- Brute-force attempts  
- Privileged account misuse  
- Kerberos/NTLM anomalies  
- Linux SSH authentication anomalies  

The system provides SIEM-style visibility through Kibana dashboards and alerting mechanisms.

---

## Objectives
- Deploy and configure a complete ELK pipeline  
- Collect and process authentication logs from Windows and Linux hosts  
- Implement detection rules for anomalous login behaviors  
- Build dashboards and alerting workflows in Kibana  
- Enhance visibility into identity-related threats  

---

## Completed Use Cases
The following use cases were developed and completed during the project:

### UC-001: Collect Winlogon/NTLM/Kerberos Events from Windows Endpoints
- Forwarded Windows Security Logs using Winlogbeat  
- Parsed authentication events using Logstash pipelines  

### UC-002: Ingest Linux SSH Authentication Logs
- Collected SSH authentication logs (`/var/log/auth.log` or `secure`)  
- Standardized fields for cross-platform correlation  

### UC-003: Detect Brute Force Attempts
- Correlation rules for repeated failed logins in a short timeframe  
- Dashboard visualizing offending users and IP addresses  

### UC-004: Detect Impossible Travel
- Implemented GeoIP enrichment  
- Detected logins originating from distant geographic locations within unrealistic time windows  

### UC-005: Off-Hours Login Detection
- Developed baselines for user working hours  
- Alerts triggered for off-hours authentication events  

### UC-007: Privileged Account Watch
- Monitored logins by privileged or administrative accounts  
- Added detection logic for high-risk account usage  

---

## System Architecture

```text
Windows Endpoints → Winlogbeat → Logstash → Elasticsearch
Linux Endpoints   → Filebeat    → Logstash → Elasticsearch
                                     ↓
                                   Kibana
                              (Dashboards and Alerts)

