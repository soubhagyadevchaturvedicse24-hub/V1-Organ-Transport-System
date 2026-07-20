# Software Requirements Specification (SRS)
## Blockchain-Enabled Human Organ Transplantation & Smart Organ Transport Platform

This document describes the functional requirements, non-functional constraints, system actors, and core use cases for the platform.

---

## 1. Introduction
This Software Requirements Specification (SRS) defines the operational scope, validation parameters, and system actors for the Blockchain-Enabled Human Organ Transplantation & Smart Organ Transport Platform. 

The system enforces Indian transplantation laws (Transplantation of Human Organs Act - THOTA), implements permissioned ledgers (Hyperledger Fabric) to prevent queue tampering, and tracks transit parameters (temperature, GPS location, box tampering) using ESP32 edge devices.

---

## 2. System Actors
The system defines the following actors:

1.  **Administrator**: Manages user enrollment, hospital directories, and device configurations.
2.  **NOTTO Officer**: Oversees national matching allocations and approves policy overrides.
3.  **ROTTO Officer**: Coordinates regional organ matching and audits regional waitlists.
4.  **SOTTO Officer**: Manages state-level registries, verifies brain death certificates, and audits local matching outcomes.
5.  **Hospital Coordinator**: Registers patient details, updates waitlist candidates, logs harvested organs, and dispatches transport containers.
6.  **Doctor (Surgeon)**: Evaluates organ viability, approves matched candidates, and logs transplant surgeries.
7.  **Courier / Transport Team**: Operates physical transport boxes and updates transit statuses.
8.  **Auditor / Inspector**: Reviews system transaction logs and verifies database files against blockchain hashes.
9.  **Virtual Device Simulator**: Emulates ESP32 telemetry feeds to support automated testing.

---

## 3. Functional Requirements

### 3.1 User Management & Security
*   **FR-1.1 (Login/Auth)**: Users must log in using an email and password, receiving a secure JWT access token.
*   **FR-1.2 (Role-Based Access Control)**: Enforces role permissions at the API gateway to restrict access based on user roles.
*   **FR-1.3 (Device Enrollment)**: Administrators must register ESP32 devices by recording their UUID and hardware-bound public key hash before deployment.

### 3.2 Patient & Waitlist Registries
*   **FR-2.1 (Donor Registry)**: Hospital coordinators register donor clinical data, blood types, HLA profiles, and next-of-kin consent files.
*   **FR-2.2 (Recipient waitlist)**: Hospital coordinators register waiting patients, listing their urgency scores and HLA profiles. SOTTO nodes must verify entries before they are placed in active matching queues.
*   **FR-2.3 (Brain Death Verification)**: SOTTO officers must upload brain death certificates signed by two doctors before matching operations can start.

### 3.3 Organ Harvesting & Matching Engine
*   **FR-3.1 (Organ harvest log)**: Surgeons log harvested organ details, anatomical parameters, and the cold ischemic limit timer.
*   **FR-3.2 (Priority Allocation)**: The matching engine matches candidates based on tissue compatibility, waitlist seniority, and geographic distance, logging the prioritized candidate list to the blockchain.

### 3.4 Transport & Telemetry Monitoring
*   **FR-4.1 (Dispatch Locking)**: The transport box locks electronically when the courier scans an authorized RFID card, triggering the transit phase.
*   **FR-4.2 (Live Tracking)**: Devices transmit coordinates, temperatures, and battery levels every 10 seconds.
*   **FR-4.3 (Breach Alarms)**: If the temperature limits (e.g. above 6°C) are exceeded, the device activates the local buzzer, alerts the backend, and registers the event on the blockchain.
*   **FR-4.4 (Offline Sync)**: If cellular/WiFi connection drops, the device buffers logs locally and uploads them once connection is restored.
*   **FR-4.5 (Secure Delivery)**: The box unlocks at the destination only when the receiving doctor scans their RFID card.

### 3.5 Compliance & Auditing
*   **FR-5.1 (Ledger Verification)**: Inspectors query the blockchain to check database logs against ledger hashes to verify data integrity.
*   **FR-5.2 (Performance Reports)**: Generates performance summaries, listing transit metrics and cold-chain compliance statistics.

---

## 4. Non-Functional Requirements

### 4.1 Security & Regulatory Compliance
*   **NFR-1.1 (THOTA Alignment)**: Allocation logic must match the priority weights defined by Indian national organ allocation rules.
*   **NFR-1.2 (Data Isolation)**: Patient names and clinical details must be encrypted. Only anonymized cryptographic hashes are allowed on the blockchain.
*   **NFR-1.3 (Security)**: Connections require TLS 1.3 encryption. Passwords must use industry-standard adaptive hashing.

### 4.2 Availability & Reliability
*   **NFR-2.1 (Uptime)**: Backend API gateway service target availability is 99.9%.
*   **NFR-2.2 (Fault Tolerance)**: Telemetry logs are stored in local flash memory during network drops to prevent data loss.

