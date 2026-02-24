# ELK Stack with Wazuh Setup

This project provides a Docker Compose setup for an ELK stack (Elasticsearch, Logstash, Kibana) integrated with Wazuh for security monitoring and log analysis.

## Project Structure

```
elk-wazuh-compose
├── docker-compose.yml        # Defines the services for the ELK stack and Wazuh
├── .env                      # Environment variables for service configurations
├── config                    # Configuration files for each service
│   ├── elasticsearch
│   │   └── elasticsearch.yml # Elasticsearch configuration
│   ├── kibana
│   │   └── kibana.yml       # Kibana configuration
│   ├── logstash
│   │   └── logstash.conf     # Logstash configuration
│   ├── filebeat
│   │   └── filebeat.yml      # Filebeat config for Wazuh alerts
│   └── wazuh
│       └── wazuh.yml        # Optional Wazuh config (not mounted in simplified setup)
├── jdbc                      # SQLite JDBC driver (see jdbc/README.md)
├── api                       # API documentation
│   └── README.md            # API setup and usage instructions
└── README.md                # General project documentation
```

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd elk-wazuh-compose
   ```

2. Configure the environment variables in the `.env` file as needed.

3. Ensure the API has created the SQLite database:
   ```
   cd ..
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   This creates `alds.db` at the repo root when the API starts.

4. Download the SQLite JDBC driver and place it at:
   ```
   elk-wazuh-compose/jdbc/sqlite-jdbc.jar
   ```
   (See `elk-wazuh-compose/jdbc/README.md` for details.)

5. Start the services using Docker Compose:
   ```
   docker-compose up -d
   ```

6. Access the services:
   - Kibana: `http://localhost:5601`
   - Elasticsearch: `http://localhost:9200`
   - Wazuh API: `https://localhost:55000`
   - Wazuh Dashboard: `http://localhost:5602`
   - Wazuh Indexer: `http://localhost:9201`

### Additional Notes

- Ensure that the necessary ports are open and not blocked by firewalls.
- Review the configuration files in the `config` directory to customize the setup according to your needs.
- For API integration, refer to the `api/README.md` for detailed instructions on linking your API with the ELK stack and Wazuh.
- The simplified setup ingests API events via Logstash JDBC from `alds.db`.
- Ingested indices include:
   - `alds-login-events` (API login events via JDBC)
   - `wazuh-alerts` (Wazuh/mirrored security alerts JSON)
   - `wazuh-logs` (Wazuh manager/system logs such as `ossec.log`, `api.log`, `alerts.log`, `archives.log`)

- To mirror these indices into Wazuh Indexer/Wazuh Dashboard, run:
   - `powershell -ExecutionPolicy Bypass -File ..\scripts\sync_es_to_wazuh_indexer.ps1`

## License

This project is licensed under the MIT License. See the LICENSE file for more details.