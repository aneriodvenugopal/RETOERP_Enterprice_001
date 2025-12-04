from fastapi import FastAPI, APIRouter, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timedelta
import uuid

# Import routes
from routes import auth, tenants, currencies, categories, projects, properties, leads, bookings, commissions, analytics, notifications, users, scheduler, customer, layouts, layouts_library, in_app_notifications, referrals, translations, content, advisory, admin_content, share_referral, resale, saas_admin, chatbot, public_pages, marketplace, incomelands, incomelands_auth, google_auth, calendar_integration, workforce, project_dashboard, marketing_dashboard, payment_schemes, customer_payments, staff_hierarchy, commission_management, property_categories, currency_management, usage_tracking, coupons, bank_accounts, vendors, payment_transfer, articles, project_staff, role_assignments, roles, financial

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="RETOERP API", version="1.0.0")

# Store db in app state for access in routes
app.state.db = db

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoint
@api_router.get("/")
async def root():
    return {
        "message": "RETOERP API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(tenants.router)
api_router.include_router(currencies.router)
api_router.include_router(categories.router)
api_router.include_router(projects.router)
api_router.include_router(properties.router)
api_router.include_router(leads.router)
api_router.include_router(bookings.router)
api_router.include_router(commissions.router)
api_router.include_router(analytics.router)
api_router.include_router(notifications.router)
api_router.include_router(in_app_notifications.router)
api_router.include_router(users.router)
api_router.include_router(scheduler.router)
api_router.include_router(customer.router)
api_router.include_router(layouts.router)
api_router.include_router(layouts_library.router)
api_router.include_router(referrals.router)
api_router.include_router(translations.router)
api_router.include_router(content.router)
api_router.include_router(advisory.router)
api_router.include_router(coupons.router)
api_router.include_router(bank_accounts.router)
api_router.include_router(role_assignments.router)
api_router.include_router(roles.router)
api_router.include_router(financial.router)
api_router.include_router(vendors.router)
api_router.include_router(payment_transfer.router)
api_router.include_router(articles.router)
api_router.include_router(project_staff.router)
api_router.include_router(admin_content.router)
api_router.include_router(share_referral.router)
api_router.include_router(resale.router)
api_router.include_router(saas_admin.router)
api_router.include_router(chatbot.router)
api_router.include_router(public_pages.router)
api_router.include_router(marketplace.router)
api_router.include_router(incomelands.router)
api_router.include_router(incomelands_auth.router)
api_router.include_router(google_auth.router)
api_router.include_router(calendar_integration.router)
api_router.include_router(workforce.router)
api_router.include_router(project_dashboard.router)
api_router.include_router(marketing_dashboard.router)
api_router.include_router(payment_schemes.router)
api_router.include_router(customer_payments.router)
api_router.include_router(staff_hierarchy.router)
api_router.include_router(commission_management.router)
api_router.include_router(property_categories.router)
api_router.include_router(currency_management.router)
api_router.include_router(usage_tracking.router)

# PWA Install tracking
@api_router.post("/analytics/pwa-install")
async def track_pwa_install(request: Request, platform: str = "unknown"):
    """Track PWA installations"""
    db = request.app.state.db
    
    install_record = {
        "id": str(uuid.uuid4()),
        "platform": platform,
        "user_agent": request.headers.get("user-agent"),
        "ip_address": request.client.host if request.client else None,
        "installed_at": datetime.utcnow().isoformat()
    }
    
    await db.pwa_installs.insert_one(install_record)
    
    return {"success": True}

# Firebase FCM Token Management
@api_router.post("/notifications/save-fcm-token")
async def save_fcm_token(request: Request):
    """Save Firebase FCM token for user"""
    try:
        from middleware.auth import get_current_user
        
        current_user = await get_current_user(request)
        db = request.app.state.db
        
        body = await request.json()
        user_id = body.get('user_id')
        fcm_token = body.get('fcm_token')
        device_type = body.get('device_type', 'web')
        
        # Update user's FCM token
        await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "fcm_token": fcm_token,
                    "device_type": device_type,
                    "fcm_updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        return {"success": True, "message": "FCM token saved"}
    
    except Exception as e:
        return {"success": False, "error": str(e)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()