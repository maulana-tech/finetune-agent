#!/bin/bash

# Test Email Sending Script
# Queries database for lead and workspace, then sends test email

set -e

echo "🧪 Testing SumoPod SMTP Email Sending..."
echo ""

# Database connection from .env
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Run this script from project root: bash scripts/test-send-email.sh"
    exit 1
fi

# Extract DATABASE_URL
export $(grep -v '^#' .env | grep DATABASE_URL | xargs)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env"
    exit 1
fi

echo "📊 Step 1: Finding workspace for user firdaussyah03@gmail.com..."

# Query workspace ID
WORKSPACE_ID=$(psql "$DATABASE_URL" -t -c "
    SELECT w.id
    FROM workspaces w
    JOIN users u ON u.workspace_id = w.id
    WHERE u.email = 'firdaussyah03@gmail.com'
    LIMIT 1;
" | xargs)

if [ -z "$WORKSPACE_ID" ]; then
    echo "❌ Error: No workspace found for user firdaussyah03@gmail.com"
    echo ""
    echo "Creating test workspace and user..."

    # Create workspace and user if not exists
    WORKSPACE_ID=$(psql "$DATABASE_URL" -t -c "
        WITH new_workspace AS (
            INSERT INTO workspaces (name, business_context)
            VALUES ('Test Workspace', 'Testing SumoPod email')
            RETURNING id
        )
        INSERT INTO users (workspace_id, email, role)
        SELECT id, 'firdaussyah03@gmail.com', 'owner'
        FROM new_workspace
        RETURNING workspace_id;
    " | xargs)

    echo "✅ Created workspace: $WORKSPACE_ID"
fi

echo "✅ Workspace ID: $WORKSPACE_ID"
echo ""

echo "📊 Step 2: Finding lead with email address..."

# Query lead with email
LEAD_DATA=$(psql "$DATABASE_URL" -t -c "
    SELECT id, name, emails[1]
    FROM leads
    WHERE workspace_id = '$WORKSPACE_ID'
    AND emails IS NOT NULL
    AND jsonb_array_length(emails) > 0
    LIMIT 1;
")

if [ -z "$LEAD_DATA" ]; then
    echo "❌ No leads with email found. Creating test lead..."

    # Create test lead
    LEAD_DATA=$(psql "$DATABASE_URL" -t -c "
        INSERT INTO leads (workspace_id, name, emails, category, address)
        VALUES (
            '$WORKSPACE_ID',
            'Test Business',
            '[\"firdaussyah03@gmail.com\"]'::jsonb,
            'Test Category',
            'Jakarta, Indonesia'
        )
        RETURNING id, name, emails[1];
    ")

    echo "✅ Created test lead"
fi

# Parse lead data
LEAD_ID=$(echo "$LEAD_DATA" | awk '{print $1}' | xargs)
LEAD_NAME=$(echo "$LEAD_DATA" | awk '{print $2}' | xargs)
LEAD_EMAIL=$(echo "$LEAD_DATA" | awk '{print $3}' | xargs)

echo "✅ Lead ID: $LEAD_ID"
echo "✅ Lead Name: $LEAD_NAME"
echo "✅ Lead Email: $LEAD_EMAIL"
echo ""

echo "📧 Step 3: Sending test email via API..."
echo ""

# Test email payload
RESPONSE=$(curl -s -X POST "http://43.129.54.139:3001/leads/$LEAD_ID/send-email?workspaceId=$WORKSPACE_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"toEmail\": \"$LEAD_EMAIL\",
    \"subject\": \"🧪 Test Email dari SumoPod SMTP\",
    \"body\": \"<h1>Hello from SumoPod!</h1><p>This is a test email sent via SumoPod SMTP service.</p><p><strong>Lead:</strong> $LEAD_NAME</p><p><strong>Workspace:</strong> $WORKSPACE_ID</p><hr><p style='color: gray; font-size: 12px;'>Sent from Finetune Agent Email System</p>\"
  }")

echo "API Response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ SUCCESS! Email sent successfully!"
    echo ""
    echo "📬 Check inbox: $LEAD_EMAIL"
    echo "📊 Check email history in UI: https://utune-ai.vercel.app/dashboard"
    echo ""
    echo "🔍 View logs on VPS:"
    echo "   ssh ubuntu@43.129.54.139"
    echo "   pm2 logs api | grep SMTP"
else
    echo "❌ FAILED! Email not sent."
    echo ""
    echo "🔍 Debug steps:"
    echo "1. Check VPS logs:"
    echo "   ssh ubuntu@43.129.54.139"
    echo "   pm2 logs api --lines 50"
    echo ""
    echo "2. Verify .env on VPS has:"
    echo "   SUMOPOD_SMTP_HOST=smtp.sumopod.com"
    echo "   SUMOPOD_SMTP_USER=cmpws3xsadk9emk089pl2wmhg"
    echo "   SUMOPOD_SMTP_PASS=UIXs1TEetQRuAQsIGc3yQiduILZ4qRFE"
    echo ""
    echo "3. Test SMTP connection:"
    echo "   telnet smtp.sumopod.com 465"
fi
