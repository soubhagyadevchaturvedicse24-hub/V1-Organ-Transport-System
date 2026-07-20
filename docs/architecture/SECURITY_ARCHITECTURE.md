# Security Architecture Document
## Blockchain-Enabled Human Organ Transplantation & Smart Organ Transport Platform

This document describes the security architecture, threat model, cryptographic standards, data protection rules, and access control policies for the platform.

---

## 1. Security Architecture Overview
Given the sensitive nature of patient health records (HIPAA compliance), the need for strict allocation rules (THOTA compliance), and the physical vulnerabilities of organ transit, security is integrated into every layer of the platform:

```
[ User/Client Dashboard ]  ──( TLS 1.3 / JWT / RBAC )──>  [ API Gateway ]
                                                                │
           ┌────────────────────────────────────────────────────┤
           ▼                                                    ▼
[ MongoDB Database ]                                  [ Blockchain Service ]
(AES-256 Encrypted /                                  (X.509 Certificates /
 Field-Level Encryption)                              Signed Transactions)
```

---

## 2. Threat Modeling (STRIDE Framework)
The system is modeled against the STRIDE threat categorization framework to identify potential vulnerabilities:

| Threat Category | Potential System Target | Mitigation Mechanism |
| :--- | :--- | :--- |
| **Spoofing Identity** | Unauthorized user logging in as a Doctor or NOTTO Coordinator. | Multi-Factor Authentication (MFA) and short-lived JWT tokens. |
| **Tampering with Data**| Modifying organ match lists or transit temperature logs in MongoDB. | Storing verification hashes on the Hyperledger Fabric ledger to detect data modifications. |
| **Repudiation** | A hospital coordinator denying they approved an organ dispatch. | Every state transition requires a transaction signed by the user's private key. |
| **Information Disclosure**| Unauthorized access to recipient records. | Field-level encryption for sensitive database fields; keeping PII off-chain. |
| **Denial of Service** | Flooding the IoT Gateway with fake telemetry updates. | Rate limiting at the API gateway and hardware-bound JWT authentication. |
| **Elevation of Privilege**| A courier attempting to run matching calculations. | Role-Based Access Control (RBAC) middleware verifying JWT claims on every request. |

---

## 3. Cryptographic Standards
The platform uses industry-standard cryptographic algorithms:
*   **Data in Transit**: All connection channels require TLS 1.3. Symmetric data is encrypted using AES-128-GCM or AES-256-GCM.
*   **Data at Rest**: MongoDB files are encrypted using AES-256. Sensitive patient medical histories are encrypted at the field level before being written to the database.
*   **Hashing**: Cryptographic digests use SHA-256. Password records are hashed using bcrypt with a work factor of 12.
*   **Signatures**: Blockchain transactions and API keys use Elliptic Curve Cryptography (ECDSA secp256r1/prime256v1) for authentication.

---

## 4. Authentication & JWT Policy
Authentication uses stateless JWT tokens to manage user sessions:

```
[ User Login ] ──> [ Gateway validates credentials ] ──> [ Set Secure Refresh Cookie ]
                                                             │
[ Client attaches JWT Bearer token to API calls ] <──────────┘
```

*   **Access Token**: Valid for 15 minutes. Contains the user's ID, role, and authorized hospital scope.
*   **Refresh Token**: Valid for 7 days. Stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie to prevent Cross-Site Scripting (XSS) access.
*   **Token Revocation**: Active tokens can be revoked immediately by adding their identifiers to a Redis blacklist database.

---

## 5. Role-Based Access Control (RBAC)
Role-Based Access Control (RBAC) is enforced at the API Gateway before requests are routed to business services:

```javascript
// Conceptual representation of the RBAC authorization check
function authorize(requiredPermissions) {
  return (req, res, next) => {
    const userPermissions = req.user.permissions;
    const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));
    if (!hasPermission) {
      return res.status(403).json({ error: "Access Denied: Insufficient Permissions" });
    }
    next();
  };
}
```

### Permission Mappings
*   `Admin`: Full permissions (user registration, box status modifications, network orchestration).
*   `NOTTO_Coordinator`: System logs auditing, waitlist modifications, allocation overrides.
*   `Hospital_Coordinator`: Patient registration, organ harvest listings, dispatching transport runs.
*   `Doctor`: Viability evaluations, matching queue approvals, transplant logging.
*   `Transport_Team`: Box lock/unlock checks, transport telemetry updates.

---

## 6. Device Security & Authenticated Hardware
The ESP32 tracking boxes are treated as untrusted edge nodes, implementing the following security measures:

*   **Device Handshake**: The ESP32 is registered on the backend with a unique device identifier and hardware-bound private key. During startup, it registers to retrieve a transient session JWT which is attached to all subsequent telemetry HTTP requests.
*   **RFID Lock Security**: Box locks are controlled by physical RFID cards. Scanned card IDs are checked against locally cached authorized keys; unauthorized cards trigger a tamper alert.
*   **Physical Tamper Detection**: A lid switch triggers a hardware interrupt if the box is opened without authorization, sounding the buzzer and alerting the gateway immediately.

---

## 7. Blockchain Trust Model & Ledger Security
*   **Certificate Authorities**: Each organization runs its own CA node to sign certificates, ensuring that compromised credentials do not affect other nodes.
*   **Endorsement Policies**: Transactions require validation from multiple peer organizations (e.g., Hospital and SOTTO) before they can be committed to the ledger, preventing single-point alterations.
*   **Private Data Collections**: Sensitive patient records are stored in private databases (SideDB) on authorized nodes. Only verification hashes are written to the main channel ledger.

---

## 8. Secure Firmware Updates (OTA)
To prevent unauthorized code execution on tracking boxes:
*   **Signature Verification**: The ESP32 verifies the cryptographic signature of new firmware binaries against a pre-installed public key before applying updates.
*   **Version Verification**: The update manager checks version numbers to prevent rollback attacks using older, vulnerable firmware versions.

---

## 9. Security Audit Logging
The system maintains audit records to log user and device activity:
*   **Operational Logs**: System events (logins, API calls) are recorded in MongoDB with timestamps.
*   **Blockchain Logs**: Key transitions (match selections, transport dispatches, box unlocks) are committed directly to the ledger.
*   **Access Violations**: Repeated authorization failures are logged immediately to alert system administrators of potential attacks.

---

## 10. Disaster Recovery & Security Incidents
*   **Key Rotation**: Administrative certificates and API access tokens are rotated annually.
*   **Breach Containment**: If a device or credential is compromised, it is revoked from the CA's Certificate Revocation List (CRL) and blocklisted at the gateway to isolate the breach.
