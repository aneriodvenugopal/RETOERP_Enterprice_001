from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timezone
import os
from motor.motor_asyncio import AsyncIOMotorClient

from models.property_category import (
    MasterPropertyCategory, MasterPropertySubcategory,
    TenantPropertyCategory, TenantPropertySubcategory,
    PropertyCategoryCreate, TenantPropertyCategoryCreate
)
from middleware.auth import get_current_user

router = APIRouter()

# Database connection
MONGO_URL = os.getenv('MONGO_URL')
client = AsyncIOMotorClient(MONGO_URL)
db = client.retoerp

# ============= MASTER CATEGORIES (System Level) =============

@router.get("/categories/master", response_model=dict)
async def get_master_categories(
    current_user: dict = Depends(get_current_user)
):
    """Get all master property categories"""
    
    categories = await db.master_property_categories.find({
        "is_active": True
    }).sort("sort_order", 1).to_list(length=None)
    
    return {
        "success": True,
        "count": len(categories),
        "categories": categories
    }

@router.get("/categories/master/{category_id}/subcategories", response_model=dict)
async def get_master_subcategories(
    category_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all subcategories for a master category"""
    
    subcategories = await db.master_property_subcategories.find({
        "master_category_id": category_id,
        "is_active": True
    }).sort("sort_order", 1).to_list(length=None)
    
    return {
        "success": True,
        "category_id": category_id,
        "count": len(subcategories),
        "subcategories": subcategories
    }

@router.get("/categories/master/all-with-subcategories", response_model=dict)
async def get_all_master_categories_with_subcategories(
    current_user: dict = Depends(get_current_user)
):
    """Get all master categories with their subcategories"""
    
    categories = await db.master_property_categories.find({
        "is_active": True
    }).sort("sort_order", 1).to_list(length=None)
    
    result = []
    for category in categories:
        subcategories = await db.master_property_subcategories.find({
            "master_category_id": category["id"],
            "is_active": True
        }).sort("sort_order", 1).to_list(length=None)
        
        category["subcategories"] = subcategories
        category["subcategories_count"] = len(subcategories)
        result.append(category)
    
    return {
        "success": True,
        "count": len(result),
        "categories": result
    }

# ============= TENANT CATEGORIES (Tenant Customization) =============

@router.post("/categories/tenant", response_model=dict)
async def create_tenant_category(
    category: TenantPropertyCategoryCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create tenant-specific property category"""
    
    # Check if already exists
    existing = await db.tenant_property_categories.find_one({
        "tenant_id": category.tenant_id,
        "slug": category.slug,
        "deleted_at": None
    })
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Category with this slug already exists for tenant"
        )
    
    category_dict = category.dict()
    category_dict["id"] = TenantPropertyCategory().id
    category_dict["is_active"] = True
    category_dict["created_at"] = datetime.now(timezone.utc)
    category_dict["updated_at"] = datetime.now(timezone.utc)
    
    await db.tenant_property_categories.insert_one(category_dict)
    
    return {
        "success": True,
        "message": "Tenant category created successfully",
        "category_id": category_dict["id"]
    }

