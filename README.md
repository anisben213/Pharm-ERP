# ERP Pharm

Modular ERP for a pharmaceutical company with **end-to-end batch traceability**.

## Stack

- **Backend**: Express.js + Prisma + PostgreSQL, JWT (access + refresh) in httpOnly cookies
- **Frontend**: React 18 + Vite + Tailwind CSS + Axios + React Router
- **Security**: Helmet, CORS, XSS-clean, mongo-sanitize, HPP, rate limiting, Zod validation, RBAC
- **Concurrency**: Optimistic locking (`version` field) + Prisma `Serializable` transactions
- **Observability**: Winston logs + `AuditLog` table (visible in the admin page)

## Modules

`auth` · `users` · `products` · `suppliers` · `customers` · `purchases` · `production` · `quality` · `batches` · `stock` · `sales` · `logs`

## Actors (RBAC roles)

- `ADMIN` – full access, user & audit management
- `PURCHASER` – purchase orders
- `STOCK_MANAGER` – stock movements, receiving
- `PRODUCTION_MANAGER` – production orders, BOM consumption
- `QUALITY_CONTROLLER` – QC inspections (release/reject batches)
- `SALES_AGENT` – sales orders

## Added value — Batch traceability

Every **Batch** has:
- `version` (optimistic lock)
- `remainingQty`
- status lifecycle: `CREATED → IN_QUARANTINE → APPROVED / REJECTED → IN_PRODUCTION → RELEASED → SOLD / RECALLED / EXPIRED`
- parent/child links via `BatchGenealogy`

`GET /api/batches/:id/trace` returns the full upstream (raw materials) and downstream (finished goods, sales) tree. The UI renders it as a genealogy tree at `/batches/:id`.

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # edit DATABASE_URL and secrets
npx prisma migrate dev --name init
npm run seed
npm run dev            # http://localhost:5000
```

Default admin: **admin@erp-pharm.local / Admin@123**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend on port 5000.

## Project structure

```
backend/
  prisma/
    schema.prisma
    seed.js
  src/
    config/        (env, db, logger)
    middleware/    (auth, rbac, validate, errorHandler)
    utils/         (jwt, ApiError, asyncHandler, auditLogger)
    modules/
      auth/ users/ batches/ stock/ purchases/
      production/ quality/ sales/ products/
      suppliers/ customers/ logs/
    app.js
    server.js

frontend/
  src/
    components/    (Table, Modal, Button, PageHeader, StatusBadge)
    context/       (AuthContext)
    layouts/       (MainLayout)
    pages/         (Login, Dashboard, Batches, BatchTrace, Purchases,
                    Production, Quality, Sales, Stock, Users, Logs)
    routes/        (AppRoutes, ProtectedRoute)
    services/      (api axios instance + per-module services)
    App.jsx
    main.jsx
```

## API overview

| Method | Route | Roles |
|---|---|---|
| POST | `/api/auth/login` · `/refresh` · `/logout` · `GET /me` | public / self |
| `/api/users` | CRUD | ADMIN |
| `/api/batches` · `/:id` · `/:id/trace` · `PATCH /:id/status` | all / QC+ADMIN |
| `/api/purchases` · `POST /:id/receive` | PURCHASER, STOCK_MANAGER, ADMIN |
| `/api/production` · `POST /:id/complete` | PRODUCTION_MANAGER, ADMIN |
| `/api/quality` | QUALITY_CONTROLLER, ADMIN |
| `/api/sales` | SALES_AGENT, ADMIN |
| `/api/stock/movements` · `/summary` | STOCK_MANAGER, ADMIN |
| `/api/logs` | ADMIN |

## Security highlights

- Passwords hashed with bcrypt
- JWT access (15 min) + refresh (7 d), both in httpOnly cookies; refresh tokens tracked server-side and revocable
- `helmet` + strict CORS with credentials
- Zod validation on every write endpoint
- `express-mongo-sanitize` + `xss-clean` + `hpp` on all requests
- Global rate limit 300/15min; login limit 10/15min
- RBAC middleware on each route
- Prisma parameterised queries (SQL-injection safe)
- Every mutation is recorded in `AuditLog` with user, IP, entity, action

## License
Educational project.
