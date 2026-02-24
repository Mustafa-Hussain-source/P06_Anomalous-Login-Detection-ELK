# API Documentation for ELK-Wazuh Stack

## Overview

This document provides information about the API that integrates with the ELK (Elasticsearch, Logstash, Kibana) stack and Wazuh for security monitoring and log analysis.

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd elk-wazuh-compose
   ```

2. **Configure Environment Variables**
   - Update the `.env` file with the necessary environment variables for your setup.

3. **Start the ELK-Wazuh Stack**
   ```bash
   docker-compose up -d
   ```

4. **Access the API**
   - The API will be available at `http://localhost:<api-port>`, where `<api-port>` is defined in your configuration.

## Usage Examples

- **Get Logs**
  - Endpoint: `GET /api/logs`
  - Description: Retrieve logs from the ELK stack.

- **Send Alert**
  - Endpoint: `POST /api/alert`
  - Description: Send an alert to Wazuh for processing.

## API Endpoints

- **/api/logs**
  - Method: `GET`
  - Description: Fetch logs from the ELK stack.

- **/api/alert**
  - Method: `POST`
  - Description: Submit an alert to Wazuh.

## Additional Notes

- Ensure that the ELK stack and Wazuh services are running before accessing the API.
- Refer to the main `README.md` for more details on the overall project setup and configuration.