#!/usr/bin/env bash
set -euo pipefail

# Inserts a larger demo dataset through the Spring Boot REST API.
#
# Usage:
#   scripts/admin/insert-demo-data.sh
#
# Optional environment:
#   API_BASE_URL=http://localhost:8082
#   DEMO_PASSWORD=demo
#
# Notes:
#   - This script is intentionally API-based, not SQL-based.
#   - It assumes the current backend routes:
#       POST /api/company
#       POST /api/office
#       POST /api/user
#       POST /api/client
#       POST /api/employee
#       POST /api/shipment
#       PUT  /api/shipment/{id}/transit
#       PUT  /api/shipment/{id}/deliver
#       PUT  /api/shipment/{id}/cancel
#   - Relationship fields are sent as nested id references, for example:
#       "company": { "id": 1 }

API_BASE_URL="${API_BASE_URL:-http://localhost:8082}"
DEMO_PASSWORD="${DEMO_PASSWORD:-demo}"
COMPANY_BASE_PRICE_PER_KG="2.40"
COMPANY_ADDRESS_SURCHARGE="6.50"

API_COMPANY="${API_BASE_URL}/api/company"
API_OFFICE="${API_BASE_URL}/api/office"
API_USER="${API_BASE_URL}/api/user"
API_CLIENT="${API_BASE_URL}/api/client"
API_EMPLOYEE="${API_BASE_URL}/api/employee"
API_SHIPMENT="${API_BASE_URL}/api/shipment"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

json_id() {
  python3 -c 'import json, sys; print(json.load(sys.stdin)["id"])'
}

post_json() {
  local url="$1"
  local payload="$2"
  local response_file
  response_file="$(mktemp)"
  local status
  status="$(curl -sS \
    -o "$response_file" \
    -w "%{http_code}" \
    -X POST "$url" \
    -H "Content-Type: application/json" \
    -d "$payload")"
  if [ "$status" -lt 200 ] || [ "$status" -ge 300 ]; then
    echo "POST ${url} failed with HTTP ${status}" >&2
    echo "Payload:" >&2
    echo "$payload" >&2
    echo "Response:" >&2
    cat "$response_file" >&2
    echo >&2
    rm -f "$response_file"
    exit 1
  fi
  cat "$response_file"
  rm -f "$response_file"
}

put_empty() {
  local url="$1"
  local response_file
  response_file="$(mktemp)"
  local status
  status="$(curl -sS -o "$response_file" -w "%{http_code}" -X PUT "$url")"
  if [ "$status" -lt 200 ] || [ "$status" -ge 300 ]; then
    echo "PUT ${url} failed with HTTP ${status}" >&2
    echo "Response:" >&2
    cat "$response_file" >&2
    echo >&2
    rm -f "$response_file"
    exit 1
  fi
  rm -f "$response_file"
}

create_company() {
  local name="$1"
  local base_price="$2"
  local address_surcharge="$3"

  post_json "$API_COMPANY" "{
    \"name\": \"${name}\",
    \"basePricePerKg\": ${base_price},
    \"addressSurcharge\": ${address_surcharge}
  }" | json_id
}

create_office() {
  local company_id="$1"
  local city="$2"
  local address="$3"
  local phone="$4"

  post_json "$API_OFFICE" "{
    \"company\": { \"id\": ${company_id} },
    \"city\": \"${city}\",
    \"address\": \"${address}\",
    \"phone\": \"${phone}\"
  }" | json_id
}

create_user() {
  local username="$1"
  local email="$2"
  local role="$3"

  post_json "$API_USER" "{
    \"username\": \"${username}\",
    \"passwordHash\": \"${DEMO_PASSWORD}\",
    \"email\": \"${email}\",
    \"role\": \"${role}\"
  }" | json_id
}

create_client() {
  local user_id="$1"
  local phone="$2"

  post_json "$API_CLIENT" "{
    \"user\": { \"id\": ${user_id} },
    \"phone\": \"${phone}\"
  }" | json_id
}

create_employee() {
  local user_id="$1"
  local company_id="$2"
  local office_id="$3"
  local employee_type="$4"

  post_json "$API_EMPLOYEE" "{
    \"user\": { \"id\": ${user_id} },
    \"company\": { \"id\": ${company_id} },
    \"office\": { \"id\": ${office_id} },
    \"employeeType\": \"${employee_type}\"
  }" | json_id
}

