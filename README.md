# Blockchain-Enabled Human Organ Transplantation & Smart Organ Transport Platform

## Project Overview
This project is an advanced platform designed to securely manage human organ transplantation processes. It leverages an event-driven architecture with MongoDB for operations and Hyperledger Fabric to guarantee auditability, regulatory compliance, and anti-trafficking measures. A Smart Organ Transport box (ESP32 / Virtual Simulator) provides real-time cold-chain validation via IoT sensors.

## Tech Stack
- **Backend:** Node.js, Express.js
- **Frontend:** React, Vite
- **Database:** MongoDB
- **Blockchain:** Hyperledger Fabric
- **IoT Simulation:** Node.js (Virtual Device Simulator)
- **Monorepo Tools:** NPM Workspaces, ESLint, Prettier, Husky

## Folder Structure
```
Organ-Transport-System/
├── backend/          # Express API server
├── frontend/         # React SPA
├── docs/             # Architecture and design documentation
├── simulation/       # ESP32 Virtual Simulator
├── blockchain/       # Hyperledger Fabric chaincode and config
├── docker-compose.yml
└── package.json
```

## Startup Instructions
1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Environment setup:**
   Copy `.env.example` to `.env` and fill in necessary values.
4. **Start Development Servers (Backend + Frontend):**
   *(Currently, navigate to `backend/` and `frontend/` respectively and run `npm run dev`)*

## Workspace Commands
- `npm run lint`: Runs ESLint across all workspaces.
- `npm run format`: Runs Prettier to format codebase.
- `npm run prepare`: Installs Husky hooks.

## Branch Strategy
We follow a disciplined branch strategy:
- `main` - Production-ready, tagged releases.
- `develop` - Integration branch for all features.
- `feature/*` - Active sprint development (e.g., `feature/authentication`).

All features are reviewed and merged into `develop` using a `--no-ff` strategy.

## Milestones

| Tag | Milestone | Status |
|-----|-----------|--------|
| `architecture-v1.0` | Architecture Freeze | ✅ Complete |
| `sprint-1-complete` | Sprint 1 — Project Bootstrap | ✅ Complete |
| `v0.2.0-auth` | Sprint 2 — Authentication & RBAC | ✅ Complete |
| `v0.3.0-hospital` | Sprint 3 — Hospital Module | ✅ Complete |
| `v0.4.0-donor` | Sprint 4 — Donor Module | ✅ Complete |
| `v0.5.0-organ` | Sprint 5 — Recipient & Organ Module | ✅ Complete |
| `v0.6.0-matching` | Sprint 6 — Matching Engine | ✅ Complete |
| `v0.7.0-transport`| Sprint 7 — Transport & IoT Simulator | ✅ Complete |
| `v0.8.0-blockchain`| Sprint 8 — Blockchain Integration | ✅ Complete |
| — | Sprint 9 — Dashboard UI | ⬜ Pending |
| — | Sprint 10 — Testing & Production Readiness | ⬜ Pending |

## Sprint Roadmap
- [x] **Sprint 1:** Project Bootstrap
- [x] **Sprint 2:** Authentication & RBAC (`v0.2.0-auth`)
- [x] **Sprint 3:** Hospital Module (`v0.3.0-hospital`)
- [x] **Sprint 4:** Donor Module (`v0.4.0-donor`)
- [x] **Sprint 5:** Organ Module (`v0.5.0-organ`)
- [x] **Sprint 6:** Matching Algorithm (`v0.6.0-matching`)
- [x] **Sprint 7:** Transport & IoT Simulator (`v0.7.0-transport`)
- [x] **Sprint 8:** Blockchain Integration (`v0.8.0-blockchain`)
- [ ] **Sprint 9:** Dashboard UI
- [ ] **Sprint 10:** Test/Demo
