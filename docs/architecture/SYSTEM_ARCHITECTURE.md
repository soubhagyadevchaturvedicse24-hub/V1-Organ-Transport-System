# System Architecture Document
## Blockchain-Enabled Human Organ Transplantation & Smart Organ Transport Platform

This document details the software architecture, domain services, system diagrams, and engineering rationale for the Blockchain-Enabled Human Organ Transplantation & Smart Organ Transport Platform.

---

## 1. Project Overview
The procurement and transportation of human organs for transplantation is a high-stakes, time-critical domain plagued by operational inefficiencies, vulnerability to cold-chain excursions, lack of transparency, and susceptibility to unethical allocation. 

This platform provides an end-to-end, enterprise-grade solution that integrates:
*   A **React/Vite Frontend** for real-time visualization and role-based operational management.
*   A **Domain-Driven Modular Backend API Gateway** that orchestrates specialized business microservices.
*   A **MongoDB Database** for low-latency storage of operational, relational, and telemetry application states.
*   A **Hyperledger Fabric Blockchain Network** acting as an immutable audit trail and state machine to guarantee compliance with allocation rules (e.g., THOTA guidelines) and prevent tampering.
*   An **ESP32-based Smart Organ Transport Box** providing continuous tracking of environmental parameters (temperature, GPS location, box tampering, battery, and RFID access verification).

By combining these technologies, the system minimizes human error, prevents illicit transplantation, enforces strict temperature and handling compliance, and provides real-time visibility to transplant coordinators and surgical teams.

---