create_shipment() {
  local company_id="$1"
  local sender_id="$2"
  local recipient_id="$3"
  local employee_id="$4"
  local delivery_type="$5"
  local destination_office_id="$6"
  local weight="$7"
  local delivery_address="${8:-}"
  local company_json
  company_json="{ \"id\": ${company_id}, \"basePricePerKg\": ${COMPANY_BASE_PRICE_PER_KG}, \"addressSurcharge\": ${COMPANY_ADDRESS_SURCHARGE} }"

  if [ "$delivery_type" = "TO_ADDRESS" ]; then
    post_json "$API_SHIPMENT" "{
      \"company\": ${company_json},
      \"sender\": { \"id\": ${sender_id} },
      \"recipient\": { \"id\": ${recipient_id} },
      \"registeredBy\": { \"id\": ${employee_id} },
      \"deliveryType\": \"TO_ADDRESS\",
      \"deliveryAddress\": \"${delivery_address}\",
      \"weight\": ${weight}
    }" | json_id
  else
    post_json "$API_SHIPMENT" "{
      \"company\": ${company_json},
      \"sender\": { \"id\": ${sender_id} },
      \"recipient\": { \"id\": ${recipient_id} },
      \"registeredBy\": { \"id\": ${employee_id} },
      \"deliveryType\": \"TO_OFFICE\",
      \"destinationOffice\": { \"id\": ${destination_office_id} },
      \"weight\": ${weight}
    }" | json_id
  fi
}

mark_in_transit() {
  local shipment_id="$1"
  put_empty "${API_SHIPMENT}/${shipment_id}/transit"
}

mark_delivered() {
  local shipment_id="$1"
  put_empty "${API_SHIPMENT}/${shipment_id}/deliver"
}

mark_cancelled() {
  local shipment_id="$1"
  put_empty "${API_SHIPMENT}/${shipment_id}/cancel"
}

print_id() {
  printf "  %-30s %s\n" "$1" "$2"
}

require_command curl
require_command python3

echo "Inserting demo data into ${API_BASE_URL}"
echo "All demo users use password: ${DEMO_PASSWORD}"
echo

echo "Creating company..."
COMPANY_ID="$(create_company "Dkont Demo Logistics" "$COMPANY_BASE_PRICE_PER_KG" "$COMPANY_ADDRESS_SURCHARGE")"
print_id "company:Dkont Demo Logistics" "$COMPANY_ID"
echo

echo "Creating offices..."
SOFIA_OFFICE_ID="$(create_office "$COMPANY_ID" "Sofia" "12 Shipka St." "+359 2 700 1000")"
PLOVDIV_OFFICE_ID="$(create_office "$COMPANY_ID" "Plovdiv" "44 Maritsa Blvd." "+359 32 700 200")"
VARNA_OFFICE_ID="$(create_office "$COMPANY_ID" "Varna" "8 Primorski Blvd." "+359 52 700 300")"
BURGAS_OFFICE_ID="$(create_office "$COMPANY_ID" "Burgas" "31 Transportna St." "+359 56 700 400")"
RUSE_OFFICE_ID="$(create_office "$COMPANY_ID" "Ruse" "9 Dunav Sq." "+359 82 700 500")"
print_id "office:Sofia" "$SOFIA_OFFICE_ID"
print_id "office:Plovdiv" "$PLOVDIV_OFFICE_ID"
print_id "office:Varna" "$VARNA_OFFICE_ID"
print_id "office:Burgas" "$BURGAS_OFFICE_ID"
print_id "office:Ruse" "$RUSE_OFFICE_ID"
echo

echo "Creating admin user..."
ADMIN_SEED_ID="$(post_json "$API_USER" "{
  \"username\": \"admin\",
  \"passwordHash\": \"admin\",
  \"email\": \"admin@example.test\",
  \"role\": \"ADMIN\"
}" | json_id)"
print_id "user:admin" "$ADMIN_SEED_ID"
echo

