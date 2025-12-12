# Two-Phase Service Request - Quick Reference

## TL;DR

Your backend now accepts **partial data on POST** and **incremental updates on PATCH**.

### Phase 1: Create (Minimal)
```bash
POST /api/v1/requests
{
  "customer_name": "John Doe",
  "user_id": "user-id-here"
}
# Returns: 201 with id, defaults applied
```

### Phase 2: Update (Any Field)
```bash
PATCH /api/v1/requests/{id}
{
  "customer_phone": "+1-555-0123",
  "customer_email": "john@example.com",
  "status": "In-Progress",
  "service_charge": 50
}
# Returns: 200 with updated doc
```

---

## What Changed

| What | Before | After |
|------|--------|-------|
| POST validation | All 27 fields required | Only 2 fields required |
| Defaults | None | Status, dates, costs auto-set |
| PATCH validation | All fields required | All fields optional |
| Error response | 422 for missing fields | 400 with clear message |
| Use case | Impossible to submit quickly | Mobile form submission works |

---

## Schema at a Glance

### Required (Phase 1)
- `customer_name` — User's name
- `user_id` — Current user ID

### Optional (Phase 2, with defaults)
- `status` — default: `"Pending"`
- `request_date` — default: now
- `service_charge` — default: 0
- `parts_cost` — default: 0
- `total_cost` — default: 0
- `deposit_paid` — default: 0
- `balance` — default: 0
- `payment_completed` — default: false

### Optional (Phase 2, no defaults)
- `shop_name`
- `technician_name`
- `customer_phone` *(encrypted)*
- `customer_email` *(encrypted)*
- `customer_address`
- `device_brand`
- `device_model`
- `serial_number`
- `operating_system`
- `accessories_received`
- `problem_description`
- `diagnosis_date`
- `diagnosis_technician`
- `fault_found`
- `parts_used`
- `repair_action`

---

## Status Codes

| Code | Meaning |
|------|---------|
| 201 | Request created (Phase 1) |
| 200 | Request updated (Phase 2) |
| 400 | Missing required field or validation error |
| 404 | Request not found |
| 500 | Server error |

---

## Validation Rules

### Required Fields
- `customer_name` — min 1 character
- `user_id` — min 1 character

### Contact Fields (if provided)
- `customer_phone` — min 5 characters
- `customer_email` — valid email format

### Cost Fields (if provided)
- `service_charge` — >= 0 (no negatives)
- `parts_cost` — >= 0 (no negatives)
- `total_cost` — >= 0 (no negatives)
- `deposit_paid` — >= 0 (no negatives)

### Status (if provided)
- Must be one of: `Pending`, `In-Progress`, `Completed`, `On-Hold`

---

## Examples

### Create Request (Phase 1)
```bash
curl -X POST http://localhost:3000/api/v1/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"customer_name": "John", "user_id": "123"}'
```

### Get Request
```bash
curl -X GET http://localhost:3000/api/v1/requests/{id} \
  -H "Authorization: Bearer <token>"
```

### Update Request (Phase 2)
```bash
curl -X PATCH http://localhost:3000/api/v1/requests/{id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "customer_phone": "+1-555-0123",
    "device_brand": "Apple",
    "status": "In-Progress"
  }'
```

### List Requests
```bash
curl -X GET http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer <token>"
```

### Delete Request
```bash
curl -X DELETE http://localhost:3000/api/v1/requests/{id} \
  -H "Authorization: Bearer <token>"
```

---

## Encryption

These fields are **automatically encrypted** at rest in MongoDB:
- `customer_email` — decrypted in responses
- `customer_phone` — decrypted in responses

No action needed; it's transparent to your API calls.

---

## Timestamps

- `created_at` — Set once, never changes
- `updated_at` — Changes on every PATCH/PUT
- Format: ISO 8601 (e.g., `2025-12-12T10:30:00.123Z`)

---

## Typical Workflow

```
1. User creates request (mobile)
   POST /api/v1/requests { customer_name, user_id }
   → Request saved with status "Pending"

2. Technician scans device (next day)
   PATCH /api/v1/requests/{id} { device_brand, device_model, ... }
   → Request updated

3. Diagnosis complete
   PATCH /api/v1/requests/{id} { fault_found, status: "In-Progress", ... }
   → Request updated

4. Customer pays & repair done
   PATCH /api/v1/requests/{id} { status: "Completed", payment_completed: true, ... }
   → Request finalized
```

---

## Files to Know

- `TWO_PHASE_FORM_GUIDE.md` — Full API documentation
- `test-two-phase.sh` — cURL test examples
- `server/src/types/request.ts` — Zod schemas
- `server/src/models/request.model.ts` — Mongoose model
- `server/src/controllers/requests.controller.ts` — API logic
- `server/tests/two-phase-flow.test.ts` — Test suite

---

## Troubleshooting

### 422 Unprocessable Entity?
This error should **no longer occur**. If it does:
1. Check that `customer_name` and `user_id` are in POST
2. Check that invalid values (e.g., negative costs) are not in PATCH

### 400 Bad Request?
Check the error message. Common cases:
- `"Customer name is required"` — Add `customer_name` to POST
- `"User ID is required"` — Add `user_id` to POST
- `"Invalid email format"` — Use valid email in PATCH
- `"must be >= 0"` — Don't use negative costs

### Encryption not working?
Check `server/src/utils/crypto.ts`. Ensure `ENCRYPTION_KEY` env var is set.

---

## Server Requirements

- **Node.js** 18+
- **MongoDB** 4.4+ (MongoDB Atlas supported)
- **Dependencies:** express, mongoose, zod (already installed)

---

## Environment Variables

```bash
# Required
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Optional (for encryption)
ENCRYPTION_KEY=your-32-char-hex-key-here
```

---

**Status:** ✅ Complete and production-ready

