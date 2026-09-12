# Employee Project & Task Management System (EPTMS) - Backend API

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/database-SQL%20Server-red.svg)](https://www.microsoft.com/sql-server)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![CI Build](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

Production-ready backend API service for the **Employee Project & Task Management System (EPTMS)**. This project is built using Node.js and Express.js, backed by a Microsoft SQL Server database, and secured using JSON Web Tokens (JWT) and Role-Based Access Control (RBAC).

---

## 🌐 Live Demo & Deployment Links

| Component | Service | Live URL |
| :--- | :--- | :--- |
| **Frontend Web App** | Render Static Site | [https://eptms-frontend-app.onrender.com](https://eptms-frontend-app.onrender.com) |
| **Backend API Service** | Render Web Service | [https://eptms-backend-api.onrender.com](https://eptms-backend-api.onrender.com) |
| **Swagger API Docs** | Live OpenAPI UI | [https://eptms-backend-api.onrender.com/api-docs](https://eptms-backend-api.onrender.com/api-docs) |

> **Quick Demo Access**: Click **Admin**, **Manager**, or **Employee** buttons on the live login page to explore all features instantly in Demo Mode.

---

## 📖 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Technology Stack](#technology-stack)
4. [Folder Structure](#folder-structure)
5. [Prerequisites](#prerequisites)
6. [Installation](#installation)
7. [Environment Variables](#environment-variables)
8. [Database Setup & Migration Order](#database-setup--migration-order)
9. [Running Locally](#running-locally)
10. [Docker Support](#docker-support)
11. [API Documentation (Swagger)](#api-documentation-swagger)
12. [Postman Collection](#postman-collection)
13. [Testing & Verification](#testing--verification)
14. [Security Hardening](#security-hardening)
15. [Performance Configurations](#performance-configurations)
16. [API Versioning](#api-versioning)
17. [API Modules Summary](#api-modules-summary)
18. [Contributing](#contributing)
19. [License](#license)

---

## 🔍 Project Overview
The EPTMS backend provides a robust enterprise-grade REST API covering employee management, department grouping, projects, task and subtask delegation, comments/attachments, approval reviews, real-time in-app notifications, and comprehensive dashboard analytics with PDF/Excel reports.

---

## 🏗️ Architecture Diagram
The EPTMS codebase implements a **Clean Layered Architecture** with unidirectional dependency flow:

```
                  ┌─────────────────────────────────────────┐
                  │              HTTP Client                │
                  └────────────────────┬────────────────────┘
                                       │ HTTP Requests
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │              Routes Layer               │
                  └────────────────────┬────────────────────┘
                                       │ Request Match
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │         Security Middleware            │
                  │  (Helmet, CORS, JWT Auth, Rate Limits)  │
                  └────────────────────┬────────────────────┘
                                       │ Validated Session
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │           Controller Layer              │
                  │  (Zod Parsing, Response Formatting)     │
                  └────────────────────┬────────────────────┘
                                       │ Params & Payloads
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │              Service Layer              │
                  │   (Business Logic, RBAC Guards, PDF)    │
                  └────────────────────┬────────────────────┘
                                       │ Queries & Transactions
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │            Repository Layer             │
                  │    (Parameterized SQL, Pool Exec)       │
                  └────────────────────┬────────────────────┘
                                       │ mssql queries
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │            SQL Server Database          │
                  └─────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack
- **Runtime Environment:** Node.js (v18+)
- **Web Framework:** Express.js (v4.19+)
- **Database Engine:** Microsoft SQL Server (2019 / 2022 / Express)
- **Database Drivers:** `mssql` (SQL Server driver) & `msnodesqlv8` (Windows native local driver)
- **Security:**
  - **Auth:** JSON Web Tokens (`jsonwebtoken`)
  - **Hashing:** Bcrypt.js (`bcryptjs`)
  - **Headers:** Helmet (`helmet`)
  - **CORS:** Cross-Origin Resource Sharing (`cors`)
  - **Brute Protection:** Express Rate Limit (`express-rate-limit`)
- **Validation:** Zod Schema Validation (`zod`)
- **Export Formats:** `pdfkit` (PDF generation), `exceljs` (Excel workbook formatting), `csv-stringify` (CSV serialisation)
- **Structured Logging:** Winston Logger (`winston`)

---

## 📂 Folder Structure
```
eptms-backend/
├── .github/workflows/       # GitHub Actions CI pipelines
│   └── ci.yml
├── database/                # Schema tables, views, procedures, and seed scripts
│   ├── 01_CreateTables.sql
│   ├── 02_CreateConstraints.sql
│   ├── 03_CreateIndexes.sql
│   ├── 04_CreateViews.sql
│   ├── 05_CreateProcedures.sql
│   ├── 06_SeedData.sql
│   ├── 07_AddAuthColumnsToEmployee.sql
│   ├── 09_UpdateTaskStatusConstraint.sql
│   ├── 10_AddSubtaskColumns.sql
│   └── 12_UpdateReviewStatusConstraint.sql
├── docs/                    # API documentation and assets
│   └── EPTMS_Postman_Collection.json
├── scratch/                 # Integration test scripts
│   └── testFullRegressionSuite.js
├── src/                     # Core Application Code
│   ├── config/              # Security and DB Connection Pools
│   ├── constants/           # Enums, workflow states, and HTTP Status Codes
│   ├── controllers/         # Request handling and dispatcher Layer
│   ├── docs/                # Swagger paths definitions and schemas
│   ├── errors/              # Express Custom AppError handlers
│   ├── middlewares/         # JWT Authenticate, Validate, Authorize guards
│   ├── repositories/        # Parameterized SQL database queries
│   ├── routes/              # Express API routers
│   ├── services/            # Core business workflows & PDF/Excel exports
│   ├── utils/               # Winston logger, Crypto, JWT wrappers
│   ├── validators/          # Zod request validators
│   └── app.js               # Express application setup
├── Dockerfile               # Production multi-stage Docker container spec
├── docker-compose.yml       # Docker orchestration with API and SQL Server
├── eslint.config.js         # ESLint code quality flat configuration
├── package.json             # NPM package manifest
├── README.md                # Project documentation
└── server.js                # Server entrypoint and graceful shutdown logic
```

---

## 📋 Prerequisites
- **Node.js:** v18.0.0 or higher
- **NPM:** v9.0.0 or higher
- **Microsoft SQL Server:** Local instance or Docker Container
- **OS:** Windows / Linux / macOS

---

## ⚙️ Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd eptms-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🔑 Environment Variables
Create a `.env` file in the root directory. Copy the template from `.env.example` and set the variables:

| Variable | Description | Default | Environment |
|----------|-------------|---------|-------------|
| `PORT` | API Server listening port | `5000` | All |
| `NODE_ENV` | Environment context (`development` / `production` / `test`) | `development` | All |
| `DB_SERVER` | SQL Server Hostname or Instance Name | Required | All |
| `DB_NAME` | Database name | `EPTMS_DB` | All |
| `DB_USER` | SQL Server Username (leave blank for Windows Auth) | (empty) | Dev / Staging |
| `DB_PASSWORD` | SQL Server Password (leave blank for Windows Auth) | (empty) | Dev / Staging |
| `JWT_SECRET` | Secret key for signing JWT tokens (min 32 chars) | Required | Production |
| `JWT_EXPIRES_IN` | Token duration (e.g. `8h`, `24h`, `7d`) | `8h` | All |
| `CORS_ORIGIN` | Allowed clients, comma-separated | `http://localhost:3000` | All |
| `RATE_LIMIT_WINDOW_MS` | Global rate limit time window (ms) | `900000` (15m) | Production |
| `RATE_LIMIT_MAX_REQUESTS`| Global max requests allowed in the window | `100` | Production |
| `AUTH_RATE_LIMIT_MAX_REQUESTS`| Max login attempts in the window | `10` | Production |
| `LOG_LEVEL` | Logging level (`error`/`warn`/`info`/`debug`) | `info` | All |

---

## 💾 Database Setup & Migration Order
If hosting SQL Server locally, connect to your instance using **SQL Server Management Studio (SSMS)** or **Azure Data Studio**, create a database named `EPTMS_DB`, and execute the files in `database/` in the following sequence:

1. **`database/01_CreateTables.sql`** — Tables creation (Employee, Project, Task, etc.)
2. **`database/02_CreateConstraints.sql`** — Reference constraints and workflow checks
3. **`database/03_CreateIndexes.sql`** — Optimization indexes on foreign keys
4. **`database/04_CreateViews.sql`** — Project and Department summary views
5. **`database/05_CreateProcedures.sql`** — Core progress recalculation stored procedures
6. **`database/06_SeedData.sql`** — Demo seed records (passwords defaulted to `Password123!`)
7. **`database/07_AddAuthColumnsToEmployee.sql`** — JWT login credential columns
8. **`database/09_UpdateTaskStatusConstraint.sql`** — Expanded task workflows
9. **`database/10_AddSubtaskColumns.sql`** — Subtask fields and foreign keys
10. **`database/12_UpdateReviewStatusConstraint.sql`** — Immutable review approval workflows

---

## 🚀 Running Locally
### Development Mode (with hot-reloading)
Make sure your database server is running, then execute:
```bash
npm run dev
```

### Production Mode
To run the server in optimized production mode:
```bash
npm start
```

---

## 🐳 Docker Support
Build and run the entire stack (Express API server + Microsoft SQL Server database) in containers:

1. Setup environment parameters in your `.env` file (ensure `MSSQL_SA_PASSWORD` is strong).
2. Start the services:
   ```bash
   docker-compose up --build
   ```
3. Verification:
   The database container starts, runs health checks, and the API container starts only after SQL Server is fully healthy.

- **API Endpoint:** `http://localhost:5000/api/v1`
- **Health Check Status:** `http://localhost:5000/api/v1/health`

---

## ⚡ API Documentation (Swagger)
The API documentation is powered by Swagger UI and OpenAPI 3.0 specs.

Exposed Route:
```http
GET http://localhost:5000/api-docs
```
OpenAPI JSON Spec:
```http
GET http://localhost:5000/api-docs.json
```

---

## 📮 Postman Collection
The Postman collection is exported in Postman v2.1 format.
- File Path: [EPTMS_Postman_Collection.json](docs/EPTMS_Postman_Collection.json)

**Features:**
1. Folder structure organized by API modules (Auth, Employees, Projects, Reports, etc.)
2. Environment variables (`{{base_url}}`, `{{token}}`, `{{admin_token}}`)
3. Pre-request scripting to inject JWT token automatically
4. Login tests script to capture the JWT token and set the `token` variable.

---

## 🧪 Testing & Verification
Execute the comprehensive integration regression test suite covering all modules:
```bash
node scratch/testFullRegressionSuite.js
```
The script will perform end-to-end integration flows against your configured test database.

---

## 🔒 Security Hardening
The EPTMS API implements professional security mechanisms:
1. **Secure Headers:** Powered by `helmet` to hide `X-Powered-By`, prevent clickjacking (`Frame-Options`), enforce HSTS, and block MIME sniffing.
2. **CORS Guards:** Enforces restricted client domain validation with automated logging on blocked requests.
3. **Double Rate Limiting:**
   - Global requests rate limiting (100 requests per 15 minutes).
   - Auth endpoint-specific rate limiting (10 login/change-password attempts per 15 minutes) to mitigate brute-force vectoring.
4. **JWT Validation:** HMAC-SHA256 signature verification.
5. **No Hardcoded Secrets:** Enforced using Zod environment parsers.
6. **SQL Parameterization:** Enforced at the Repository layer to eliminate SQL injection vulnerabilities.

---

## 🚀 Performance Configurations
1. **Payload Compression:** GZIP compression on response streams (`compression`).
2. **Server Timouts:** Configured on the HTTP server object (`server.js`) to align with production load balancer requirements (e.g. AWS ALB):
   - `keepAliveTimeout` = 65 seconds
   - `headersTimeout` = 66 seconds
   - `requestTimeout` = 120 seconds
3. **Connection Pooling:** Structured connection pool configured with a maximum of 20 connections to reuse resources efficiently.

---

## 🏷️ API Versioning
All backend routes are versioned using prefix path segment:
```http
/api/v1/...
```

---

## 📑 API Modules Summary

| Module | Base Path | Methods | Description |
|--------|-----------|---------|-------------|
| **Health** | `/health` | `GET` | Server & DB health diagnostics |
| **Auth** | `/auth` | `POST`, `GET`, `PUT` | Login, Logout, Me profile, Password updates |
| **Employees** | `/employees` | `GET`, `POST`, `PUT`, `DELETE` | Employee management |
| **Departments**| `/departments` | `GET`, `POST`, `PUT`, `DELETE` | Org structure departments |
| **Roles** | `/roles` | `GET`, `POST`, `PUT`, `DELETE` | Access roles |
| **Projects** | `/projects` | `GET`, `POST`, `PUT`, `DELETE` | Project configurations |
| **Members** | `/projects/:id/members` | `GET`, `POST`, `DELETE` | Project team assignments |
| **Milestones** | `/milestones` | `GET`, `POST`, `PUT`, `DELETE` | Project milestones |
| **Tasks** | `/tasks` | `GET`, `POST`, `PUT`, `DELETE` | Task workflows |
| **Subtasks** | `/subtasks` | `GET`, `POST`, `PUT`, `DELETE` | Subtasks checklists |
| **Comments** | `/comments` | `GET`, `POST`, `PUT`, `DELETE` | Comments on tasks |
| **Attachments**| `/attachments` | `GET`, `POST`, `DELETE` | Task attachment files |
| **Reviews** | `/reviews` | `GET`, `POST`, `PUT`, `DELETE` | Verification reviews |
| **Notifications**|`/notifications`| `GET`, `PATCH` | System alerts |
| **Dashboard** | `/dashboard` | `GET` | Aggregated statistics |
| **Reports** | `/reports` | `GET` | Export summary PDF/Excel/CSV |

---

## 🤝 Contributing
Please submit issues and pull requests to the EPTMS Backend Repository.
All code must pass ESLint (`npm run lint`) and the Regression Suite before approval.

---

## 📄 License
Licensed under the ISC License. Copyright (c) 2026 EPTMS Architecture Team.