echo "Creating employee users..."
ELENA_USER_ID="$(create_user "elena.office" "elena.office@example.test" "EMPLOYEE")"
GEORGI_USER_ID="$(create_user "georgi.office" "georgi.office@example.test" "EMPLOYEE")"
NIKOLAY_USER_ID="$(create_user "nikolay.courier" "nikolay.courier@example.test" "EMPLOYEE")"
PETAR_USER_ID="$(create_user "petar.courier" "petar.courier@example.test" "EMPLOYEE")"
VIKTOR_USER_ID="$(create_user "viktor.courier" "viktor.courier@example.test" "EMPLOYEE")"
print_id "user:elena.office" "$ELENA_USER_ID"
print_id "user:georgi.office" "$GEORGI_USER_ID"
print_id "user:nikolay.courier" "$NIKOLAY_USER_ID"
print_id "user:petar.courier" "$PETAR_USER_ID"
print_id "user:viktor.courier" "$VIKTOR_USER_ID"
echo

echo "Creating employees..."
ELENA_EMPLOYEE_ID="$(create_employee "$ELENA_USER_ID" "$COMPANY_ID" "$SOFIA_OFFICE_ID" "OFFICE_EMPLOYEE")"
GEORGI_EMPLOYEE_ID="$(create_employee "$GEORGI_USER_ID" "$COMPANY_ID" "$PLOVDIV_OFFICE_ID" "OFFICE_EMPLOYEE")"
NIKOLAY_EMPLOYEE_ID="$(create_employee "$NIKOLAY_USER_ID" "$COMPANY_ID" "$SOFIA_OFFICE_ID" "COURIER")"
PETAR_EMPLOYEE_ID="$(create_employee "$PETAR_USER_ID" "$COMPANY_ID" "$VARNA_OFFICE_ID" "COURIER")"
VIKTOR_EMPLOYEE_ID="$(create_employee "$VIKTOR_USER_ID" "$COMPANY_ID" "$BURGAS_OFFICE_ID" "COURIER")"
print_id "employee:elena.office" "$ELENA_EMPLOYEE_ID"
print_id "employee:georgi.office" "$GEORGI_EMPLOYEE_ID"
print_id "employee:nikolay.courier" "$NIKOLAY_EMPLOYEE_ID"
print_id "employee:petar.courier" "$PETAR_EMPLOYEE_ID"
print_id "employee:viktor.courier" "$VIKTOR_EMPLOYEE_ID"
echo

echo "Creating client users..."
MARIA_USER_ID="$(create_user "maria.client" "maria.client@example.test" "CLIENT")"
IVAN_USER_ID="$(create_user "ivan.client" "ivan.client@example.test" "CLIENT")"
ANNA_USER_ID="$(create_user "anna.client" "anna.client@example.test" "CLIENT")"
STOYAN_USER_ID="$(create_user "stoyan.client" "stoyan.client@example.test" "CLIENT")"
BORIS_USER_ID="$(create_user "boris.client" "boris.client@example.test" "CLIENT")"
KALINA_USER_ID="$(create_user "kalina.client" "kalina.client@example.test" "CLIENT")"
print_id "user:maria.client" "$MARIA_USER_ID"
print_id "user:ivan.client" "$IVAN_USER_ID"
print_id "user:anna.client" "$ANNA_USER_ID"
print_id "user:stoyan.client" "$STOYAN_USER_ID"
print_id "user:boris.client" "$BORIS_USER_ID"
print_id "user:kalina.client" "$KALINA_USER_ID"
echo

echo "Creating clients..."
MARIA_CLIENT_ID="$(create_client "$MARIA_USER_ID" "+359 878 100 201")"
IVAN_CLIENT_ID="$(create_client "$IVAN_USER_ID" "+359 877 100 202")"
ANNA_CLIENT_ID="$(create_client "$ANNA_USER_ID" "+359 879 100 203")"
STOYAN_CLIENT_ID="$(create_client "$STOYAN_USER_ID" "+359 878 100 204")"
BORIS_CLIENT_ID="$(create_client "$BORIS_USER_ID" "+359 877 100 205")"
KALINA_CLIENT_ID="$(create_client "$KALINA_USER_ID" "+359 879 100 206")"
print_id "client:maria" "$MARIA_CLIENT_ID"
print_id "client:ivan" "$IVAN_CLIENT_ID"
print_id "client:anna" "$ANNA_CLIENT_ID"
print_id "client:stoyan" "$STOYAN_CLIENT_ID"
print_id "client:boris" "$BORIS_CLIENT_ID"
print_id "client:kalina" "$KALINA_CLIENT_ID"
echo

