# Grant Management Portal

A secure, multi-user web application for managing grant applications featuring Role-Based Access Control (RBAC), OAuth 2.0 authentication, and JWT-based authorization.

## Tech Stack

- **Runtime**: Node.js 20 + Express 4
- **Database**: PostgreSQL 16 (Sequelize ORM)
- **Cache**: Redis 7
- **Auth**: JWT + Google OAuth 2.0
- **Testing**: Jest + Supertest
- **Containerization**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed

### 1. Clone and configure

```bash
git clone <https://github.com/aravindpunyamantula/Grant-Management-Portal.git>
cd grant-management-portal
cp .env.example .env
# Edit .env with your OAuth credentials
```

### 2. Start all services

```bash
docker-compose up --build
```

The application will be available at `http://localhost:3000`.

> The database is automatically seeded with roles and an admin user on first startup.

### Default Admin Credentials

| Field    | Value               |
|----------|---------------------|
| Email    | admin@example.com   |
| Password | Admin@123456        |

---

## API Reference

### Authentication

| Method | Endpoint                        | Auth    | Description                  |
|--------|---------------------------------|---------|------------------------------|
| POST   | `/api/auth/register`            | None    | Register a new user          |
| POST   | `/api/auth/login`               | None    | Login with email/password    |
| GET    | `/api/auth/google/callback`     | None    | Google OAuth 2.0 callback    |

### Users (Admin Only)

| Method | Endpoint                        | Auth    | Role  | Description            |
|--------|---------------------------------|---------|-------|------------------------|
| GET    | `/api/users`                    | Bearer  | ADMIN | List all users         |
| POST   | `/api/users/:userId/roles`      | Bearer  | ADMIN | Assign role to user    |

### Grants

| Method | Endpoint                             | Auth   | Role           | Description                     |
|--------|--------------------------------------|--------|----------------|---------------------------------|
| GET    | `/api/grants`                        | Bearer | Any            | List all grants                 |
| POST   | `/api/grants`                        | Bearer | GRANTOR        | Create a grant                  |
| GET    | `/api/grants/:grantId`               | Bearer | Any            | Get a specific grant            |
| PUT    | `/api/grants/:grantId`               | Bearer | GRANTOR (owner)| Update grant                    |
| DELETE | `/api/grants/:grantId`               | Bearer | GRANTOR (owner)| Delete grant                    |
| GET    | `/api/grants/:grantId/applications`  | Bearer | GRANTOR (owner)| View applications for grant     |
| POST   | `/api/grants/:grantId/apply`         | Bearer | GRANTEE        | Apply for a grant               |

---

## JWT Payload

```json
{
  "userId": "uuid",
  "roles": ["GRANTEE"],
  "iat": 1616239022,
  "exp": 1616242622
}
```

---

## Running Tests

### Unit and Integration Tests

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage report
npm run test:coverage
```

The coverage report is generated in `./coverage/`.

> Tests use SQLite in-memory by default. Ensure DATABASE_URL is set to a test PostgreSQL instance or the tests will use Sequelize's in-memory mode.

---

## Development Setup (without Docker)

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your local PostgreSQL and Redis settings

# Start the application
npm run dev
```

---

## Environment Variables

See [.env.example](.env.example) for all required variables.

| Variable              | Description                              |
|-----------------------|------------------------------------------|
| `DATABASE_URL`        | PostgreSQL connection string             |
| `REDIS_URL`           | Redis connection string                  |
| `JWT_SECRET`          | Secret key for signing JWTs             |
| `JWT_EXPIRES_IN`      | JWT expiration duration (e.g., `1h`)    |
| `OAUTH_CLIENT_ID`     | Google OAuth 2.0 Client ID              |
| `OAUTH_CLIENT_SECRET` | Google OAuth 2.0 Client Secret          |
| `OAUTH_CALLBACK_URL`  | OAuth redirect URI                      |

---

## Project Structure

```
grant-management-portal/
├── src/
│   ├── config/         # Database and Redis configuration
│   ├── controllers/    # Route handlers (MVC controllers)
│   ├── middleware/     # Auth and RBAC middleware
│   ├── models/         # Sequelize models
│   ├── routes/         # Express routers
│   ├── utils/          # JWT utilities
│   └── app.js          # Express app entry point
├── tests/              # Jest test suites
├── db/
│   └── init.sql        # Database initialization and seeding
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── PROJECT_PLAN.md
└── README.md
```
