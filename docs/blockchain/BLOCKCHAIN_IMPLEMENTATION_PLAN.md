# Goal Description

Implement **Sprint 8: Blockchain Integration**. This sprint adds an immutable, auditable layer to the platform by notarizing all critical domain events across Hospital, Donor, Organ, Matching, and Transport modules. We will use an event-driven Blockchain Adapter to ensure the core services remain decoupled from the blockchain infrastructure. Additionally, we will introduce a Health Monitoring evaluation layer for transports as a precursor to dashboard visualisations.

> [!NOTE]
> To keep the development environment fast and avoid heavy Docker dependencies (like a full Hyperledger Fabric network) during this sprint, we will implement a cryptographically secure "Mini-Blockchain" within MongoDB (using chained SHA-256 hashes). The `BlockchainAdapter` will be designed with a replaceable interface so the actual Hyperledger Fabric SDK can be swapped in later without changing any core logic.

## Proposed Changes

### 1. Pre-Requisite: Health Monitoring Engine

Before blockchain notarization, we will refine the transport telemetry by adding a Health Engine.

#### [MODIFY] `src/models/TransportMission.js`
- Add `healthStatus`: Enum (`NORMAL`, `WARNING`, `CRITICAL`), default `NORMAL`.

#### [MODIFY] `src/transport/services/telemetry.service.js`
- Update `evaluateAlerts` to calculate the health status and update the `TransportMission` accordingly, emitting a `HEALTH_STATUS_CHANGED` event if the status degrades.

---

### 2. Blockchain Infrastructure (Mocked Ledger)

#### [NEW] `src/models/LedgerBlock.js`
A cryptographic block schema to simulate immutable storage.
- `blockIndex`: Number
- `timestamp`: Date
- `previousHash`: String
- `hash`: String
- `payload`: Object (The event data)
- `eventType`: String

#### [NEW] `src/blockchain/services/ledger.service.js`
The adapter interface.
- `async appendToLedger(eventType, payload)`: Hashes the payload and the `previousHash` to generate a new block and saves it to the DB.

---

### 3. Event-Driven Adapter

#### [NEW] `src/blockchain/subscribers/audit.subscriber.js`
Listens to the Event Bus and writes to the Ledger.
Subscribes to:
- `DONOR_CREATED`, `DONOR_CONSENT_VERIFIED`
- `ORGAN_REGISTERED`, `ORGAN_ALLOCATED`
- `MATCHING_TRIGGERED`, `MATCH_ACCEPTED`
- `TRANSPORT_DISPATCHED`, `TRANSPORT_ARRIVED`, `TELEMETRY_ALERT`

It maps these domain events into a standard audit format and passes them to `ledger.service.js`.

---

### 4. Verification & Audit API

#### [NEW] `src/blockchain/controllers/audit.controller.js`
#### [NEW] `src/blockchain/routes/audit.route.js`

- **GET `/api/v1/audit/organ/:organId`**: Fetches the entire blockchain history for a specific organ, reconstructing the timeline (Creation → Match → Dispatch → Arrive).
- **GET `/api/v1/audit/verify`**: A cryptographic verification endpoint that recalculates all hashes in the `LedgerBlock` collection to prove the chain has not been tampered with.

## Verification Plan

### Automated Tests
- Unit test the `ledger.service.js` cryptographic hashing to ensure `hash = SHA256(index + previousHash + timestamp + JSON.stringify(payload))`.
- Unit test the `audit.subscriber.js` to ensure it correctly maps domain events.

### Manual Verification
- Manually trigger a full flow (Create Donor → Create Organ → Match → Accept Match → Create Mission → Dispatch).
- Call `/api/v1/audit/organ/:id` and ensure all events are present in chronological order.
- Tamper with a `LedgerBlock` directly in MongoDB, call `/api/v1/audit/verify`, and verify that the system detects the broken chain.

## Open Questions

> [!WARNING]
> Please provide your feedback on the following design decisions:

1. **Mocked Ledger Approach:** Is implementing a cryptographic mini-blockchain in MongoDB acceptable for Sprint 8 to prove the architecture, with the understanding that a Hyperledger Fabric implementation of `ledger.service.js` can be dropped in later?
2. **Audit API Permissions:** I plan to restrict the `/api/v1/audit` endpoints to the `PLATFORM_ADMIN`, `NOTTO_OFFICER`, and `AUDITOR` roles. Does this align with your access control expectations?
