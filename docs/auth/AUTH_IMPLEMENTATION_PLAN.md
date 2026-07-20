# Sprint 2: Authentication Implementation Plan

This document serves as the exact blueprint for Sprint 2. The sole focus of this sprint is establishing secure authentication and role-based access control (RBAC). No other domain modules (Hospitals, Organs, etc.) will be developed during this phase.

## 1. Folder Structure

The authentication module will be strictly isolated within the backend using a domain-driven structure:

```text
backend/src/
├── auth/
│   ├── controllers/      # Route handlers (req, res)
│   ├── services/         # Core business logic (login, token generation)
│   ├── routes/           # Express router definitions
│   ├── middleware/       # Auth-specific middlewares (if any)
│   ├── validators/       # Input validation (Joi/Zod)
│   ├── dto/              # Data Transfer Objects
│   ├── utils/            # Token generation, hashing utilities
│   └── tests/            # Unit and integration tests
├── middleware/
│   ├── requireAuth.js    # Global JWT verifier
│   ├── requirePermission.js # Global Permission enforcer
│   └── errorHandler.js   # Global error formatting
```

## 2. Authentication Flow

The standard login and token generation sequence for **Human Users**:

1. **Login Request:** Client submits `email` and `password`.
2. **Validate Input:** `validators` ensure data integrity and format.
3. **Find User:** `services` query MongoDB for the user record.
4. **Account Status Check:** Ensure user status is `ACTIVE`.
5. **Verify Password:** Compare hash using adaptive password hashing (e.g., bcrypt).
6. **Audit Log:** Log `LOGIN_SUCCESS` (or `LOGIN_FAILED`).
7. **Generate Access Token:** Create short-lived JWT payload.
8. **Generate Refresh Token:** Create long-lived opaque token (or JWT).
9. **Store Refresh Token:** Save `hash(refreshToken)` to DB (for revocation) and set `HttpOnly` cookie.
10. **Return Response:** Send standardized JSON payload.

## 3. Authorization Flow

The middleware pipeline for protected routes:

1. **Request:** Client makes request with `Authorization: Bearer <token>`.
2. **JWT Verification:** `requireAuth` verifies token signature and expiration.
3. **User Lookup:** Extract user ID and role from payload.
4. **Permission Validation:** `requirePermission('resource:action')` maps user's Role to Permissions and verifies.
5. **Controller:** Execute business logic.

## 4. RBAC & Permissions Matrix

We use domain-specific roles mapped to granular permissions.

### Roles
- Platform Administrator
- NOTTO Officer
- ROTTO / SOTTO Officer
- Hospital Coordinator
- Transplant Surgeon
- Courier / Transport Coordinator
- Auditor

*(Note: Virtual Device will have a separate Device Authentication flow in a future sprint).*

### Example Permissions
- `auth:login`
- `auth:refresh`
- `hospital:create`
- `hospital:view`
- `donor:create`
- `audit:view`

## 5. Token Strategy

- **Access Token:** JWT, valid for **15 minutes**. Sent via `Authorization` header.
- **Refresh Token:** JWT or Opaque Token, valid for **7 days**. Sent via `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
- **Storage:** Stored as `hash(refreshToken)` in the database to prevent abuse if leaked.
- **Rotation Policy:** Refresh token rotation enabled.
- **Revocation Policy:** Logout or compromised accounts will flag the token family as revoked.

## 6. Password & Account Policy

- **Minimum Length:** 12 characters.
- **Complexity:** Uppercase, lowercase, number, special character.
- **Hashing Algorithm:** Industry-standard adaptive password hashing (Current implementation: `bcrypt` factor 12).
- **Lockout Policy:** 5 failed login attempts lock the account for 15 minutes. Log `ACCOUNT_LOCKED`.
- **Account Statuses:** `ACTIVE`, `PENDING_APPROVAL`, `SUSPENDED`, `LOCKED`, `DISABLED`.

## 7. Standardized API Envelope

Every API response follows this envelope:

```json
{
  "success": true,
  "message": "Login successful",
  "data": { ... }
}
```

## 8. Error Catalogue

Standardized authentication errors:

- **`AUTH_001`**: Invalid credentials (`401 Unauthorized`)
- **`AUTH_002`**: Token expired (`401 Unauthorized`)
- **`AUTH_003`**: Access denied / Insufficient permissions (`403 Forbidden`)
- **`AUTH_004`**: Account locked due to multiple failed attempts (`423 Locked`)
- **`AUTH_005`**: Invalid token signature (`401 Unauthorized`)
- **`AUTH_006`**: Missing authorization header (`401 Unauthorized`)
- **`AUTH_007`**: Password does not meet complexity requirements (`400 Bad Request`)
- **`AUTH_008`**: Account not active (`403 Forbidden`)

## 9. Testing Plan

Tests will be defined and executed via Bruno and automated frameworks:

- Login success
- Login failure (wrong password / account locked)
- `GET /api/v1/auth/me` verifies session
- Refresh token success / rotation / revocation
- Logout success
- RBAC permission denied

## 10. Definition of Done (Sprint 2)

- `[ ]` Database Connection (MongoDB Setup)
- `[ ]` `POST /auth/login` implemented
- `[ ]` `POST /auth/logout` implemented
- `[ ]` `POST /auth/refresh` implemented
- `[ ]` `GET /auth/me` implemented
- `[ ]` `requireAuth` JWT Middleware implemented
- `[ ]` `requirePermission` Middleware implemented
- `[ ]` Password Hashing & Refresh Token Hashing
- `[ ]` Account Lockout & User Status Validation
- `[ ]` Audit Logging for auth events
- `[ ]` Authentication Tests pass (Bruno + Unit)
- `[ ]` Documentation & README updated