echo "Creating shipments..."
S1="$(create_shipment "$COMPANY_ID" "$MARIA_CLIENT_ID" "$IVAN_CLIENT_ID" "$ELENA_EMPLOYEE_ID" "TO_OFFICE" "$PLOVDIV_OFFICE_ID" "2.500")"
S2="$(create_shipment "$COMPANY_ID" "$IVAN_CLIENT_ID" "$ANNA_CLIENT_ID" "$GEORGI_EMPLOYEE_ID" "TO_ADDRESS" "$SOFIA_OFFICE_ID" "1.200" "Sofia, 18 Vitosha Blvd., fl. 3")"
S3="$(create_shipment "$COMPANY_ID" "$ANNA_CLIENT_ID" "$STOYAN_CLIENT_ID" "$ELENA_EMPLOYEE_ID" "TO_OFFICE" "$VARNA_OFFICE_ID" "7.750")"
S4="$(create_shipment "$COMPANY_ID" "$STOYAN_CLIENT_ID" "$BORIS_CLIENT_ID" "$GEORGI_EMPLOYEE_ID" "TO_ADDRESS" "$PLOVDIV_OFFICE_ID" "4.000" "Plovdiv, 5 Kapana St.")"
S5="$(create_shipment "$COMPANY_ID" "$BORIS_CLIENT_ID" "$KALINA_CLIENT_ID" "$ELENA_EMPLOYEE_ID" "TO_OFFICE" "$BURGAS_OFFICE_ID" "0.850")"
S6="$(create_shipment "$COMPANY_ID" "$KALINA_CLIENT_ID" "$MARIA_CLIENT_ID" "$GEORGI_EMPLOYEE_ID" "TO_OFFICE" "$RUSE_OFFICE_ID" "12.300")"
S7="$(create_shipment "$COMPANY_ID" "$MARIA_CLIENT_ID" "$ANNA_CLIENT_ID" "$ELENA_EMPLOYEE_ID" "TO_ADDRESS" "$SOFIA_OFFICE_ID" "3.400" "Varna, 21 Slivnitsa Blvd.")"
S8="$(create_shipment "$COMPANY_ID" "$IVAN_CLIENT_ID" "$BORIS_CLIENT_ID" "$GEORGI_EMPLOYEE_ID" "TO_OFFICE" "$SOFIA_OFFICE_ID" "5.650")"
S9="$(create_shipment "$COMPANY_ID" "$STOYAN_CLIENT_ID" "$KALINA_CLIENT_ID" "$ELENA_EMPLOYEE_ID" "TO_ADDRESS" "$BURGAS_OFFICE_ID" "2.100" "Burgas, 77 Izgrev Complex")"
S10="$(create_shipment "$COMPANY_ID" "$BORIS_CLIENT_ID" "$IVAN_CLIENT_ID" "$GEORGI_EMPLOYEE_ID" "TO_OFFICE" "$PLOVDIV_OFFICE_ID" "9.900")"
print_id "shipment:maria-to-ivan" "$S1"
print_id "shipment:ivan-to-anna" "$S2"
print_id "shipment:anna-to-stoyan" "$S3"
print_id "shipment:stoyan-to-boris" "$S4"
print_id "shipment:boris-to-kalina" "$S5"
print_id "shipment:kalina-to-maria" "$S6"
print_id "shipment:maria-to-anna" "$S7"
print_id "shipment:ivan-to-boris" "$S8"
print_id "shipment:stoyan-to-kalina" "$S9"
print_id "shipment:boris-to-ivan" "$S10"
echo

echo "Applying varied shipment statuses..."
mark_in_transit "$S1"
mark_in_transit "$S3"
mark_in_transit "$S5"
mark_in_transit "$S6"
mark_delivered "$S2"
mark_delivered "$S7"
mark_cancelled "$S9"
echo "  statuses applied"
echo

cat <<SUMMARY
Demo data insertion completed.

Login examples:
  admin / admin
  demo-admin / ${DEMO_PASSWORD}
  elena.office / ${DEMO_PASSWORD}
  nikolay.courier / ${DEMO_PASSWORD}
  maria.client / ${DEMO_PASSWORD}

Useful checks:
  curl -sS ${API_USER}
  curl -sS ${API_COMPANY}
  curl -sS ${API_OFFICE}
  curl -sS ${API_CLIENT}
  curl -sS ${API_EMPLOYEE}
  curl -sS ${API_SHIPMENT}

If you rerun this script against the same database, unique usernames and company
name constraints may reject duplicates. Use a fresh database or change the demo
names before rerunning.
SUMMARY
