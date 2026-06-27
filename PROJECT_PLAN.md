# Project Plan: Grant Management Portal

## Overview

A secure, multi-user web application for managing grant applications with Role-Based Access Control (RBAC), OAuth 2.0 authentication, and JWT-based authorization.

---

## User Stories

### US-1: User Registration and Authentication

**As a new user, I want to register with my email and password so that I can access the grant management system.**

**Acceptance Criteria:**
- A user can register by providing a name, email, and password (min 6 characters).
- The system returns a 201 status with the user's id, name, and email (password is never returned).
- Registering with a duplicate email returns a 409 Conflict response.
- On successful login, the system issues a JWT containing `userId` and `roles` claims.
- Attempting to login with wrong credentials returns a 401 Unauthorized response.

---

### US-2: OAuth 2.0 Social Login

**As a user, I want to log in with my Google account so that I don't need to create and remember a separate password.**

**Acceptance Criteria:**
- The system exposes a `/api/auth/google/callback` endpoint that accepts a Google OAuth authorization code.
- When a valid code is provided, the server exchanges it for an access token, retrieves the user's profile, and creates an account if one doesn't exist.
- A JWT is issued after successful OAuth authentication, identical in format to password-based login.
- New OAuth users are automatically assigned the GRANTEE role.

---

### US-3: Role-Based Grant Management (GRANTOR)

**As a GRANTOR, I want to create, update, and delete my own grants so that I can offer funding opportunities to eligible applicants.**

**Acceptance Criteria:**
- A GRANTOR can create a grant with a title, description, and amount (POST `/api/grants`, 201 response).
- The created grant is automatically associated with the logged-in GRANTOR as the owner.
- A GRANTOR can only update or delete their own grants; attempting to modify another GRANTOR's grant returns a 403 Forbidden.
- A GRANTOR can view all applications submitted to their grants via GET `/api/grants/:grantId/applications`.
- A different GRANTOR cannot view another GRANTOR's grant applications (returns 403).

---

### US-4: Grant Application Submission (GRANTEE)

**As a GRANTEE, I want to browse available grants and submit applications so that I can request funding for my projects.**

**Acceptance Criteria:**
- Any authenticated user can view the list of all grants (GET `/api/grants`, 200 response with array).
- A GRANTEE can submit an application to an open grant with a proposal text (POST `/api/grants/:grantId/apply`, 201 response).
- A GRANTEE cannot apply to the same grant twice (returns 409 Conflict).
- A GRANTEE cannot apply to a closed grant (returns 400 Bad Request).
- A GRANTOR cannot submit applications (returns 403 Forbidden).

---

### US-5: Admin Role Management

**As an ADMIN, I want to assign roles to users so that I can control access levels and responsibilities within the system.**

**Acceptance Criteria:**
- An ADMIN can assign any valid role (ADMIN, GRANTOR, GRANTEE) to any user via POST `/api/users/:userId/roles`.
- Non-ADMIN users are forbidden from accessing the role assignment endpoint (403 Forbidden).
- Assigning a role to a non-existent user returns a 404 Not Found.
- Assigning a role that a user already has returns a 409 Conflict.
- Assigning an invalid role name returns a 400 Bad Request.

---

### US-6: Security and Access Control

**As a system operator, I want all protected endpoints to enforce authentication and authorization so that unauthorized users cannot access or modify data.**

**Acceptance Criteria:**
- All protected endpoints return 401 Unauthorized when accessed without a valid JWT.
- Endpoints return 403 Forbidden when a valid JWT lacks the required role.
- JWT tokens contain `userId`, `roles`, `iat`, and `exp` claims.
- Passwords are stored using bcrypt hashing (never in plaintext).
- OAuth credentials (`oauth_id`) are not exposed in API responses.

---

## Architecture

- **Backend**: Node.js + Express (MVC pattern)
- **Database**: PostgreSQL (via Sequelize ORM)
- **Cache**: Redis (ioredis)
- **Authentication**: JWT (jsonwebtoken) + OAuth 2.0 (Google)
- **Authorization**: Custom RBAC middleware
- **Containerization**: Docker + Docker Compose
- **Testing**: Jest + Supertest (≥70% code coverage)

## Database Schema

- `roles`: ADMIN, GRANTOR, GRANTEE
- `users`: User accounts (password/OAuth)
- `user_roles`: Many-to-many user-role mapping
- `grants`: Grant listings (owned by GRANTOR)
- `applications`: Grant applications (submitted by GRANTEE)
