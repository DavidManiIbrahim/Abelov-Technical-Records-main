# API Routes - Visual Guide & Verification

**Status:** ✅ All routes correctly configured and mounted

---

## Complete Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ BROWSER / FRONTEND                                              │
│ fetch('/api/v1/auth/me', {                                     │
│   headers: { Authorization: 'Bearer <token>' }                 │
│ })                                                              │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ EXPRESS SERVER (app.ts)                                         │
│ app.use("/api/v1", apiRoutes)                                  │
│                                                                │
│ Receives: GET /api/v1/auth/me                                 │
│ Processes: /auth/me (strips /api/v1)                          │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ CENTRAL ROUTER (routes/index.ts)                               │
│ api.use("/auth", auth)                                         │
│                                                                │
│ Receives: /auth/me                                            │
│ Processes: /me (strips /auth)                                 │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ AUTH ROUTER (routes/auth.routes.ts)                            │
│ router.get("/me", ctrl.me)                                     │
│                                                                │
│ Receives: /me                                                 │
│ Matches: GET /me                                              │
│ Calls: auth.controller.ts → me()                              │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ AUTH CONTROLLER (controllers/auth.controller.ts)                │
│ export const me = async (req, res) => {                        │
│   // Extract token from Authorization header                   │
│   // Verify token                                              │
│   // Fetch user from database                                  │
│   // Return user data                                          │
│ }                                                              │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ RESPONSE                                                        │
│ 200 OK                                                          │
│ {                                                              │
│   "user": {                                                    │
│     "id": "...",                                               │
│     "email": "...",                                            │
│     "roles": [...]                                             │
│   }                                                            │
│ }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Route Tree

```
http://localhost:3000
│
├── /health                        [GET]  No auth
│
└── /api
    │
    └── /v1                        (app.ts: app.use("/api/v1", apiRoutes))
        │
        ├── /auth                  (routes/index.ts: api.use("/auth", auth))
        │   ├── /signup            [POST]  No auth
        │   ├── /login             [POST]  No auth
        │   └── /me                [GET]   Bearer token required
        │
        ├── /requests              (routes/index.ts: api.use("/requests", requests))
        │   ├── /                  [GET]   Bearer token required
        │   ├── /                  [POST]  Bearer token required
        │   ├── /:id               [GET]   Bearer token required
        │   ├── /:id               [PUT]   Bearer token required
        │   ├── /:id               [PATCH] Bearer token required
        │   └── /:id               [DELETE] Bearer token required
        │
        └── /admin                 (routes/index.ts: api.use("/admin", admin))
            └── /init              [POST]  No auth
```

---

## Concrete URL Examples

```
✅ POST   http://localhost:3000/api/v1/auth/signup
✅ POST   http://localhost:3000/api/v1/auth/login
✅ GET    http://localhost:3000/api/v1/auth/me
✅ GET    http://localhost:3000/api/v1/requests
✅ POST   http://localhost:3000/api/v1/requests
✅ GET    http://localhost:3000/api/v1/requests/123
✅ PUT    http://localhost:3000/api/v1/requests/123
✅ PATCH  http://localhost:3000/api/v1/requests/123
✅ DELETE http://localhost:3000/api/v1/requests/123
✅ POST   http://localhost:3000/api/v1/admin/init
```

---

## File Dependencies

```
server/src/server.ts
    ↓
imports: createApp from "./app"
    ↓
server/src/app.ts
    ↓
imports: apiRoutes from "./routes"
    ↓
server/src/routes/index.ts
    ↓
imports:
  ├── auth from "./auth.routes"
  ├── requests from "./requests.routes"
  └── admin from "./admin.routes"
    ↓
server/src/routes/auth.routes.ts
    └── imports: controllers/auth.controller.ts
server/src/routes/requests.routes.ts
    └── imports: controllers/requests.controller.ts
server/src/routes/admin.routes.ts
    └── imports: controllers/admin.controller.ts
```

---

## Verification Checklist

### File Existence
- [x] `server/src/routes/index.ts` exists
- [x] `server/src/routes/auth.routes.ts` exists
- [x] `server/src/routes/requests.routes.ts` exists
- [x] `server/src/routes/admin.routes.ts` exists
- [x] `server/src/app.ts` exists
- [x] `server/src/server.ts` exists

### Route Mounting (routes/index.ts)
- [x] `api.use("/auth", auth)` ✅
- [x] `api.use("/requests", requests)` ✅
- [x] `api.use("/admin", admin)` ✅
- [x] `export default api` ✅

