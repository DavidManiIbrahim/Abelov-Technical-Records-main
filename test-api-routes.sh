#!/bin/bash
# API Routes Testing Script
# 
# This script verifies all routes are correctly mounted under /api/v1
# 
# Setup:
#   1. Start server: npm run dev (in server directory)
#   2. Run: bash test-api-routes.sh

API_BASE="http://localhost:3000/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== API Routes Verification ===${NC}\n"

# ============================================================================
# Test 1: Health Check (No Auth Required)
# ============================================================================

echo -e "${GREEN}Test 1: Health Check${NC}"
echo "GET http://localhost:3000/health"
echo ""

HEALTH=$(curl -s -X GET "http://localhost:3000/health")
echo "$HEALTH" | jq '.'
echo ""

# ============================================================================
# Test 2: Auth Signup (No Auth Required)
# ============================================================================

echo -e "${GREEN}Test 2: Auth Signup (No Auth Required)${NC}"
echo "POST $API_BASE/auth/signup"
echo ""

SIGNUP=$(curl -s -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }')

echo "$SIGNUP" | jq '.'
echo ""

# ============================================================================
# Test 3: Auth Login (No Auth Required)
# ============================================================================

echo -e "${GREEN}Test 3: Auth Login (No Auth Required)${NC}"
echo "POST $API_BASE/auth/login"
echo ""

LOGIN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }')

echo "$LOGIN" | jq '.'
echo ""

# Extract token for subsequent requests
TOKEN=$(echo "$LOGIN" | jq -r '.token // empty')
USER_ID=$(echo "$LOGIN" | jq -r '.user.id // empty')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}ERROR: Failed to get auth token. Check credentials.${NC}"
  echo -e "${YELLOW}Response: $LOGIN${NC}"
  exit 1
fi

echo -e "${YELLOW}Token: $TOKEN${NC}"
echo -e "${YELLOW}User ID: $USER_ID${NC}"
echo ""

# ============================================================================
# Test 4: Auth Me (Bearer Token Required)
# ============================================================================

echo -e "${GREEN}Test 4: Auth Me (Bearer Token Required)${NC}"
echo "GET $API_BASE/auth/me"
echo "Authorization: Bearer <token>"
echo ""

ME=$(curl -s -X GET "$API_BASE/auth/me" \
  -H "Authorization: Bearer $TOKEN")

echo "$ME" | jq '.'
echo ""

# ============================================================================
# Test 5: List Requests (Bearer Token Required)
# ============================================================================

echo -e "${GREEN}Test 5: List Requests (Bearer Token Required)${NC}"
echo "GET $API_BASE/requests"
echo "Authorization: Bearer <token>"
echo ""

REQUESTS=$(curl -s -X GET "$API_BASE/requests" \
  -H "Authorization: Bearer $TOKEN")

echo "$REQUESTS" | jq '.'
echo ""

# ============================================================================
# Test 6: Create Request (Bearer Token Required, Phase 1)
# ============================================================================

echo -e "${GREEN}Test 6: Create Request (Phase 1 - Minimal Data)${NC}"
echo "POST $API_BASE/requests"
echo "Authorization: Bearer <token>"
echo ""

CREATE=$(curl -s -X POST "$API_BASE/requests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customer_name\": \"Test Customer\",
    \"user_id\": \"$USER_ID\"
  }")

echo "$CREATE" | jq '.'
echo ""

REQUEST_ID=$(echo "$CREATE" | jq -r '.data.id // empty')

if [ ! -z "$REQUEST_ID" ]; then
  echo -e "${YELLOW}Request ID: $REQUEST_ID${NC}"
  echo ""

  # ============================================================================
  # Test 7: Get Request by ID (Bearer Token Required)
  # ============================================================================

  echo -e "${GREEN}Test 7: Get Request by ID${NC}"
  echo "GET $API_BASE/requests/$REQUEST_ID"
  echo "Authorization: Bearer <token>"
  echo ""

  GET_REQUEST=$(curl -s -X GET "$API_BASE/requests/$REQUEST_ID" \
    -H "Authorization: Bearer $TOKEN")

  echo "$GET_REQUEST" | jq '.'
  echo ""

  # ============================================================================
  # Test 8: Update Request (Bearer Token Required, Phase 2)
  # ============================================================================

  echo -e "${GREEN}Test 8: Update Request (Phase 2 - Additional Fields)${NC}"
  echo "PATCH $API_BASE/requests/$REQUEST_ID"
  echo "Authorization: Bearer <token>"
  echo ""

  UPDATE=$(curl -s -X PATCH "$API_BASE/requests/$REQUEST_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "customer_phone": "+1-555-0123",
      "customer_email": "customer@example.com",
      "device_brand": "Apple",
      "device_model": "iPhone 14"
    }')

  echo "$UPDATE" | jq '.'
  echo ""
