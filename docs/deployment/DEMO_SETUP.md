# Presentation & Demo Setup Guide
## Blockchain-Enabled Human Organ Transplantation & Smart Organ Transport Platform

This guide describes how to configure the platform for offline demonstrations, presentations, and hackathon showcases.

---

## 1. Demo Mode Configuration
To run a successful demo, we utilize the **Digital Twin Simulator** to animate dashboard states without relying on active network parameters or physical hardware sensors.

### Prerequisites
*   Ensure Docker is running locally.
*   Ensure no port conflicts exist on ports `3000`, `5000`, and `27017`.

---

## 2. One-Command Startup
The demo profile uses Docker Compose to pull and compile production assets into a single local container layout:

```bash
# Start all containers in the background
docker compose -f docker-compose.demo.yml up -d
```

This starts:
1.  **Nginx (Port 80/443)**: Serves the static compiled React Dashboard.
2.  **Express Backend**: The central orchestrator running in PM2 mode.
3.  **MongoDB**: Seeded with demo records (Hospitals, Doctors, Patients).
4.  **Fabric Test Network**: Validates matching consensus and generates blocks.
5.  **Virtual Device Simulator**: Automatically initiates a Raipur AIIMS to Nagpur Hospital transit run with simulated temperature breach triggers.

---

## 3. Running Specific Demo Scenarios
You can trigger pre-configured environmental alerts during your live demo to show the system's response:

```bash
# Re-run simulator with a specific scenario file
docker exec -it simulator-container node simulator-server.js --scenario <scenario_name>
```

### Available Scenarios
*   `normal-route`: Coordinates move smoothly. Temperature stays at 3.8°C.
*   `temperature-breach`: Temperature rises to 9.2°C. Triggers warning highlights and ledger alert blocks.
*   `tamper`: Simulates box lid intrusion. Triggers auditable alarms.
*   `network-loss`: Shows offline logging. Telemetry buffers locally, and syncs to the server when reconnected.
