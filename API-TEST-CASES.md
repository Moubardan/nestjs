# API Test Cases

Base URL: `http://localhost:3000`

---

## 1. Auth — `POST /auth/register`

| # | Test Case | Method | Body | Expected Status | Expected Behavior |
|---|-----------|--------|------|-----------------|-------------------|
| 1.1 | Register valid user | POST | `{"email":"alice@test.com","password":"password123"}` | 201 | Returns `{ accessToken, refreshToken }` |
| 1.2 | First user gets ADMIN role | POST | `{"email":"first@test.com","password":"password123"}` | 201 | Returned JWT payload has `role: "ADMIN"` |
| 1.3 | Second user gets USER role | POST | `{"email":"second@test.com","password":"password123"}` | 201 | Returned JWT payload has `role: "USER"` |
| 1.4 | Duplicate email | POST | `{"email":"alice@test.com","password":"password123"}` | 409 | Conflict — email already exists |
| 1.5 | Invalid email format | POST | `{"email":"not-an-email","password":"password123"}` | 400 | Validation error: "Invalid email address" |
| 1.6 | Missing email | POST | `{"password":"password123"}` | 400 | Validation error on email |
| 1.7 | Password too short (<8) | POST | `{"email":"a@b.com","password":"1234567"}` | 400 | "Password must be at least 8 characters" |
| 1.8 | Password too long (>64) | POST | `{"email":"a@b.com","password":"<65 chars>"}` | 400 | Validation error on password |
| 1.9 | Missing password | POST | `{"email":"a@b.com"}` | 400 | Validation error on password |
| 1.10 | Empty body | POST | `{}` | 400 | Validation errors on email and password |

---

## 2. Auth — `POST /auth/login`

| # | Test Case | Method | Body | Expected Status | Expected Behavior |
|---|-----------|--------|------|-----------------|-------------------|
| 2.1 | Login valid credentials | POST | `{"email":"alice@test.com","password":"password123"}` | 200 | Returns `{ accessToken, refreshToken }` |
| 2.2 | Wrong password | POST | `{"email":"alice@test.com","password":"wrongpass"}` | 401 | "Invalid credentials" |
| 2.3 | Non-existent email | POST | `{"email":"nobody@test.com","password":"password123"}` | 401 | "Invalid credentials" |
| 2.4 | Invalid email format | POST | `{"email":"bad","password":"password123"}` | 400 | Validation error: "Invalid email address" |
| 2.5 | Missing email | POST | `{"password":"password123"}` | 400 | Validation error on email |
| 2.6 | Missing password | POST | `{"email":"alice@test.com"}` | 400 | Validation error on password |
| 2.7 | Empty body | POST | `{}` | 400 | Validation errors |

---

## 3. Auth — `POST /auth/refresh`

**Header:** `Authorization: Bearer <refreshToken>`

| # | Test Case | Token | Expected Status | Expected Behavior |
|---|-----------|-------|-----------------|-------------------|
| 3.1 | Valid refresh token | Valid refresh token | 200 | Returns new `{ accessToken, refreshToken }` (rotation) |
| 3.2 | No Authorization header | — | 401 | Unauthorized |
| 3.3 | Access token instead of refresh | Valid access token | 401 | Unauthorized — wrong secret |
| 3.4 | Expired refresh token | Expired refresh token | 401 | Unauthorized |
| 3.5 | Malformed token | `Bearer garbage` | 401 | Unauthorized |
| 3.6 | Revoked refresh token (after logout) | Old refresh token | 401 | Unauthorized — bcrypt compare fails |
| 3.7 | Old refresh token after rotation | Previous refresh token | 401 | Unauthorized — hash no longer matches |

---

## 4. Auth — `POST /auth/logout`

**Header:** `Authorization: Bearer <accessToken>`

