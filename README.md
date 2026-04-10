# NestJS Tasks API

Learning project covering NestJS core concepts: modular architecture, IoC, JWT auth, RBAC, Guards, Pipes, and Exception Filters.

---

## Stack

- **NestJS 10** — framework
- **Passport + JWT** — authentication (access + refresh tokens)
- **bcrypt** — password & refresh token hashing
- **class-validator / class-transformer** — DTO validation
- **uuid** — ID generation
- SQL Server or PostgreSQL + TypeORM

---

## Project Structure

```
src/
├── main.ts                          # Bootstrap: ValidationPipe + HttpExceptionFilter
├── app.module.ts                    # Root module — imports TasksModule, AuthModule
│
├── auth/                            # Authentication domain
│   ├── dto/
│   │   ├── register.dto.ts          # @IsEmail, @MinLength(8)
│   │   └── login.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # extends AuthGuard('jwt') — requires access token
│   │   └── jwt-refresh.guard.ts     # extends AuthGuard('jwt-refresh') — requires refresh token
│   ├── strategies/
│   │   ├── jwt.strategy.ts          # Validates access token → populates request.user
│   │   └── jwt-refresh.strategy.ts  # Validates refresh token + bcrypt.compare against stored hash
│   ├── auth.controller.ts           # POST /auth/register|login|refresh|logout, GET /auth/profile
│   ├── auth.service.ts              # register, login, refreshTokens, logout, issueTokenPair
│   └── auth.module.ts
│
├── users/                           # Users domain
│   ├── user.model.ts                # User interface, Role enum (USER|ADMIN), UserPayload
│   ├── users.service.ts             # In-memory store: findByEmail, findById, create, updateRefreshToken
│   └── users.module.ts              # exports UsersService → consumed by AuthModule
│
├── tasks/                           # Tasks domain
│   ├── dto/
│   │   ├── create-task.dto.ts       # title, description, notes? — all validated
│   │   ├── update-task-status.dto.ts# @IsEnum(TaskStatus)
│   │   └── get-tasks-filter.dto.ts  # status?, search? — @IsOptional()
│   ├── task.model.ts                # Task interface, TaskStatus enum
│   ├── tasks.controller.ts          # CRUD routes — all protected by JwtAuthGuard
│   ├── tasks.service.ts             # findAll(filter?), findById, create, updateStatus, remove
│   └── tasks.module.ts
│
└── common/                          # Cross-cutting concerns
    ├── decorators/
    │   ├── current-user.decorator.ts# @CurrentUser() — extracts request.user (typed)
    │   └── roles.decorator.ts       # @Roles(Role.ADMIN) — SetMetadata wrapper
    ├── filters/
    │   └── http-exception.filter.ts # Global — uniform error format for all HttpExceptions
    └── guards/
        ├── is-owner.guard.ts        # Verifies task.ownerId === JWT user id
        └── roles.guard.ts           # Reads @Roles() metadata via Reflector
```

---

## Auth Flow

### Register / Login
```
POST /auth/register  { email, password }
POST /auth/login     { email, password }

Response:
{
  "accessToken":  "<JWT, expires 15min>",
  "refreshToken": "<JWT, expires 7d>"
}
```

