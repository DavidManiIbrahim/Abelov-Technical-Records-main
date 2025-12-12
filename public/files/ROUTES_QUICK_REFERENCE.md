# API Routes - Quick Reference

**Status:** ✅ All routes correctly configured under /api/v1

---

## All Available Routes

### Authentication (`/api/v1/auth`)
```
POST   /api/v1/auth/signup      Create account
POST   /api/v1/auth/login       Get JWT token
GET    /api/v1/auth/me          Get current user (Bearer token required)
```

### Service Requests (`/api/v1/requests`)
```
GET    /api/v1/requests         List all requests (Bearer token required)
POST   /api/v1/requests         Create request (Bearer token required)
GET    /api/v1/requests/:id     Get request by ID (Bearer token required)
PUT    /api/v1/requests/:id     Update request (Bearer token required)
PATCH  /api/v1/requests/:id     Partial update (Bearer token required)
DELETE /api/v1/requests/:id     Delete request (Bearer token required)
```

### Admin (`/api/v1/admin`)
```
POST   /api/v1/admin/init       Initialize admin account
```

### Health
```
GET    /health                  Server health status (no base path)
```

---

## Quick Test

```bash
# 1. Signup
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# 2. Login (save TOKEN)
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}' \
  | jq -r '.token')

# 3. Test Auth Me
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Create Request
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"customer_name":"John","user_id":"123"}'
```

---

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Not found |
| 409 | Conflict (email already exists) |
| 500 | Server error |

---

## File Structure

```
server/src/
├── app.ts                    # Express setup
├── server.ts                 # Server startup
└── routes/
    ├── index.ts              # Central router (combines all routes)
    ├── auth.routes.ts        # Auth endpoints
    ├── requests.routes.ts    # Request endpoints
    └── admin.routes.ts       # Admin endpoints
```

---

## Key Points

✅ All routes mounted under `/api/v1`  
✅ Central router in `routes/index.ts`  
✅ Base path set in `app.ts`  
✅ No changes needed - everything works  

---

## Issue: 404 on /api/v1/auth/me?

**Must have Bearer token:**
```bash
# ❌ Wrong (no token)
curl http://localhost:3000/api/v1/auth/me

# ✅ Right (with token)
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

---

For detailed guides, see:
- `ROUTES_DOCUMENTATION.md` — Complete API reference
- `ROUTES_CONFIGURATION.md` — Setup verification
- `ROUTES_VISUAL_GUIDE.md` — Request/response flow
- `test-api-routes.sh` — Full test script

