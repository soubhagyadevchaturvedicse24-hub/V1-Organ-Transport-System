# Local Development Setup Guide
## Blockchain-Enabled Human Organ Transplantation & Smart Organ Transport Platform

This guide describes how to configure your local machine to run and test the development profile.

---

## 1. Prerequisites
Ensure you have the following software installed:
*   **Node.js**: Version 18.x or 20.x
*   **Docker & Docker Compose**: For running MongoDB and Hyperledger test network
*   **Git**: Version 2.40+
*   **Bruno**: For API execution and testing

---

## 2. Setting Up the Project

### Clone Repository
```bash
git clone <repository_url>
cd Organ-Transport-System
```

### Install Dependencies
Both the `backend` and `frontend` contain their own dependencies:
```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

---

## 3. Starting the Services

### 1. Database & Blockchain
Run the local Docker Compose file to start MongoDB and the Fabric test network:
```bash
# From the project root
docker compose -f docker-compose.dev.yml up -d
```

### 2. Express Backend
Launch the Express server in development (auto-reload) mode:
```bash
cd backend
npm run dev
```
The server will boot on `http://localhost:5000`.

### 3. React Frontend
Launch the Vite development server:
```bash
cd frontend
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### 4. Virtual Device Simulator
Launch the simulated tracking box scenario:
```bash
cd simulation
node simulator-server.js --scenario normal-route
```

---

## 4. API Testing (Bruno)
1.  Open **Bruno**.
2.  Import the collection located in `tests/bruno/`.
3.  Set the active environment to `Local-Dev`.
4.  Run the `/auth/login` request to receive a JWT access token.
