# Sprint 6: Matching Engine Implementation Plan

This document outlines the architecture, domain event catalog, matching workflow, scoring algorithm, and API endpoints for the Matching Engine (Sprint 6). The Matching Engine serves as the core intelligence of the platform, kept completely decoupled from the base Organ and Recipient CRUD operations.

---

## 1. Shared Domain Event Catalog (Pre-requisite)

Before building the matching logic, we will implement a centralized event catalog to drive an event-driven architecture. The matching engine will listen to these events rather than querying the database repeatedly.

**`src/domain/events/`**
- `hospital.events.js`
- `donor.events.js`
- `organ.events.js` (e.g., `ORGAN_AVAILABLE` emitted when an organ reaches `AWAITING_ALLOCATION`)

---

## 2. Matching Engine Architecture: Separation of Concerns

The Matching Engine will be divided into four strict independent layers.

### A. Compatibility (Medical Limits)
- Hard rules that immediately filter out incompatible candidates.
- Checks: `Blood Group compatibility` (e.g., O- can give to anyone, AB+ can receive from anyone), `Organ Type match`, `Medical Contraindications`.

### B. Eligibility (Administrative / Operational)
- Verification that a medically compatible match is legally and operationally viable.
- Checks: `Recipient Active status`, `Hospital Approved/Active`, `Required Documents complete`, `Consent Verified`.

### C. Scoring Engine
- A configurable algorithm to rank eligible candidates. Weights will be driven by a configuration file (`scoringWeights.js`), not hard-coded logic.
- Variables: `Waiting Time`, `Urgency (Medical priority)`, `Distance (calculated approx between donor and recipient hospitals)`, `Pediatric Priority`.

### D. Recommendation
- The engine produces a **Match Record** (document). It ranks the top *N* matches. 
- **No automatic allocation:** A human (NOTTO/ROTTO Officer or Surgeon) must review the recommendations and explicitly accept one, which then triggers the `allocate` action on the Organ.

---

## 3. Match Record Domain Model

The `Match` schema records a specific matching run for an organ.

- `matchId`: e.g., `MAT-000001`
- `organId`: Reference to the Organ
- `status`: Workflow State
- `recommendedRecipients`: Array of objects containing:
  - `recipientId`
  - `score` (Total calculated score)
  - `breakdown` (Points from Wait Time, Urgency, Distance, etc.)
  - `status` (`PENDING_RESPONSE`, `ACCEPTED`, `DECLINED`)
- `acceptedRecipientId`: Populated when the human approves a recommendation.

---

## 4. Matching Workflow & State Machine

Using our established `workflow/index.js` engine, the Match record will follow this lifecycle:

### Valid Transitions Matrix

| From | Action | To | Description |
|------|--------|-----|-------------|
| `(None)` | `startMatching` | `MATCHING_STARTED` | Emitted when `ORGAN_AVAILABLE` triggers the engine |
| `MATCHING_STARTED`| `checkCompatibility` | `COMPATIBILITY_CHECK` | Hard filters applied |
| `COMPATIBILITY_CHECK`| `score` | `SCORING` | Eligibility and Scoring applied |
| `SCORING` | `rank` | `RANKED` | Recipients are sorted |
| `RANKED` | `recommend` | `RECOMMENDED` | Top matches presented to officers |
| `RECOMMENDED` | `accept` | `ACCEPTED` | Human officer accepts a match (triggers Organ Allocation) |
| `RECOMMENDED` | `expire` / `cancel` | `CANCELLED` | If no viable match is accepted in time |

*(Note: In practice, the backend will rapidly transition through `STARTED` → `COMPATIBILITY` → `SCORING` → `RANKED` → `RECOMMENDED` sequentially in a single transaction/job, but capturing each state allows for detailed auditing and potential asynchronous batching).*

---

## 5. RBAC & Permissions

A new `src/permissions/matching.permissions.js` will define:
- `matching:view` (Officers, Surgeons)
- `matching:trigger` (System or Officer override)
- `matching:accept` (NOTTO Officer, Transplant Surgeon for target hospital)
- `matching:decline` (NOTTO Officer, Transplant Surgeon)

---

## 6. API Specification

All routes nested under `/api/v1/matching`.

### Endpoints
- `POST /organs/:organId/run` - Manually trigger a matching run (useful if event fails or for testing)
- `GET /organs/:organId` - Get the current Match record and recommendations for an organ
- `POST /:matchId/recipients/:recipientId/accept` - Accept a recommendation (Transitions Match to `ACCEPTED` and calls `allocateOrgan()` on the Organ service)
- `POST /:matchId/recipients/:recipientId/decline` - Decline a recommendation

---

## 7. Verification Plan

### Automated Tests
- Create `matchingMachine` transition map and add tests in `workflow.stateMachine.test.js`.
- Create unit tests for `compatibilityRules.js` and `scoringEngine.js` to ensure weights calculate correctly.

### Documentation
- Create a comprehensive Bruno collection `bruno/Matching/`.
- Update `README.md` to mark Sprint 6 active.