| # | Test Case | Token | Expected Status | Expected Behavior |
|---|-----------|-------|-----------------|-------------------|
| 4.1 | Valid logout | Valid access token | 204 | No content — refresh token hash cleared |
| 4.2 | No Authorization header | — | 401 | Unauthorized |
| 4.3 | Expired access token | Expired token | 401 | Unauthorized |
| 4.4 | Refresh after logout | — | 401 | Refresh token rejected (hash is null) |

---

## 5. Auth — `GET /auth/profile`

**Header:** `Authorization: Bearer <accessToken>`

| # | Test Case | Token | Expected Status | Expected Behavior |
|---|-----------|-------|-----------------|-------------------|
| 5.1 | Get profile | Valid access token | 200 | Returns `{ id, email, role }` — no passwordHash or refreshTokenHash |
| 5.2 | No Authorization header | — | 401 | Unauthorized |
| 5.3 | Expired access token | Expired token | 401 | Unauthorized |
| 5.4 | Malformed token | `Bearer xyz` | 401 | Unauthorized |

---

## 6. Tasks — `GET /tasks`

**Header:** `Authorization: Bearer <accessToken>`

| # | Test Case | Query Params | Expected Status | Expected Behavior |
|---|-----------|--------------|-----------------|-------------------|
| 6.1 | List all tasks | — | 200 | Returns array of tasks for current user |
| 6.2 | Filter by status | `?status=OPEN` | 200 | Returns only OPEN tasks |
| 6.3 | Filter by search | `?search=nest` | 200 | Returns tasks matching title or description |
| 6.4 | Combine status + search | `?status=OPEN&search=nest` | 200 | Returns filtered results |
| 6.5 | Invalid status enum | `?status=INVALID` | 400 | "status must be one of: OPEN, IN_PROGRESS, DONE" |
| 6.6 | Search too long (>100) | `?search=<101 chars>` | 400 | Validation error |
| 6.7 | No auth header | — | 401 | Unauthorized |

---

## 7. Tasks — `GET /tasks/:id`

**Header:** `Authorization: Bearer <accessToken>`

| # | Test Case | Param | Expected Status | Expected Behavior |
|---|-----------|-------|-----------------|-------------------|
| 7.1 | Get existing task | Valid task ID | 200 | Returns task object |
| 7.2 | Non-existent task | Random UUID | 404 | "Task with id \"...\" not found" |
| 7.3 | No auth header | — | 401 | Unauthorized |

---

## 8. Tasks — `POST /tasks`

**Header:** `Authorization: Bearer <accessToken>`

| # | Test Case | Body | Expected Status | Expected Behavior |
|---|-----------|------|-----------------|-------------------|
| 8.1 | Create valid task | `{"title":"Learn NestJS","description":"Guards and strategies"}` | 201 | Returns task with `status: "OPEN"`, `ownerId` = JWT user id |
| 8.2 | With optional notes | `{"title":"Task","description":"Desc","notes":"Some notes"}` | 201 | Task includes notes field |
| 8.3 | Title too short (<3) | `{"title":"AB","description":"Valid description"}` | 400 | "Title must be at least 3 characters" |
| 8.4 | Title too long (>100) | `{"title":"<101 chars>","description":"Valid"}` | 400 | Validation error |
| 8.5 | Description too long (>500) | `{"title":"Valid","description":"<501 chars>"}` | 400 | Validation error |
| 8.6 | Missing title | `{"description":"Valid"}` | 400 | Validation error |
| 8.7 | Missing description | `{"title":"Valid title"}` | 400 | Validation error |
| 8.8 | Empty body | `{}` | 400 | Validation errors on title and description |
| 8.9 | Notes too long (>200) | `{"title":"Valid","description":"Valid desc","notes":"<201 chars>"}` | 400 | Validation error |
| 8.10 | No auth header | — | 401 | Unauthorized |

---

## 9. Tasks — `PATCH /tasks/:id/status`

**Header:** `Authorization: Bearer <accessToken>`
**Guards:** JwtAuthGuard + IsOwnerGuard

