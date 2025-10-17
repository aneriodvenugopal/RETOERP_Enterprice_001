"""Create first tenant for RETOERP"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
import sys
import uuid

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from models.tenant import Tenant
from utils.helpers import serialize_doc
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def create_tenant():
    """Create a default tenant organization"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if tenant already exists
    existing = await db.tenants.find_one({'slug': 'default-tenant'}, {"_id": 0})
    if existing:
        print(f"⏭️  Tenant already exists: {existing['name']}")
        print(f"   Tenant ID: {existing['id']}")
        client.close()
        return existing['id']
    
    # Create default tenant
    tenant = Tenant(
        name="Default Organization",
        slug="default-tenant",
        business_name="Default Real Estate Company",
        contact_email="admin@retoerp.com",
        contact_phone="9999999999",
        address="Default Address",
        is_active=True,
        subscription_status="active",
        subscription_start_date=datetime.now(timezone.utc),
        settings={
            "default_currency": "INR",
            "default_language": "en",
            "timezone": "Asia/Kolkata"
        }
    )
    
    tenant_doc = serialize_doc(tenant.model_dump())
    await db.tenants.insert_one(tenant_doc)
    print(f"✅ Created tenant: {tenant.name}")
    print(f"   Tenant ID: {tenant.id}")
    
    client.close()
    return tenant.id

if __name__ == "__main__":
    asyncio.run(create_tenant())
