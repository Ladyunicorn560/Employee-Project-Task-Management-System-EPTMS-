# Employee Project & Task Management System (EPTMS) - Backend API

Production-ready Node.js & Express backend API for the Employee Project & Task Management System (EPTMS), built with a Clean Layered Architecture (Controller-Service-Repository), SQL Server database connection pooling, JWT authentication, and RBAC authorization guards.

## Technology Stack
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** Microsoft SQL Server (`mssql` / `msnodesqlv8`)
- **Authentication:** JWT Bearer Token (HMAC-SHA256)
- **Security:** Helmet, CORS, Express-Rate-Limit, Bcrypt.js, Compression
- **Validation:** Zod schema validation
- **Logging:** Winston structured logger

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Microsoft SQL Server with database `EPTMS_DB` configured and seeded.

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DB_SERVER=<your-sql-server-name>
   DB_NAME=EPTMS_DB
   DB_TRUST_SERVER_CERTIFICATE=true
   DB_ENCRYPT=false
   JWT_SECRET=super_secret_jwt_key_eptms_production_2026_change_in_prod
   JWT_EXPIRES_IN=8h
   ```

3. Start the application:
   ```bash
   # Development mode with hot-reloading
   npm run dev

   # Production mode
   npm start
   ```

---

## Health Check Verification
Verify server and SQL Server database connectivity via health endpoint:
```http
GET http://localhost:5000/api/v1/health
```

Sample Success Response (`200 OK`):
```json
{
  "success": true,
  "status": 200,
  "message": "EPTMS Backend API is operating normally",
  "timestamp": "2026-07-31T00:00:00.000Z",
  "services": {
    "server": "UP",
    "database": "UP",
    "details": {
      "serverName": "<configured-server>",
      "databaseName": "EPTMS_DB"
    }
  }
}
```

---

## Clean Layered Architecture Overview
```
Client Request ➔ Routes ➔ Security Middlewares ➔ Controller ➔ Service Layer ➔ Repository Layer ➔ SQL Server (EPTMS_DB)
```
