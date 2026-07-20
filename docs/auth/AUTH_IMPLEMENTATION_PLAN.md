# Sprint 2: Authentication Implementation Plan

## 1. Folder Structure

The Authentication module will be isolated in the backend using the following domain-driven structure:

```text
backend/src/
├── auth/
│   ├── auth.controller.js
│   ├── auth.service.js
│   ├── auth.route.js
│   ├── auth.validation.js
│   └── tokens.util.js
├── middleware/
│   ├── requireAuth.js
│   ├── requireRole.js
│   └── errorHandler.js
```

## 2. JWT Flow & Refresh Token Strategy

- **Access Token:** Short-lived JWT (e.g., 15 minutes) sent in the `Authorization: Bearer <token>` header.
- **Refresh Token:** Long-lived JWT (e.g., 7 days) stored securely in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie to prevent XSS attacks.
- **Flow:**
  1. Client sends credentials to `/auth/login`.
  2. Server responds with Access Token in JSON payload and Refresh Token in cookie.
  3. When Access Token expires, client calls `/auth/refresh`.
  4. Server verifies Refresh Token cookie and issues a new Access Token.
  5. On `/auth/logout`, server clears the cookie and blacklists the token (if implementing stateful revocation).

## 3. Password Hashing

- **Algorithm:** `bcryptjs`
- **Work Factor:** 10 (or 12 depending on performance targets)
- Hashing will occur automatically within the User Mongoose schema `pre('save')` hook.

## 4. RBAC (Role-Based Access Control) Middleware

- We will define roles (e.g., `ADMIN`, `HOSPITAL`, `TRANSPORT`, `AUDITOR`).
- `requireRole(['ADMIN', 'HOSPITAL'])` will be a factory middleware returning an express handler.
- It will depend on the `requireAuth` middleware to first verify the JWT and attach `req.user`.

## 5. Middleware Order

Standardized middleware pipeline for protected routes:
1. General Express parsers (JSON, urlencoded).
2. Rate Limiting (`express-rate-limit` for `/auth` endpoints).
3. `requireAuth` (Verifies JWT and populates `req.user`).
4. `requireRole` (Verifies `req.user.role`).
5. Route Handler (Controller).
6. Global `errorHandler` (Catches all next(err) calls).

## 6. Error Responses

Standardized JSON error structures:
```json
{
  "status": "error",
  "code": "UNAUTHORIZED",
  "message": "Invalid or expired token",
  "details": []
}
```
HTTP Status Codes:
- `400` Bad Request (Validation failure)
- `401` Unauthorized (Missing or invalid JWT)
- `403` Forbidden (Valid JWT, insufficient role)

## 7. Test Cases (Bruno)

We will expand the Bruno collection:
```text
Bruno/
└── Authentication/
    ├── Register Admin (POST /auth/register)
    ├── Login (POST /auth/login)
    ├── Refresh Token (POST /auth/refresh)
    ├── Get Current User (GET /auth/me)
    └── Logout (POST /auth/logout)
```