- The first registered account is automatically created with the `ADMIN` role to bootstrap RBAC.
- Password hashed with bcrypt (rounds: 12) before storage.
- Refresh token hashed before storage — raw token is never persisted.
- Both tokens signed with **separate secrets** (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`).

### Token Refresh
```
POST /auth/refresh
Authorization: Bearer <refreshToken>

Response: new { accessToken, refreshToken }  (token rotation)
```

`JwtRefreshStrategy` validates the token signature **and** runs `bcrypt.compare` against the stored hash. A revoked or reused token is rejected.

### Logout
```
POST /auth/logout
Authorization: Bearer <accessToken>
```
Clears the stored refresh token hash → all future refresh attempts are rejected.

---

## Request Pipeline

```
HTTP Request
    │
    ▼
Middleware          (logging, CORS — pure Express, no Nest context)
    │
    ▼
Guard              JwtAuthGuard → verifies access token → populates request.user
    │              IsOwnerGuard → task.ownerId === request.user.id
    │              RolesGuard   → reads @Roles() metadata via Reflector
    ▼
Interceptor        (not used here — transforms response / measures timing)
    │
    ▼
Pipe               ValidationPipe — reads class-validator decorators on DTOs → 400 if invalid
    │
    ▼
Controller         Extracts @Param / @Body / @Query / @CurrentUser() → delegates to Service
    │
    ▼
Service            Business logic — throws HttpException (NotFoundException, ForbiddenException…)
    │
    ▼
Exception Filter   HttpExceptionFilter — catches all HttpExceptions → uniform JSON error response
```

---

## API Endpoints

### Auth — public routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/register` | Create account → returns token pair |
| POST | `/auth/login` | Authenticate → returns token pair |
| POST | `/auth/refresh` | Rotate tokens (refresh token required) |
| POST | `/auth/logout` | Revoke refresh token (access token required) |
| GET | `/auth/profile` | Current user info (access token required) |

### Tasks — all require `Authorization: Bearer <accessToken>`

| Method | Route | Description | Guard |
|--------|-------|-------------|-------|
| GET | `/tasks` | List tasks (`?status=OPEN&search=...`) | JwtAuthGuard |
| GET | `/tasks/:id` | Get one task | JwtAuthGuard |
| POST | `/tasks` | Create task (ownerId = JWT userId) | JwtAuthGuard |
| PATCH | `/tasks/:id/status` | Update status | JwtAuthGuard + IsOwnerGuard |
| DELETE | `/tasks/:id` | Delete task | JwtAuthGuard + IsOwnerGuard |

### Users — admin only

| Method | Route | Description | Guard |
|--------|-------|-------------|-------|
| PATCH | `/users/:id/role` | Change a user's role | JwtAuthGuard + RolesGuard (`ADMIN`) |

### Posts & Comments

| Method | Route | Description | Guard |
|--------|-------|-------------|-------|
| GET | `/posts` | List posts (paginated, `?page=1&limit=10&status=PUBLISHED&search=...`) | — |
| GET | `/posts/:id` | Get one post | — |
| POST | `/posts` | Create post (authorId = JWT userId) | JwtAuthGuard |
| POST | `/posts/:id/comments` | Add comment to a post (authorId = JWT userId) | JwtAuthGuard |

---

## RBAC — Role-Based Access Control

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Delete('/users/:id')
deleteUser() { ... }
```

`@Roles()` uses `SetMetadata` to attach allowed roles to the handler.  
`RolesGuard` reads them via `Reflector` and compares with `request.user.role`.  
If `@Roles()` is absent, `RolesGuard` passes through.

---

## Error Response Format

All errors go through `HttpExceptionFilter` and return:

```json
{
  "statusCode": 404,
  "timestamp": "2026-04-08T10:00:00.000Z",
  "path": "/tasks/unknown-id",
  "method": "GET",
  "message": "Task with id \"unknown-id\" not found"
}
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables (copy and edit)
# bash
cp .env.example .env

# PowerShell
Copy-Item .env.example .env

# 3. Make sure your local SQL Server instance is running
# Example: SQL Server (SQLEXPRESS)

# 4. Create the database in SSMS if it does not exist yet
# CREATE DATABASE nestjs_tasks;

# 5. Start in watch mode
npm run start:dev
```

**Required environment variables** (see `.env.example`):

```
DB_TYPE=mssql
DB_HOST=localhost
DB_PORT=<leave empty when using DB_INSTANCE>
DB_INSTANCE=SQLEXPRESS
DB_USERNAME=sa
DB_PASSWORD=<your SQL Server login password>
DB_NAME=nestjs_tasks
DB_SYNCHRONIZE=true
JWT_ACCESS_SECRET=<random 256-bit string>
JWT_REFRESH_SECRET=<different random 256-bit string>
```

`DB_SYNCHRONIZE=true` is useful for local development when you do not have migrations yet. Do not use it in production.

## Local SQL Server

SSMS is only the client. The NestJS app connects to the SQL Server engine, which on this machine appears to be the local `SQLEXPRESS` instance.

Use a SQL login that your local instance accepts, then create the database once in SSMS:

```sql
CREATE DATABASE nestjs_tasks;
```

If your SQL Server instance uses a fixed TCP port instead of a named instance, set `DB_PORT` and leave `DB_INSTANCE` empty.

## PostgreSQL with Docker

The workspace includes a local PostgreSQL container in `docker-compose.yml` using `postgres:16-alpine`.

```bash
# start only postgres
docker compose up -d postgres

# stop it
docker compose down
```

Default container settings match the NestJS config in `src/app.module.ts` and `data-source.ts`:

```text
host=localhost
port=5432
user=postgres
password=postgres
database=nestjs_tasks
```

If Docker is not installed yet, install Docker Desktop first. Then run `docker compose up -d postgres` from the project root.

---

## Quick Test (curl)

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"password123"}'

# Store the accessToken and refreshToken from the response, then:

# Create a task
curl -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn NestJS","description":"Guards and strategies"}'

# List tasks with filters
curl "http://localhost:3000/tasks?status=OPEN&search=nest" \
  -H "Authorization: Bearer <accessToken>"

# Update status (only task owner)
curl -X PATCH http://localhost:3000/tasks/<taskId>/status \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'

# Refresh tokens
curl -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer <refreshToken>"
```
