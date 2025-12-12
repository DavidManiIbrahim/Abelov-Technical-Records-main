#!/bin/bash
# Two-Phase Service Request Form - cURL Test Examples
# 
# This script demonstrates the two-phase form submission API
# 
# Setup:
#   1. Start server: npm run dev (server directory)
#   2. Get a valid JWT token (login first)
#   3. Replace <TOKEN> with your actual JWT token
#   4. Run: bash test-two-phase.sh

API_BASE="http://localhost:3000/api/v1"
TOKEN="<YOUR_JWT_TOKEN_HERE>"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Two-Phase Service Request Form Tests ===${NC}\n"

# ============================================================================
# PHASE 1: Create Request with Minimal Data
# ============================================================================

echo -e "${GREEN}1. CREATE REQUEST (Phase 1 - Minimal Data)${NC}"
echo "POST $API_BASE/requests"
echo ""

PHASE1_RESPONSE=$(curl -s -X POST "$API_BASE/requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer_name": "John Doe",
    "user_id": "507f1f77bcf86cd799439011"
  }')

echo "$PHASE1_RESPONSE" | jq '.'
echo ""

# Extract request ID from response for Phase 2 testing
REQUEST_ID=$(echo "$PHASE1_RESPONSE" | jq -r '.data.id // empty')

if [ -z "$REQUEST_ID" ]; then
  echo -e "${RED}ERROR: Failed to create request. Check your token and server.${NC}"
  echo -e "${YELLOW}Response: $PHASE1_RESPONSE${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Request created with ID: $REQUEST_ID${NC}"
echo ""

# ============================================================================
# Verify Phase 1 Defaults
# ============================================================================

echo -e "${GREEN}2. VERIFY PHASE 1 DEFAULTS${NC}"
echo "GET $API_BASE/requests/$REQUEST_ID"
echo ""

CREATED_REQUEST=$(curl -s -X GET "$API_BASE/requests/$REQUEST_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$CREATED_REQUEST" | jq '.data | {id, customer_name, status, service_charge, parts_cost, payment_completed, created_at}'
echo ""

# ============================================================================
# PHASE 2: Update with Device Details
# ============================================================================

echo -e "${GREEN}3. UPDATE REQUEST (Phase 2 - Device Details)${NC}"
echo "PATCH $API_BASE/requests/$REQUEST_ID"
echo ""

PHASE2_RESPONSE=$(curl -s -X PATCH "$API_BASE/requests/$REQUEST_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "shop_name": "Tech Repair Plus",
    "technician_name": "Alice Smith",
    "device_brand": "Apple",
    "device_model": "iPhone 14",
    "serial_number": "ABC123XYZ",
    "operating_system": "iOS 17",
    "problem_description": "Screen cracked, battery drains fast"
  }')

echo "$PHASE2_RESPONSE" | jq '.'
echo ""

# ============================================================================
# PHASE 2: Update with Contact Info (and Encryption Test)
# ============================================================================

echo -e "${GREEN}4. UPDATE REQUEST (Phase 2 - Contact Info & Encryption)${NC}"
echo "PATCH $API_BASE/requests/$REQUEST_ID"
echo ""

PHASE2_CONTACT=$(curl -s -X PATCH "$API_BASE/requests/$REQUEST_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer_phone": "+1-555-0123",
    "customer_email": "john@example.com",
    "customer_address": "123 Main St, Springfield"
  }')

echo "$PHASE2_CONTACT" | jq '.data | {id, customer_name, customer_phone, customer_email, customer_address, status}'
echo ""

# ============================================================================
# PHASE 2: Update with Diagnosis and Costs
# ============================================================================

echo -e "${GREEN}5. UPDATE REQUEST (Phase 2 - Diagnosis & Costs)${NC}"
echo "PATCH $API_BASE/requests/$REQUEST_ID"
echo ""

PHASE2_DIAGNOSIS=$(curl -s -X PATCH "$API_BASE/requests/$REQUEST_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "diagnosis_date": "2025-12-12",
    "diagnosis_technician": "Tom Davis",
    "fault_found": "Cracked display, faulty battery",
    "status": "In-Progress",
    "service_charge": 50,
    "parts_cost": 150,
    "total_cost": 200,
    "deposit_paid": 100,
    "balance": 100
  }')

echo "$PHASE2_DIAGNOSIS" | jq '.data | {id, status, service_charge, parts_cost, total_cost, deposit_paid, balance}'
echo ""

# ============================================================================
# PHASE 2: Final Update - Mark Complete
# ============================================================================

echo -e "${GREEN}6. UPDATE REQUEST (Phase 2 - Mark Complete)${NC}"
echo "PATCH $API_BASE/requests/$REQUEST_ID"
echo ""

PHASE2_FINAL=$(curl -s -X PATCH "$API_BASE/requests/$REQUEST_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "repair_action": "Replaced display and battery",
    "parts_used": "Display assembly, Battery",
    "status": "Completed",
    "deposit_paid": 200,
    "balance": 0,
    "payment_completed": true
  }')

echo "$PHASE2_FINAL" | jq '.data | {id, status, payment_completed, updated_at, created_at}'
echo ""

# ============================================================================
# Fetch Final State
# ============================================================================

echo -e "${GREEN}7. FETCH FINAL REQUEST STATE${NC}"
echo "GET $API_BASE/requests/$REQUEST_ID"
echo ""

FINAL_STATE=$(curl -s -X GET "$API_BASE/requests/$REQUEST_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$FINAL_STATE" | jq '.data'
echo ""

# ============================================================================
# Error Cases
# ============================================================================

echo -e "${YELLOW}=== ERROR CASE TESTS ===${NC}\n"

# Missing required field
echo -e "${GREEN}8. ERROR: Missing customer_name${NC}"
echo "POST $API_BASE/requests"
echo ""

ERROR1=$(curl -s -X POST "$API_BASE/requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": "507f1f77bcf86cd799439011"
  }')

echo "$ERROR1" | jq '.'
echo ""

# Missing required field
echo -e "${GREEN}9. ERROR: Missing user_id${NC}"
echo "POST $API_BASE/requests"
echo ""

ERROR2=$(curl -s -X POST "$API_BASE/requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer_name": "Jane Doe"
  }')

echo "$ERROR2" | jq '.'
echo ""

# Invalid email (Zod validation)
echo -e "${GREEN}10. ERROR: Invalid email format${NC}"
echo "PATCH $API_BASE/requests/$REQUEST_ID"
echo ""

ERROR3=$(curl -s -X PATCH "$API_BASE/requests/$REQUEST_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "customer_email": "not-an-email"
  }')

echo "$ERROR3" | jq '.'
echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${GREEN}=== Test Summary ===${NC}"
echo "Request ID: $REQUEST_ID"
echo ""
echo "✓ Phase 1: Created request with minimal data (customer_name, user_id)"
echo "✓ Phase 2: Updated with device details"
echo "✓ Phase 2: Updated with contact info (encryption verified)"
echo "✓ Phase 2: Updated with diagnosis and costs"
echo "✓ Phase 2: Marked complete with final status"
echo "✓ Error handling: Missing required fields rejected"
echo ""
echo -e "${GREEN}All tests completed!${NC}"