| # | Test Case | Param / Body | Expected Status | Expected Behavior |
|---|-----------|--------------|-----------------|-------------------|
| 9.1 | Update own task status | Own task ID / `{"status":"IN_PROGRESS"}` | 200 | Returns task with updated status |
| 9.2 | Set to DONE | Own task ID / `{"status":"DONE"}` | 200 | Status updated to DONE |
| 9.3 | Invalid status enum | `{"status":"INVALID"}` | 400 | "status must be one of: OPEN, IN_PROGRESS, DONE" |
| 9.4 | Missing status | `{}` | 400 | Validation error |
| 9.5 | Non-existent task | Random UUID | 404 | Not found |
| 9.6 | Update another user's task | Other user's task ID | 403 | Forbidden — not the owner |
| 9.7 | No auth header | — | 401 | Unauthorized |

---

## 10. Tasks — `DELETE /tasks/:id`

**Header:** `Authorization: Bearer <accessToken>`
**Guards:** JwtAuthGuard + IsOwnerGuard

| # | Test Case | Param | Expected Status | Expected Behavior |
|---|-----------|-------|-----------------|-------------------|
| 10.1 | Delete own task | Own task ID | 204 | No content — task removed |
| 10.2 | Delete non-existent task | Random UUID | 404 | Not found |
| 10.3 | Delete another user's task | Other user's task ID | 403 | Forbidden — not the owner |
| 10.4 | No auth header | — | 401 | Unauthorized |
| 10.5 | Verify task is gone after delete | GET deleted task ID | 404 | Not found |

---

## 11. Users — `PATCH /users/:id/role`

**Header:** `Authorization: Bearer <accessToken>`
**Guards:** JwtAuthGuard + RolesGuard (ADMIN only)

| # | Test Case | Token / Body | Expected Status | Expected Behavior |
|---|-----------|--------------|-----------------|-------------------|
| 11.1 | Admin updates user role | Admin token / `{"role":"ADMIN"}` | 200 | Returns `{ id, email, role }` with updated role |
| 11.2 | Admin demotes to USER | Admin token / `{"role":"USER"}` | 200 | Role changed to USER |
| 11.3 | Non-admin tries to update role | USER token / `{"role":"ADMIN"}` | 403 | Forbidden |
| 11.4 | Invalid role enum | `{"role":"SUPERADMIN"}` | 400 | Validation error |
| 11.5 | Missing role | `{}` | 400 | Validation error |
| 11.6 | Non-existent user ID | Random UUID / `{"role":"ADMIN"}` | 404 | Not found |
| 11.7 | No auth header | — | 401 | Unauthorized |

---

## 12. Posts — `GET /posts`

**Public route — no auth required**

| # | Test Case | Query Params | Expected Status | Expected Behavior |
|---|-----------|--------------|-----------------|-------------------|
| 12.1 | List posts default pagination | — | 200 | Returns `{ data: [...], meta: { page: 1, limit: 10, total, totalPages } }` |
| 12.2 | Custom page & limit | `?page=2&limit=5` | 200 | Returns page 2 with up to 5 posts |
| 12.3 | Filter by status | `?status=PUBLISHED` | 200 | Returns only PUBLISHED posts |
| 12.4 | Filter by DRAFT status | `?status=DRAFT` | 200 | Returns only DRAFT posts |
| 12.5 | Invalid status | `?status=INVALID` | 400 | "status must be one of: DRAFT, PUBLISHED" |
| 12.6 | Page = 0 (below min) | `?page=0` | 400 | Validation error (min: 1) |
| 12.7 | Limit = 0 (below min) | `?limit=0` | 400 | Validation error (min: 1) |
| 12.8 | Limit > 50 (above max) | `?limit=51` | 400 | Validation error (max: 50) |
| 12.9 | Non-integer page | `?page=abc` | 400 | Validation error |
| 12.10 | Empty result set | High page number | 200 | Returns `{ data: [], meta: { ... } }` |

---

