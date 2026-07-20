# Sprint 3: Hospital Module Implementation Plan

The sole focus of this sprint is the Hospital domain. No authentication changes, no organ matching, no transport logic.

## 1. Folder Structure

```text
backend/src/
├── hospital/
│   ├── controllers/
│   │   └── hospital.controller.js
│   ├── services/
│   │   └── hospital.service.js
│   ├── routes/
│   │   └── hospital.route.js
│   ├── validators/
│   │   └── hospital.validator.js
│   ├── dto/
│   │   └── hospital.dto.js
│   └── tests/
│       └── hospital.test.js
├── models/
│   └── Hospital.js        # ← New domain model
```

## 2. Hospital Lifecycle

```text
DRAFT → PENDING_APPROVAL → ACTIVE
                         → REJECTED
ACTIVE → SUSPENDED
SUSPENDED → ACTIVE
```

- **DRAFT**: Record created but not yet submitted.
- **PENDING_APPROVAL**: Hospital submitted for NOTTO/Admin review.
- **ACTIVE**: Approved and operational.
- **REJECTED**: Disapproved by NOTTO/Admin.
- **SUSPENDED**: Temporarily halted by Admin.

## 3. Required Documents (at Registration)

- Hospital Registration Certificate (required)
- NABH Accreditation (optional)
- License to Operate (required)
- Authorized Coordinator Details (required)
- Address and Contact Proof (required)

These documents will be referenced by URL/path. Upload handling is deferred to a future sprint.

## 4. Database Schema

```text
Hospital
├── name                     String  required
├── registrationNumber       String  required, unique
├── type                     Enum    [GOVERNMENT, PRIVATE, TRUST, AUTONOMOUS]
├── address                  Object  { street, city, state, pincode }
├── contact                  Object  { phone, email, website }
├── coordinatorUserId        ObjectId → User
├── status                   Enum    [DRAFT, PENDING_APPROVAL, ACTIVE, REJECTED, SUSPENDED]
├── rejectionReason          String  (populated only on REJECTED)
├── approvedBy               ObjectId → User
├── approvedAt               Date
├── documents                Array of { type, url }
├── transplantCapabilities   Array   [KIDNEY, LIVER, HEART, LUNG, CORNEA, ...]
├── createdAt                Date
└── updatedAt                Date
```

## 5. API Endpoints

| Method | Endpoint | Permission | Description |
|--------|----------|-----------|-------------|
| POST | `/api/v1/hospitals` | `hospital:create` | Register a new hospital |
| GET | `/api/v1/hospitals` | `hospital:view` | List all hospitals (paginated) |
| GET | `/api/v1/hospitals/:id` | `hospital:view` | Get single hospital |
| PATCH | `/api/v1/hospitals/:id` | `hospital:update` | Update hospital info |
| POST | `/api/v1/hospitals/:id/approve` | `hospital:approve` | Approve hospital (NOTTO/Admin) |
| POST | `/api/v1/hospitals/:id/reject` | `hospital:approve` | Reject hospital with reason |
| POST | `/api/v1/hospitals/:id/suspend` | `hospital:suspend` | Suspend hospital |

## 6. Validation Rules

- `name`: min 3, max 200 chars
- `registrationNumber`: unique, required
- `type`: must be one of the allowed enum values
- `address.pincode`: 6-digit Indian PIN code
- `contact.phone`: 10-digit number
- `contact.email`: valid email format
- `transplantCapabilities`: at least one required at submission

## 7. Permissions

These must reference `HOSPITAL_PERMISSIONS` constants (already defined in `src/permissions/hospital.permissions.js`).

| Role | Create | View | Update | Approve | Suspend |
|------|--------|------|--------|---------|---------|
| PLATFORM_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| NOTTO_OFFICER | ✅ | ✅ | ❌ | ✅ | ❌ |
| ROTTO_SOTTO_OFFICER | ❌ | ✅ | ❌ | ❌ | ❌ |
| HOSPITAL_COORDINATOR | ❌ | ✅ | ✅ | ❌ | ❌ |
| TRANSPLANT_SURGEON | ❌ | ✅ | ❌ | ❌ | ❌ |
| AUDITOR | ❌ | ✅ | ❌ | ❌ | ❌ |

## 8. Testing Plan

- `[ ]` Create hospital (success)
- `[ ]` Create hospital (validation failure - missing required fields)
- `[ ]` Create hospital (permission denied for Courier role)
- `[ ]` List hospitals (paginated)
- `[ ]` Get single hospital
- `[ ]` Approve hospital (NOTTO success)
- `[ ]` Approve hospital (HOSPITAL_COORDINATOR denied)
- `[ ]` Reject hospital with reason
- `[ ]` Suspend hospital (Admin only)

## 9. Definition of Done (Sprint 3)

- `[ ]` `Hospital` Mongoose model created
- `[ ]` All 7 endpoints implemented
- `[ ]` Input validation via Zod on every endpoint
- `[ ]` RBAC enforced via `requirePermission`
- `[ ]` Approval/Rejection workflow implemented
- `[ ]` Tests pass (Bruno + manual)
- `[ ]` README and API docs updated