### Base Path (app.ts)
- [x] `import apiRoutes from "./routes"` ✅
- [x] `app.use("/api/v1", apiRoutes)` ✅

### Auth Routes (auth.routes.ts)
- [x] `router.post("/signup", ctrl.signup)` ✅
- [x] `router.post("/login", ctrl.login)` ✅
- [x] `router.get("/me", ctrl.me)` ✅
- [x] `export default router` ✅

### Request Routes (requests.routes.ts)
- [x] Routes for GET /, POST /, GET /:id, PUT /:id, PATCH /:id, DELETE /:id ✅
- [x] `export default router` ✅

### Admin Routes (admin.routes.ts)
- [x] `router.post("/init", ctrl.initAdmin)` ✅
- [x] `export default router` ✅

---

## How Each Request Is Processed

### Example 1: POST /api/v1/auth/signup

```
User submits signup form
    ↓
Browser POST request to /api/v1/auth/signup
    ↓
Express app.ts receives request
    ↓
app.use("/api/v1", apiRoutes) matches /api/v1
    ↓
Request object gets /auth/signup (with /api/v1 stripped)
    ↓
routes/index.ts api.use("/auth", auth) matches /auth
    ↓
Request object gets /signup (with /auth stripped)
    ↓
routes/auth.routes.ts router.post("/signup", ctrl.signup) matches
    ↓
auth.controller.ts signup() function executed
    ↓
Returns 201 Created response to browser
```

### Example 2: GET /api/v1/auth/me

```
Frontend calls useAuth() which calls authAPI.me()
    ↓
authAPI.me() fetches GET /api/v1/auth/me with Bearer token
    ↓
Express app.ts receives request
    ↓
app.use("/api/v1", apiRoutes) matches /api/v1
    ↓
Request object gets /auth/me (with /api/v1 stripped)
    ↓
routes/index.ts api.use("/auth", auth) matches /auth
    ↓
Request object gets /me (with /auth stripped)
    ↓
routes/auth.routes.ts router.get("/me", ctrl.me) matches
    ↓
auth.controller.ts me() function executed
    ↓
Verifies Bearer token, fetches user, returns user data
    ↓
Returns 200 OK response to frontend
```

### Example 3: POST /api/v1/requests

```
Frontend submits service request (Phase 1 - minimal data)
    ↓
Browser POST request to /api/v1/requests with Bearer token
    ↓
Express app.ts receives request
    ↓
app.use("/api/v1", apiRoutes) matches /api/v1
    ↓
Request object gets /requests (with /api/v1 stripped)
    ↓
routes/index.ts api.use("/requests", requests) matches /requests
    ↓
Request object gets / (with /requests stripped)
    ↓
routes/requests.routes.ts router.post("/", ctrl.create) matches
    ↓
requests.controller.ts create() function executed
    ↓
Validates Phase 1 data, saves to database, returns created request
    ↓
Returns 201 Created response to frontend
```

---

## Testing with cURL

### Test Auth Routes

```bash
# Test signup
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}'

# Test login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@1234"}' \
  | jq -r '.token')

# Test me (with token)
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Test Request Routes

```bash
# Test list requests
curl -X GET http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer $TOKEN"

# Test create request
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"customer_name":"John","user_id":"123"}'
```

### Test Admin Routes

```bash
# Test init admin
curl -X POST http://localhost:3000/api/v1/admin/init \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@1234"}'
```

---

## Common Issues & Solutions

### Issue: 404 on /api/v1/auth/me

**Cause:** Missing Authorization header
```bash
# Wrong
curl http://localhost:3000/api/v1/auth/me
# Returns 401 (not 404)

# Right
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

### Issue: 404 on /api/v1/requests

**Cause:** Server not running or routes not mounted
```bash
# Check server is running
curl http://localhost:3000/health

# Check routes are available
curl http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer <token>"
```

### Issue: 500 Error on Route

**Cause:** Database not connected or controller error
```bash
# Check health endpoint
curl http://localhost:3000/health
# Should show {"status":"ok","db":"connected"}
```

---

## Final Verification

✅ **Route structure is CORRECT**  
✅ **All routes mounted under /api/v1**  
✅ **All routes properly exported/imported**  
✅ **TypeScript compiles without errors**  
✅ **No changes needed**  

Your routes are production-ready.