## 2. System Objectives
1.  **Strict Allocation Integrity**: Enforce local and national regulatory guidelines (such as India's THOTA - Transplantation of Human Organs Act) to prevent manual favoritism or queue tampering.
2.  **Immutability and Non-Repudiation**: Ensure that every transaction, status update, match outcome, and log is logged onto a permissioned ledger to provide auditability for regulatory authorities.
3.  **Real-Time Environmental & Location Tracking**: Continuously monitor organ transit parameters to enable alerts for temperature breaches, path deviations, or unauthorized physical box access.
4.  **Zero-Trust Identity Verification**: Ensure that only pre-authorized, authenticated medical and transport personnel can execute transitions (e.g., dispatching, transporting, opening the box).
5.  **Offline Resilience & Eventual Consistency**: Protect telemetry data from network drops during transport, buffering logs locally on the ESP32 and synchronizing them once connectivity is restored.

---

## 3. High-Level Architecture
The system employs a domain-driven modular architecture structured around clear separation of concerns, scalability, and physical boundaries:

```mermaid
graph TD
    User([Users / Hospital Staff]) -->|HTTPS / WSS| FE[React Frontend Dashboard]
    FE -->|API Gateway Interface| AG[API Gateway]
    
    subgraph Core Platform Services
        AG --> HS[Hospital Service]
        AG --> OS[Organ Service]
        AG --> TS[Transport Service]
        AG --> MS[Matching Engine Service]
        AG --> BS[Blockchain Service]
        AG --> NS[Notification Service]
        AG --> IS[IoT Gateway Service]
    end
    
    HS --> DB[(MongoDB)]
    OS --> DB
    TS --> DB
    MS --> DB
    NS --> DB
    IS --> DB
    
    BS --> BC[Hyperledger Fabric Blockchain]
    
    IoT[ESP32 Smart Transport Box] -->|HTTPS POST / MQTT| IS
```

### Architectural Rationale
*   **API Gateway Pattern**: Decouples the client dashboard from internal business logic services. This allows logging, rate limiting, and RBAC to be handled at a single entry point while the backend routes traffic to specialized services.
*   **Domain Service Separation**: Dividing business logic into specialized modules (Hospital, Organ, Matching, Transport, Blockchain, Notification, IoT Gateway) prevents code bloat and allows services to scale independently.
*   **IoT Gateway Abstraction**: Interfacing the ESP32 with a dedicated IoT Gateway Service isolates hardware communication protocols. If the system shifts from WiFi/HTTPS to MQTT brokers, only the IoT Gateway is changed, leaving core Express logic untouched.
*   **Blockchain Service Isolation**: An isolated Blockchain Service wraps all Hyperledger Fabric SDK transactions, shielding the rest of the application from gRPC configuration details and chaincode call structures.

---

## 4. Component Architecture

```mermaid
graph LR
    subgraph Frontend Tier
        React[Vite / React.js]
        Tailwind[Tailwind CSS & shadcn/ui]
    end

    subgraph Gateway Tier
        AG[API Gateway]
        SocketIO[Socket.IO Gateway]
    end

    subgraph Service Tier
        HS[Hospital Service]
        OS[Organ Service]
        MS[Matching Service]
        TS[Transport Service]
        BS[Blockchain Service]
        NS[Notification Service]
        IS[IoT Gateway Service]
    end

    subgraph IoT Tier
        ESP32[ESP32 Microcontroller]
        Sensors[Sensors: DS18B20, GPS, RFID, Tamper]
    end

    subgraph Ledger & DB Tier
        Mongo[(MongoDB)]
        HLF[Hyperledger Fabric Peers & CA]
    end

    React <-->|REST API / JWT| AG
    React <-->|WebSocket| SocketIO
    ESP32 -->|HTTPS / MQTT| IS
    AG --> HS & OS & MS & TS & BS & NS & IS
    HS & OS & MS & TS & NS & IS -->|Mongoose| Mongo
    BS -->|Fabric Node SDK| HLF
    SocketIO <--> NS
```

---

## 5. Frontend Architecture
The frontend is constructed using **Vite** as the build tool for near-instant developer compilation and minimized production builds. 

### Core Tech Stack Decisions
*   **React (Functional Components + Hooks)**: React's state management model allows rapid updating of map coordinates and live charts during active organ transit.
*   **Tailwind CSS**: Promotes utility-first styling, minimizing stylesheet bloat and ensuring quick rendering on mobile devices (useful for transport crews).
*   **shadcn/ui**: Built on top of Radix UI primitives and Tailwind, it enforces strict WAI-ARIA compliance, essential for healthcare administrative systems.

### Directory Structure & Organization
*   `/components`: Reusable layout and UI elements (buttons, inputs, cards, maps, charts).
*   `/pages`: Screen definitions representing the high-level dashboard views (Dashboard, LiveTrack, Matching, Verification).
*   `/context`: Global application state stores (Authentication state, Socket connection pools).
*   `/services`: API wrappers utilizing Axios for backend communication.
*   `/hooks`: Custom hooks containing state handling logic (e.g., `useSocket`, `useAuth`).

---

## 6. Backend Architecture
The backend application follows a domain-driven modular structure, splitting the application logic into logical controllers and service layers:

```
Request ──> API Gateway ──> Route Handler ──> Controller ──> Service Layer ──> Persistence Tier
```

### Architectural Services
1.  **Hospital Service**: Handles directory listings, status indicators, and hospital profiles.
2.  **Organ Service**: Manages inventory details, anatomical profiles, and organ viability state.
3.  **Matching Engine Service**: Executes compatibility and priority queues using clinical parameters and coordinates matching workflows.
4.  **Transport Service**: Coordinates active transport routes, schedules couriers, and links sessions to physical tracking boxes.
5.  **Blockchain Service**: Exclusively manages Hyperledger Fabric SDK transactions, peer queries, consensus confirmations, and certificate generation.
6.  **Notification Service**: Handles real-time system alerts, in-app alerts, and SMS/Email messaging interfaces.
7.  **IoT Gateway Service**: Manages ESP32 security handshakes, raw telemetry aggregation, sensor parsing, and ring-buffer data synchronization.

---

## 7. Database Responsibilities
The system uses **MongoDB** as its relational-like transactional store.

### Key Database Functions
*   **Telemetry Buffer**: Houses thousands of sensor updates per transport run. Doing this on the ledger is cost-prohibitive and leads to bloat; MongoDB documents store arrays of coordinates and sensor metrics mapped to a specific transport session ID.
*   **User Sessions & Operations**: Stores user metadata, password hashes, operational logs, system configuration parameters, and dashboard preferences.
*   **Caching Layer**: Caches blockchain-verified record states to reduce gRPC fetch latency for dashboard lists.

### Indexing & Schema Integrity
*   Compound Indexes are placed on `[transportId, timestamp]` inside telemetry collections to allow rapid retrieval of historic transport route lines.
*   Unique indexes on Email and Medical License numbers ensure data integrity at the database layer.

---

## 8. Blockchain Responsibilities
The **Hyperledger Fabric (HLF)** blockchain functions as the Single Source of Truth for system transitions that demand legal auditability and cryptographic trust.

### Ledger vs. Database Split
| Parameter / Field | Database (MongoDB) | Blockchain (Hyperledger Fabric) |
| :--- | :--- | :--- |
| **Personal Identifiable Info (PII)** | Yes (Names, emails, phone numbers) | No (Only UUID hashes of donors/recipients) |
| **Telemetry (GPS/Temp/Battery)** | Raw data stream (every 5-10 seconds) | Out-of-bounds events & final trip digest hash |
| **Transition Logs (Dispatch/Receive)**| Cache storage | Immutable State Transition Ledger (Signed) |
| **Algorithm Weights / Matching Queue**| Raw calculations | Output priority state & verification hash |

### Key Fabric Network Configurations
*   **Organizations**: Separate Org identities for national authorities (NOTTO), state-level bodies (SOTTO), and participating hospitals.
*   **Consensus (Raft)**: Crucial for sub-second transaction finality, ensuring zero fork risk, which is a major drawback of public blockchains like Ethereum.

---

## 9. IoT Responsibilities
The **ESP32** transport box acts as an edge-computing sentinel. It monitors the environment and ensures physical package security.

### Microcontroller System Flow
1.  **Sensor Polling Loop**: Reads temp, GPS, and tamper state every 5 seconds.
2.  **Local Memory Buffer**: In the event of a cellular or Wi-Fi drop, telemetry is stored in the ESP32's non-volatile flash storage using a ring-buffer algorithm to prevent data loss.
3.  **Active Lock Control**: An RFID scanner (RC522) reads transport personnel cards. If the card UID matches the session key generated during dispatch, the box can be opened without triggering an alert.
4.  **Alarm System**: If the Reed switch opens (indicating container breach) without matching an authorized RFID card, the ESP32 immediately turns on the local Buzzer and flags the breach event in its next network packet.

---

## 10. Communication Flow
Communication protocols are selected to match bandwidth, latency, and power constraints:

```mermaid
sequenceDiagram
    participant IoT as ESP32 Transport Box
    participant IS as IoT Gateway Service
    participant BE as Express Backend Core
    participant BC as Blockchain Service
    participant HLF as Hyperledger Fabric

    Note over IoT, IS: Telemetry Loop (Every 5s)
    IoT->>IS: POST /api/iot/telemetry (Encrypted JSON Payload)
    IS->>BE: Forward Telemetry (Normal parameters)
    
    Note over IoT, IS: Environmental/Security Breach (Immediate)
    IoT->>IS: POST /api/iot/telemetry (Tamper = True)
    IS->>BE: Dispatch Incident Alert
    BE->>BC: Invoke Audit Log Transaction
    BC->>HLF: Commit Incident (Block Confirmed)
```

---

## 11. Authentication Flow
The system utilizes a secure JWT-based stateless architecture coupled with physical security models at the edge.

*   **Token Refresh Cycle**: Short-lived access tokens (15 minutes) coupled with secure, HttpOnly refresh tokens stored in cookies. This prevents Cross-Site Scripting (XSS) from compromising the persistent session.
*   **Hardware Authentication**: The ESP32 is registered on the backend with a unique device identifier and hardware-bound private key. During startup, it registers to retrieve a transient session JWT which is attached to all subsequent telemetry HTTP requests.

---

## 12. Role-Based Access Control (RBAC)
To prevent unauthorized state changes in the transplantation workflow, user accounts are assigned fine-grained privileges:

| Role | Permitted Actions | Excluded Actions |
| :--- | :--- | :--- |
| **Admin** | System configuration, network orchestration, user enrollment, node health | Initiating organ match calculations, editing matching results |
| **NOTTO Coordinator** | Overriding priority allocations under extreme circumstances, auditing national logs | Operating transport boxes, direct hospital operations |
| **Hospital Coordinator** | Registering donors and recipients, entering matching constraints | Dispatching transport vehicles, overriding matching queues |
| **Transplant Doctor** | Declaring organ viability, initiating surgical procedures, completing transplants | Operating transport lock systems, global administration |
| **Transport Team** | Claiming transport tasks, swiping RFID keys to lock/unlock, updating transit logs | Reading patient historical records (HIPAA compliance) |

---

## 13. Module Responsibilities

### 1. Authentication
*   Enrollment and login for all user types.
*   JWT token generation, signature validation, and revocation blacklist.

### 2. Hospital Management
*   Directory of authorized transplant center locations, status indicators, and contact points.

### 3. Donor Management
*   Registration of donors, consent storage, blood typing, tissue profile logging, and organ viability status.

### 4. Recipient Management
*   Patient waitlist registration, medical history tracker, HLA matching characteristics, and geo-location for transit time calculations.

### 5. Organ Registry
*   Catalog of harvested organs, preservation timestamps, cold ischemic time counters, and specific anatomical profiles.

### 6. Organ Matching
*   Executes priority matching algorithm based on tissue matching, HLA cross-matching, logistics, waitlist time, and severity indicators.

### 7. Transplant Workflow
*   State machine orchestrator managing the stages: Harvested ──> Matched ──> Dispatched ──> In Transit ──> Delivered ──> Transplanted.

### 8. Smart Transport
*   Generates transport session IDs, maps active courier assignments, sets up geofence thresholds, and monitors cold chain limits.

### 9. IoT Monitoring
*   Aggregates live sensor data points, routes them to real-time streams, and alerts staff of anomalous conditions.

### 10. Blockchain Audit
*   Submits logs to HLF nodes and retrieves cryptographic proofs to build verify-history screens.

### 11. Reports & Analytics
*   Compiles summary records (such as average transit times, organ discard rates, and system compliance metrics) for review.

### 12. Administration
*   Provides user profile management, security logging dashboards, and configuration parameters.

---

## 14. Data Flow
The system manages high-priority transactions through detailed sequential pipelines:

### 1. User Login Sequence
```mermaid
sequenceDiagram
    actor User as Dashboard User
    participant FE as React Frontend
    participant AG as API Gateway
    participant HS as Hospital Service (User Db)

    User->>FE: Input Credentials (Email/Password)
    FE->>AG: POST /auth/login
    AG->>HS: Validate Credentials (bcrypt compare)
    HS-->>AG: User Account Info & Permissions
    AG->>AG: Generate JWT Access & Refresh Tokens
    AG-->>FE: Return JWT in HTTP Header & secure Cookie
    FE-->>User: Grant Dashboard Access
```

### 2. Organ Allocation Sequence
```mermaid
sequenceDiagram
    actor Doc as Donor Surgeon
    participant FE as Hospital Interface
    participant AG as API Gateway
    participant OS as Organ Service
    participant MS as Matching Engine Service
    participant BS as Blockchain Service
    participant HLF as Hyperledger Fabric

    Doc->>FE: Declare Organ Viable (Submit details)
    FE->>AG: POST /organ/register
    AG->>OS: Save Organ Profile (MongoDB)
    OS->>MS: Trigger Matching Engine
    MS->>MS: Calculate Priority Scores (Match logic)
    MS-->>AG: Candidate Match Queue (Ranked list)
    AG->>BS: Invoke Record Match Transaction
    BS->>HLF: Commit Allocation Match List
    HLF-->>FE: Match List Committed (Transaction Confirmed)
```

### 3. Organ Transport & IoT Tracking Sequence
```mermaid
sequenceDiagram
    actor Carrier as Courier Crew
    participant Box as ESP32 Box
    participant IS as IoT Gateway Service
    participant BE as Express Backend Core
    participant FE as React Live Dashboard

    Carrier->>Box: Present RFID Badge to Lock Box
    Box->>IS: POST /api/iot/auth-lock (Badge UID)
    IS-->>Box: Auth Approved (Lock Actuator Engaged)
    Note over Box, FE: Transit Phase Initiated
    loop Every 5 Seconds
        Box->>IS: POST /api/iot/telemetry (Temp, GPS, Tamper)
        IS->>BE: Store raw telemetry logs (MongoDB)
        BE->>FE: WebSocket Emit (Redraw Map & Charts)
    end
```

### 4. Blockchain Verification Sequence
```mermaid
sequenceDiagram
    actor Audit as Compliance Inspector
    participant FE as Audit Dashboard
    participant AG as API Gateway
    participant BS as Blockchain Service
    participant HLF as Hyperledger Fabric

    Audit->>FE: Input Organ ID to Verify
    FE->>AG: GET /audit/verify/:organId
    AG->>BS: Query Ledger Key History
    BS->>HLF: GetHistoryForKey(organId)
    HLF-->>BS: Returns array of Blocks & Hashes
    BS-->>FE: Cryptographic History List
    FE-->>Audit: Display Verify Success (Tampers detected if any)
```

### 5. Hospital Approval Sequence
```mermaid
sequenceDiagram
    actor RecipDoc as Recipient Surgeon
    participant FE as Hospital Interface
    participant AG as API Gateway
    participant OS as Organ Service
    participant BS as Blockchain Service
    participant HLF as Hyperledger Fabric

    RecipDoc->>FE: Accept Allocated Organ
    FE->>AG: POST /organ/accept
    AG->>OS: Update State to 'Matched-Approved'
    AG->>BS: Invoke State Update Transaction
    BS->>HLF: Commit Hospital Acceptance Block
    HLF-->>FE: Action Committed & Logged
```

---

## 15. Security Architecture
The platform is designed around strict security guidelines for both software and hardware interfaces:

*   **Encryption at Rest & Transit**: Databases are encrypted using AES-256. Web traffic uses TLS 1.3, and MQTT and websocket streams run over secure layers (WSS, MQTTS).
*   **Hardware Anti-Tampering**: ESP32 firmware limits network connections to pre-configured domains. A hardware tamper switch detects physical open actions, generating log entries that cannot be modified by local network users.
*   **HIPAA & Privacy Isolation**: Personally Identifiable Information (PII) is kept out of public structures. Blockchain registers use UUIDs, which references encrypted entries stored in the database.

---

## 16. Deployment Architecture
The platform is containerized to ensure consistent operation across local, testing, and production servers.

### Infrastructure Components
*   **Nginx**: Acts as the reverse proxy, load balancer, and SSL termination node.
*   **PM2 Orchestrator**: Manages Node.js app processes to automatically restart on unhandled failures.
*   **Docker Volumes**: Ensures persistent storage for MongoDB data directories and Fabric cryptographic folders.

---

## 17. Docker Architecture
The development and production configurations are managed via **Docker Compose**, separating components into distinct virtual networks:

*   **Network Segmentation**: The frontend container cannot directly access MongoDB or Fabric. This prevents potential database attacks from compromised clients.
*   **Volume Mounts**: Fabric CA and peer state storage folders map to secure host volumes to prevent data loss when container instances restart.

---

## 18. Scalability Considerations
*   **Database Sharding**: MongoDB collections are sharded based on `transportId` values, distributing telemetry payloads across multiple physical servers.
*   **Stateless Backend Scaling**: Because the backend uses stateless JWTs rather than session storage, multiple Express instances can run behind the reverse proxy.
*   **Fabric Channel Partitioning**: As the hospital network grows, channels can be partitioned by state or region, limiting transaction processing loads to relevant peers.

---

## 19. State Machine Diagrams

### 1. Organ State Machine
```mermaid
stateDiagram-v2
    [*] --> Harvested : Donor Harvester Surgeon Logs Viability
    Harvested --> Verified : SOTTO/ROTTO Confirm Specifications
    Verified --> Matched : Allocation Algorithm Selection Completed
    Matched --> Allocated : Recipient Surgical Team Accepts Offer
    Allocated --> Packed : Placed into ESP32 Transport Box
    Packed --> Dispatched : RFID Locked & Vehicle Dispatched
    Dispatched --> In_Transit : In Transit Telemetry Streams Active
    In_Transit --> Delivered : RFID Authenticated Unlock at Destination
    Delivered --> Transplanted : Surgery Complete (Medical Records Updated)
    Transplanted --> [*]
    
    In_Transit --> Compromised : Temperature breach / Physical tampering
    Compromised --> Rejected : Medical Evaluation Declares Organ Dead
    Rejected --> [*]
```

### 2. Transport Box Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Idle : Registered, on standby charger
    Idle --> Activated : Mission initialized & mapped to Organ ID
    Activated --> Locked : Organ loaded, RFID Lock engaged
    Locked --> Monitoring : Sensor loop active, telemetry streaming
    
    Monitoring --> Alert : Temp breach, Tamper triggered, Low battery
    Alert --> Monitoring : Alert acknowledged / parameters restore
    
    Monitoring --> Delivered : Destination RFID badge unlock scan
    Alert --> Delivered : Emergency code unlock scan
    Delivered --> Reset : Box cleaned, sensors recalibrated, battery charged
    Reset --> Idle
```

---

## 20. Institutional & Regulatory Workflows (THOTA compliance)

To fulfill Indian transplantation regulations (THOTA Guidelines), the matching, registration, and transport approvals must escalate through specific administrative hierarchies:

```mermaid
graph TD
    Hospital[Harvesting Hospital] -->|Register Donor Details| SOTTO[SOTTO: State-Level Registry]
    SOTTO -->|Cross-State Match Pool Escalation| ROTTO[ROTTO: Regional-Level Registry]
    ROTTO -->|National List Matching Approval| NOTTO[NOTTO: National-Level Registry]
    
    NOTTO -->|Ledger Consent & Matching Verified| BC[Hyperledger Fabric Peer Consensus]
    BC -->|Approved Transaction Hash| Hospital
```

### Hospital Care Case Workflow
```mermaid
graph LR
    DonorReg[Donor Registered] --> DocVerify[Doctor Declares Death]
    DocVerify --> CommApprove[Committee Review & Approval]
    CommApprove --> MatchEngine[Match Engine Allocation Run]
    MatchEngine --> NottoSign[NOTTO Sign-off]
    NottoSign --> Dispatch[Organ Dispatch & IoT Lock]
    Dispatch --> RecvHosp[Destination Hospital Lock Open]
    RecvHosp --> Transplant[Transplant Surgery]
    Transplant --> CloseCase[Case Closed & Ledger Locked]
```

---

## 21. Architecture Decisions and Design Rationale

### 1. Choice of Hyperledger Fabric over Ethereum/Polygon
*   **Rationale**: Public networks introduce variable transaction fee costs (gas) and lack true data privacy. Hyperledger Fabric provides a permissioned environment with zero gas fees, private data collections, and high throughput.

### 2. Domain-Driven Modular Platform over Monolithic Express Backend
*   **Rationale**: Splitting the business actions into dedicated service engines ensures that performance issues inside matching algorithm loops do not disrupt real-time websocket connections tracking transport runs.

### 3. Dedicated IoT Gateway Service
*   **Rationale**: Provides a separate processing endpoint that handles sensor scaling and parses payloads. This shields the main Express API service from high-volume telemetry traffic from the ESP32.
