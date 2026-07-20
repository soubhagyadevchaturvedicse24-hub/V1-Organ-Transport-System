# Environment Variables Configuration
## Blockchain-Enabled Human Organ Transplantation & Smart Organ Transport Platform

This document describes the environment variables required to run the backend, frontend, and simulator services.

---

## 1. Backend Service Configuration (`backend/.env`)

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `PORT` | Port Express runs on | `5000` |
| `MONGODB_URI` | Connection string for MongoDB | `mongodb://mongodb-service:27017/organ_db` |
| `JWT_SECRET` | Secret key used to sign access tokens | `super-secret-key-string` |
| `JWT_REFRESH_SECRET` | Secret key used to sign refresh tokens | `another-secret-refresh-string` |
| `NODE_ENV` | Operating environment configuration | `development` / `production` |
| `BLOCKCHAIN_PEER_URL` | GRPC endpoint for target Fabric peer | `grpcs://peer0.org1.example.com:7051` |
| `BLOCKCHAIN_CA_URL` | Endpoint for the organization CA | `https://ca.org1.example.com:7054` |

---

## 2. Frontend Dashboard Configuration (`frontend/.env`)

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base API gateway URL | `http://localhost:5000/api/v1` |
| `VITE_WEBSOCKET_URL` | Socket.IO server connection endpoint | `http://localhost:5000` |

---

## 3. Virtual Device Simulator Configuration (`simulation/.env`)

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `SIMULATOR_GATEWAY_URL` | IoT Gateway Service registration URL | `http://localhost:5000/api/v1/iot` |
| `SIMULATOR_TICK_RATE_MS` | Telemetry report polling interval | `5000` |
| `SIMULATOR_DEVICE_UUID` | Target device identifier | `ESP32-BOX-7789A` |
