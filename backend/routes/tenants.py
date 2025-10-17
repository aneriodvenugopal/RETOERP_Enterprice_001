from fastapi import APIRouter, HTTPException, Request
from models.tenant import Tenant, TenantCreate, Package, PackageCreate
from utils.helpers import serialize_doc, deserialize_doc
from middleware.auth import get_current_user
from typing import List

router = APIRouter(prefix="/tenants", tags=["tenants"])

def get_db(request: Request):
    return request.app.state.db

@router.post("/", response_model=Tenant)
async def create_tenant(tenant_create: TenantCreate, request: Request):
    """Create a new tenant"""
    # TODO: Add role check - only SuperAdmin can create tenants
    db = get_db(request)
    
    # Check if tenant with email already exists
    existing = await db.tenants.find_one({'email': tenant_create.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Tenant with this email already exists")
    
    # Create tenant
    tenant = Tenant(**tenant_create.model_dump())
    tenant_doc = serialize_doc(tenant.model_dump())
    
    await db.tenants.insert_one(tenant_doc)
    
    return tenant

@router.get("/", response_model=List[Tenant])
async def get_tenants(request: Request, skip: int = 0, limit: int = 100):
    """Get all tenants"""
    # TODO: Add role check - only SuperAdmin
    db = get_db(request)
    
    tenants = await db.tenants.find(
        {'deleted_at': None},
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    for tenant in tenants:
        deserialize_doc(tenant)
    
    return [Tenant(**t) for t in tenants]

@router.get("/{tenant_id}", response_model=Tenant)
async def get_tenant(tenant_id: str, request: Request):
    """Get tenant by ID"""
    db = get_db(request)
    
    tenant_doc = await db.tenants.find_one({'id': tenant_id, 'deleted_at': None}, {"_id": 0})
    if not tenant_doc:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    tenant_doc = deserialize_doc(tenant_doc)
    return Tenant(**tenant_doc)

@router.put("/{tenant_id}", response_model=Tenant)
async def update_tenant(tenant_id: str, tenant_update: TenantCreate, request: Request):
    """Update tenant"""
    db = get_db(request)
    
    # Check if tenant exists
    existing = await db.tenants.find_one({'id': tenant_id, 'deleted_at': None}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Update tenant
    update_data = tenant_update.model_dump()
    update_data['updated_at'] = serialize_doc({'updated_at': datetime.now(timezone.utc)})['updated_at']
    
    from datetime import datetime, timezone
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.tenants.update_one(
        {'id': tenant_id},
        {'$set': update_data}
    )
    
    # Get updated tenant
    tenant_doc = await db.tenants.find_one({'id': tenant_id}, {"_id": 0})
    tenant_doc = deserialize_doc(tenant_doc)
    
    return Tenant(**tenant_doc)

@router.delete("/{tenant_id}")
async def delete_tenant(tenant_id: str, request: Request):
    """Soft delete tenant"""
    db = get_db(request)
    
    from datetime import datetime, timezone
    await db.tenants.update_one(
        {'id': tenant_id},
        {'$set': {'deleted_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Tenant deleted successfully"}

# Package routes
@router.post("/packages/", response_model=Package)
async def create_package(package_create: PackageCreate, request: Request):
    """Create a new package"""
    db = get_db(request)
    
    package = Package(**package_create.model_dump())
    package_doc = serialize_doc(package.model_dump())
    
    await db.packages.insert_one(package_doc)
    
    return package

@router.get("/packages/", response_model=List[Package])
async def get_packages(request: Request):
    """Get all packages"""
    db = get_db(request)
    
    packages = await db.packages.find({'is_active': True}, {"_id": 0}).to_list(100)
    
    for pkg in packages:
        deserialize_doc(pkg)
    
    return [Package(**p) for p in packages]