## 13. Posts — `GET /posts/:id`

**Public route — no auth required**

| # | Test Case | Param | Expected Status | Expected Behavior |
|---|-----------|-------|-----------------|-------------------|
| 13.1 | Get existing post | Valid post ID | 200 | Returns post with `author`, `comments`, and `comments.author` relations |
| 13.2 | Non-existent post | Random UUID | 404 | "Post with id \"...\" not found" |

---

## 14. Posts — `POST /posts`

**Header:** `Authorization: Bearer <accessToken>`

| # | Test Case | Body | Expected Status | Expected Behavior |
|---|-----------|------|-----------------|-------------------|
| 14.1 | Create post with defaults | `{"title":"My Post","content":"Some content here for the post"}` | 201 | Returns post with `status: "DRAFT"`, `authorId` = JWT user id |
| 14.2 | Create post with explicit status | `{"title":"My Post","content":"Some content here for the post","status":"PUBLISHED"}` | 201 | Post has `status: "PUBLISHED"` |
| 14.3 | Title too short (<3) | `{"title":"AB","content":"Valid content text"}` | 400 | Validation error |
| 14.4 | Title too long (>150) | `{"title":"<151 chars>","content":"Valid content text"}` | 400 | Validation error |
| 14.5 | Content too short (<10) | `{"title":"Valid","content":"Short"}` | 400 | Validation error |
| 14.6 | Missing title | `{"content":"Valid content text"}` | 400 | Validation error |
| 14.7 | Missing content | `{"title":"Valid Title"}` | 400 | Validation error |
| 14.8 | Empty body | `{}` | 400 | Validation errors on title and content |
| 14.9 | Invalid status enum | `{"title":"Valid","content":"Valid content text","status":"ARCHIVED"}` | 400 | "status must be one of: DRAFT, PUBLISHED" |
| 14.10 | No auth header | — | 401 | Unauthorized |

---

## 15. Posts — `POST /posts/:id/comments`

**Header:** `Authorization: Bearer <accessToken>`

| # | Test Case | Param / Body | Expected Status | Expected Behavior |
|---|-----------|--------------|-----------------|-------------------|
| 15.1 | Add comment to existing post | Valid post ID / `{"body":"Great post!"}` | 201 | Returns comment with `postId`, `authorId` |
| 15.2 | Body too short (<2) | `{"body":"X"}` | 400 | Validation error |
| 15.3 | Body too long (>1000) | `{"body":"<1001 chars>"}` | 400 | Validation error |
| 15.4 | Missing body | `{}` | 400 | Validation error |
| 15.5 | Non-existent post | Random UUID / `{"body":"Comment"}` | 404 | "Post with id \"...\" not found" |
| 15.6 | No auth header | — | 401 | Unauthorized |

---

## Cross-Cutting Test Cases

### Error Response Format

| # | Test Case | Expected Behavior |
|---|-----------|-------------------|
| C.1 | All errors return uniform JSON | `{ statusCode, timestamp, path, method, message }` |
| C.2 | 404 includes path and method | Verify `path` and `method` fields are correct |
| C.3 | Validation errors return 400 | All DTO validation failures respond with 400 |

### Authentication

| # | Test Case | Expected Behavior |
|---|-----------|-------------------|
| C.4 | Expired access token on any protected route | 401 Unauthorized |
| C.5 | Malformed Bearer token | 401 Unauthorized |
| C.6 | Missing `Authorization` header on protected route | 401 Unauthorized |
| C.7 | `Bearer` prefix missing (raw token only) | 401 Unauthorized |

### Token Lifecycle

| # | Test Case | Expected Behavior |
|---|-----------|-------------------|
| C.8 | Register → access protected route | Token from register works immediately |
| C.9 | Login → refresh → use new access token | Full token rotation cycle works |
| C.10 | Login → logout → refresh fails | Refresh token is invalidated |
| C.11 | Login → refresh → old refresh token fails | Token rotation invalidates previous refresh token |