### 4.3 Performance & Scalability
*   **NFR-3.1 (Latency)**: API requests respond within 200ms.
*   **NFR-3.2 (Throughput)**: The IoT gateway handles up to 500 telemetry messages per second.
*   **NFR-3.3 (Scalability)**: Telemetry collections use database sharding to distribute storage loads across servers.

---

## 5. System Use Cases

```mermaid
usecaseDiagram
    actor "Hospital Coordinator" as HC
    actor "SOTTO Officer" as SOTTO
    actor "Doctor" as Doc
    actor "Courier" as Cour

    HC --> (UC-002 Register Donor)
    HC --> (UC-003 Register Recipient)
    SOTTO --> (UC-004 Verify Brain Death)
    Doc --> (UC-005 Match Organ)
    HC --> (UC-006 Dispatch Organ)
    Cour --> (UC-007 Track Transport)
    Doc --> (UC-010 Complete Transplant)
```

### UC-001: User Login
*   **Actor**: All Users.
*   **Description**: Validates credentials and logs the user into the dashboard.
*   **Preconditions**: User has registered account.
*   **Flow**:
    1. User submits email and password.
    2. Backend verifies credentials against database hash.
    3. Server returns JWT access token and sets refresh cookie.

### UC-002: Register Donor
*   **Actor**: Hospital Coordinator.
*   **Description**: Registers donor profiles and consents.
*   **Preconditions**: Coordinator is logged in.
*   **Flow**:
    1. Coordinator inputs donor profile, blood type, and next-of-kin consent details.
    2. System saves records in MongoDB.
    3. System submits a transaction hash to the blockchain to log the registration event.

### UC-003: Register Recipient
*   **Actor**: Hospital Coordinator.
*   **Description**: Adds a patient to the waiting list.
*   **Preconditions**: Coordinator is logged in.
*   **Flow**:
    1. Coordinator submits patient details, blood type, and HLA profile.
    2. Patient details are stored in MongoDB.
    3. System calculates the patient's priority score.
    4. SOTTO node signs the registration transaction on-chain.

### UC-004: Verify Brain Death
*   **Actor**: SOTTO Officer.
*   **Description**: Confirms brain death certificates before matching begins.
*   **Preconditions**: Two doctor certificates have been uploaded.
*   **Flow**:
    1. SOTTO officer reviews brain death certificates.
    2. SOTTO officer submits approval confirmation.
    3. Blockchain logs the verification hash.

### UC-005: Match Organ
*   **Actor**: Allocation Engine, SOTTO/ROTTO Officer.
*   **Description**: Runs matching algorithms for harvested organs.
*   **Preconditions**: Donor and organ profiles are verified.
*   **Flow**:
    1. Officer runs the matching engine.
    2. Algorithm calculates priority scores based on tissue compatibility and distance.
    3. System generates the ranked candidate queue.
    4. Matches are logged onto the blockchain.

### UC-006: Dispatch Organ
*   **Actor**: Hospital Coordinator.
*   **Description**: Links transport box to the organ ID.
*   **Preconditions**: Organ is matched and recipient surgeon has accepted.
*   **Flow**:
    1. Coordinator inputs the transport box ID and sets destination.
    2. System registers the transport session.
    3. Box transitions to active monitoring mode.
    4. Blockchain logs the "Dispatched" transition.

### UC-007: Track Transport
*   **Actor**: Virtual Device Simulator / ESP32 Hardware, Courier.
*   **Description**: Monitors coordinates and temperatures during transit.
*   **Preconditions**: Box is locked and active.
*   **Flow**:
    1. Device transmits telemetry logs every 10 seconds.
    2. System routes coordinates to the live dashboard map.
    3. Backend verifies parameters stay within cold-chain limits.

### UC-008: Handle Temperature Breach
*   **Actor**: IoT Gateway Service, Courier, Doctor.
*   **Description**: Logs temperature alerts and triggers local alarms.
*   **Preconditions**: Temperature exceeds threshold limits.
*   **Flow**:
    1. Device detects breach and sends alert to the gateway.
    2. System logs the alert event on the blockchain.
    3. System sounds the box buzzer and sends warning notifications to the recipient hospital.
    4. Doctor reviews the alert and logs resolution notes on-chain.

### UC-009: Verify Blockchain Record
*   **Actor**: Auditor / Inspector.
*   **Description**: Compares database logs against blockchain hashes.
*   **Preconditions**: Inspector is logged in.
*   **Flow**:
    1. Inspector selects a record to audit (e.g. matching queue).
    2. System queries the Hyperledger Fabric ledger history.
    3. System calculates the database record hash and compares it against the ledger hash, flagging discrepancies.

### UC-010: Complete Transplant
*   **Actor**: Transplant Doctor.
*   **Description**: Closes the transplant file post-surgery.
*   **Preconditions**: Organ is delivered and transplant complete.
*   **Flow**:
    1. Doctor inputs surgery outcome metrics.
    2. System saves records in MongoDB.
    3. Blockchain logs the "Transplanted" transition, locking the case history.
