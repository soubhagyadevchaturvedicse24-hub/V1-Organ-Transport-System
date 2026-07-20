# Goal Description

Implement the **Smart Transport & IoT Module** (Sprint 7) to manage the physical transportation of an allocated organ. This module tracks the chain of custody, monitors critical telemetry (GPS, temperature, battery, tamper status) from a smart transport box, and simulates device events before real hardware (ESP32) is introduced.

> [!NOTE]
> Blockchain integration is explicitly out of scope for this sprint. We will focus purely on the Transport and Device layers.

## Proposed Changes

### 1. Data Models

#### [NEW] `src/models/TransportBox.js`
Represents the physical smart box used to transport the organ.
- `boxId`: String (e.g. `BOX-101`)
- `deviceId`: String (Hardware MAC/ID)
- `deviceSecret`: String (For basic device API authentication)
- `status`: Enum (`AVAILABLE`, `IN_TRANSIT`, `MAINTENANCE`, `DECOMMISSIONED`)
- `lastKnownLocation`: GeoJSON Point
- `lastMaintenanceDate`: Date

#### [NEW] `src/models/TransportMission.js`
Represents a specific trip carrying an organ.
- `missionId`: String (e.g. `TRN-0001`)
- `organId`: Ref to `Organ`
- `matchId`: Ref to `Match`
- `boxId`: Ref to `TransportBox`
- `courierId`: Ref to `User`
- `originHospital`: Ref to `Hospital`
- `destinationHospital`: Ref to `Hospital`
- `status`: Enum (`PENDING`, `DISPATCHED`, `IN_TRANSIT`, `ARRIVED`, `COMPLETED`, `CANCELLED`)
- `estimatedArrivalTime`: Date

#### [NEW] `src/models/TelemetryLog.js`
Time-series collection to store high-frequency IoT pings.
- `missionId`: Ref to `TransportMission`
- `boxId`: Ref to `TransportBox`
- `temperature`: Number (Celsius)
- `batteryLevel`: Number (Percentage)
- `geoLocation`: GeoJSON Point
- `isTampered`: Boolean (Light sensor / lid open alert)
- `timestamp`: Date

---

### 2. Workflow & Domain Events

#### [NEW] `src/workflow/transitions/transport.transitions.js`
State machine for `TransportMission`:
- `dispatch` (`PENDING` → `DISPATCHED`)
- `startTransit` (`DISPATCHED` → `IN_TRANSIT`)
- `arrive` (`IN_TRANSIT` → `ARRIVED`)
- `complete` (`ARRIVED` → `COMPLETED`)

#### [NEW] `src/domain/events/transport.events.js`
Domain events for the transport chain of custody:
- `TRANSPORT_DISPATCHED`
- `TRANSPORT_ARRIVED`
- `TELEMETRY_ALERT` (Triggered if temp > threshold or tamper = true)

---

### 3. API & Controllers

#### [NEW] `src/transport/routes/mission.route.js`
CRUD and workflow for Transport Missions (used by Coordinators and Couriers).
- `POST /` (Create mission)
- `POST /:missionId/workflow/:action` (Dispatch, Arrive, etc.)
- `GET /:missionId`

#### [NEW] `src/transport/routes/device.route.js`
Ingestion API for the physical/simulated IoT boxes. Protected by `deviceSecret` rather than a standard user JWT.
- `POST /telemetry` (Payload: GPS, temp, battery, tamper status)

---

### 4. IoT Simulator

#### [NEW] `src/simulator/iotSimulator.js`
A standalone Node.js utility (or an exposed `/simulate` API endpoint) that:
1. Picks an active `TransportMission`.
2. Generates dummy GPS interpolation from `originHospital` to `destinationHospital`.
3. Periodically POSTs data to `/api/v1/device/telemetry`.
4. Randomly (or via configuration) simulates a temperature spike or a tamper alert for testing.

## Verification Plan

### Automated Tests
- Unit test the `transport.transitions.js` state machine.
- Unit test telemetry ingestion (e.g. verify that pushing a `isTampered = true` payload triggers a `TELEMETRY_ALERT` event).

### Manual Verification
- Add Bruno requests for `TransportBox` and `TransportMission`.
- Run the IoT Simulator script and verify that `TelemetryLog` populates and events are emitted when constraints are violated.

## Open Questions

> [!WARNING]
> Please provide your feedback on the following design decisions:

1. **Device Authentication:** To keep it simple for real ESP32 integration later, I propose using a static `x-device-secret` HTTP header for the telemetry ingestion route, rather than a full OAuth/JWT flow for the hardware. Is this acceptable?
2. **Telemetry Frequency:** How frequently do you anticipate the IoT device pinging the server? (e.g., every 5 seconds, 1 minute, 5 minutes). This will dictate if we need to optimize `TelemetryLog` inserts or if standard MongoDB inserts are fine for now.