@router.get("/categories/tenant", response_model=dict)
async def get_tenant_categories(
    tenant_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all categories for a tenant"""
    
    categories = await db.tenant_property_categories.find({
        "tenant_id": tenant_id,
        "deleted_at": None,
        "is_active": True
    }).sort("sort_order", 1).to_list(length=None)
    
    return {
        "success": True,
        "tenant_id": tenant_id,
        "count": len(categories),
        "categories": categories
    }

@router.get("/categories/tenant/{category_id}", response_model=dict)
async def get_tenant_category(
    category_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get single tenant category details"""
    
    category = await db.tenant_property_categories.find_one({
        "id": category_id,
        "deleted_at": None
    })
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Get subcategories
    subcategories = await db.tenant_property_subcategories.find({
        "tenant_category_id": category_id,
        "deleted_at": None,
        "is_active": True
    }).sort("sort_order", 1).to_list(length=None)
    
    return {
        "success": True,
        "category": category,
        "subcategories_count": len(subcategories),
        "subcategories": subcategories
    }

@router.put("/categories/tenant/{category_id}", response_model=dict)
async def update_tenant_category(
    category_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update tenant category"""
    
    category = await db.tenant_property_categories.find_one({
        "id": category_id,
        "deleted_at": None
    })
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.tenant_property_categories.update_one(
        {"id": category_id},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "message": "Category updated successfully"
    }

@router.delete("/categories/tenant/{category_id}", response_model=dict)
async def delete_tenant_category(
    category_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete tenant category (soft delete)"""
    
    category = await db.tenant_property_categories.find_one({
        "id": category_id,
        "deleted_at": None
    })
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if used in properties
    property_count = await db.properties.count_documents({
        "property_type_id": category_id,
        "deleted_at": None
    })
    
    if property_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete category. It is used by {property_count} properties"
        )
    
    await db.tenant_property_categories.update_one(
        {"id": category_id},
        {
            "$set": {
                "deleted_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "success": True,
        "message": "Category deleted successfully"
    }

# ============= TENANT SUBCATEGORIES =============

@router.post("/categories/tenant/{category_id}/subcategories", response_model=dict)
async def create_tenant_subcategory(
    category_id: str,
    subcategory_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create tenant subcategory"""
    
    # Validate parent category exists
    category = await db.tenant_property_categories.find_one({
        "id": category_id,
        "deleted_at": None
    })
    
    if not category:
        raise HTTPException(status_code=404, detail="Parent category not found")
    
    subcategory_data["id"] = TenantPropertySubcategory().id
    subcategory_data["tenant_id"] = category["tenant_id"]
    subcategory_data["tenant_category_id"] = category_id
    subcategory_data["is_active"] = True
    subcategory_data["created_at"] = datetime.now(timezone.utc)
    subcategory_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.tenant_property_subcategories.insert_one(subcategory_data)
    
    return {
        "success": True,
        "message": "Subcategory created successfully",
        "subcategory_id": subcategory_data["id"]
    }

@router.get("/categories/tenant/{category_id}/subcategories", response_model=dict)
async def get_tenant_subcategories(
    category_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all subcategories for a tenant category"""
    
    subcategories = await db.tenant_property_subcategories.find({
        "tenant_category_id": category_id,
        "deleted_at": None,
        "is_active": True
    }).sort("sort_order", 1).to_list(length=None)
    
    return {
        "success": True,
        "category_id": category_id,
        "count": len(subcategories),
        "subcategories": subcategories
    }

@router.put("/categories/tenant/subcategories/{subcategory_id}", response_model=dict)
async def update_tenant_subcategory(
    subcategory_id: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update tenant subcategory"""
    
    subcategory = await db.tenant_property_subcategories.find_one({
        "id": subcategory_id,
        "deleted_at": None
    })
    
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.tenant_property_subcategories.update_one(
        {"id": subcategory_id},
        {"$set": update_data}
    )
    
    return {
        "success": True,
        "message": "Subcategory updated successfully"
    }

@router.delete("/categories/tenant/subcategories/{subcategory_id}", response_model=dict)
async def delete_tenant_subcategory(
    subcategory_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete tenant subcategory (soft delete)"""
    
    subcategory = await db.tenant_property_subcategories.find_one({
        "id": subcategory_id,
        "deleted_at": None
    })
    
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    
    # Check if used in properties
    property_count = await db.properties.count_documents({
        "property_subtype_id": subcategory_id,
        "deleted_at": None
    })
    
    if property_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete subcategory. It is used by {property_count} properties"
        )
    
    await db.tenant_property_subcategories.update_one(
        {"id": subcategory_id},
        {
            "$set": {
                "deleted_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {
        "success": True,
        "message": "Subcategory deleted successfully"
    }
