# Test Credentials

## Admin Account
- Email: admin@realapex.in
- Password: admin123
- NOTE: May not exist in current DB

## Tenant Admin
- Email: rajam@retoerp.com
- Password: 12345678
- Role: tenant_admin
- Tenant ID: f18f7bd6-3a1f-472d-acf9-c2fb181787e7

## Auth Endpoint
- POST /api/auth/login
- Body: {"email": "...", "password": "..."}
- Returns: {"access_token": "...", "token_type": "bearer", ...}

## WhatsApp Simulator
- POST /api/whatsapp/simulate?phone=PHONE&message=MESSAGE
- Header: Authorization: Bearer {access_token}