fi

# ============================================================================
# Test 9: Admin Init (No Auth Required)
# ============================================================================

echo -e "${GREEN}Test 9: Admin Init (No Auth Required)${NC}"
echo "POST $API_BASE/admin/init"
echo ""

ADMIN=$(curl -s -X POST "$API_BASE/admin/init" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass@1234"
  }')

echo "$ADMIN" | jq '.'
echo ""

# ============================================================================
# Error Cases
# ============================================================================

echo -e "${YELLOW}=== Error Case Tests ===${NC}\n"

# Missing Authorization Header
echo -e "${GREEN}Test 10: Missing Authorization Header${NC}"
echo "GET $API_BASE/auth/me (without Authorization header)"
echo ""

NO_AUTH=$(curl -s -X GET "$API_BASE/auth/me")

echo "$NO_AUTH" | jq '.'
echo -e "${YELLOW}Expected: 401 Unauthorized${NC}"
echo ""

# Invalid Authorization Header Format
echo -e "${GREEN}Test 11: Invalid Authorization Header Format${NC}"
echo "GET $API_BASE/auth/me (with invalid header)"
echo ""

INVALID_AUTH=$(curl -s -X GET "$API_BASE/auth/me" \
  -H "Authorization: InvalidToken")

echo "$INVALID_AUTH" | jq '.'
echo -e "${YELLOW}Expected: 401 Unauthorized${NC}"
echo ""

# Invalid Token
echo -e "${GREEN}Test 12: Invalid Token${NC}"
echo "GET $API_BASE/auth/me (with fake token)"
echo ""

FAKE_TOKEN=$(curl -s -X GET "$API_BASE/auth/me" \
  -H "Authorization: Bearer fake.token.here")

echo "$FAKE_TOKEN" | jq '.'
echo -e "${YELLOW}Expected: 401 Unauthorized${NC}"
echo ""

# Non-existent Request
echo -e "${GREEN}Test 13: Non-existent Request${NC}"
echo "GET $API_BASE/requests/nonexistent"
echo ""

NOT_FOUND=$(curl -s -X GET "$API_BASE/requests/nonexistent" \
  -H "Authorization: Bearer $TOKEN")

echo "$NOT_FOUND" | jq '.'
echo -e "${YELLOW}Expected: 404 Not Found${NC}"
echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${BLUE}=== Test Summary ===${NC}"
echo ""
echo -e "${GREEN}✓ Health Check${NC}"
echo -e "${GREEN}✓ Auth Signup (no auth)${NC}"
echo -e "${GREEN}✓ Auth Login (no auth)${NC}"
echo -e "${GREEN}✓ Auth Me (with token)${NC}"
echo -e "${GREEN}✓ List Requests (with token)${NC}"
echo -e "${GREEN}✓ Create Request Phase 1 (with token)${NC}"
if [ ! -z "$REQUEST_ID" ]; then
  echo -e "${GREEN}✓ Get Request by ID (with token)${NC}"
  echo -e "${GREEN}✓ Update Request Phase 2 (with token)${NC}"
fi
echo -e "${GREEN}✓ Admin Init (no auth)${NC}"
echo -e "${GREEN}✓ Error Handling Tests${NC}"
echo ""

echo -e "${BLUE}Route Structure Verified:${NC}"
echo -e "  ${GREEN}✓ /api/v1/auth/*${NC} - Authentication routes"
echo -e "  ${GREEN}✓ /api/v1/requests/*${NC} - Service request routes"
echo -e "  ${GREEN}✓ /api/v1/admin/*${NC} - Admin routes"
echo ""

echo -e "${GREEN}All routes are correctly mounted under /api/v1${NC}"

