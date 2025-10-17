from fastapi import APIRouter, HTTPException, Request
from models.category import MasterCategory, MasterCategoryCreate
from utils.helpers import serialize_doc, deserialize_doc
from typing import List, Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/categories", tags=["categories"])

def get_db(request: Request):
    return request.app.state.db

@router.get("/", response_model=List[MasterCategory])
async def get_categories(
    request: Request,
    type: Optional[str] = None,
    tenant_id: Optional[str] = None,
    project_id: Optional[str] = None
):
    """Get categories with filters (cascading: system -> tenant -> project)"""
    db = get_db(request)
    
    query = {'deleted_at': None, 'is_active': True}
    
    if type:
        query['type'] = type
    
    # Cascading logic: get system + tenant + project categories
    if project_id:
        query['$or'] = [
            {'project_id': project_id},
            {'tenant_id': tenant_id, 'project_id': None},
            {'is_system': True}
        ]
    elif tenant_id:
        query['$or'] = [
            {'tenant_id': tenant_id, 'project_id': None},
            {'is_system': True}
        ]
    else:
        query['$or'] = [{'is_system': True}]
    
    categories = await db.master_categories.find(query, {"_id": 0}).sort('sort_order', 1).to_list(500)
    
    for cat in categories:
        deserialize_doc(cat)
    
    return [MasterCategory(**c) for c in categories]

@router.post("/", response_model=MasterCategory)
async def create_category(category_create: MasterCategoryCreate, request: Request):
    """Create a new category"""
    db = get_db(request)
    
    # Check if slug already exists at this level
    existing = await db.master_categories.find_one({
        'slug': category_create.slug,
        'type': category_create.type,
        'tenant_id': category_create.tenant_id,
        'project_id': category_create.project_id,
        'deleted_at': None
    }, {"_id": 0})
    
    if existing:
        raise HTTPException(status_code=400, detail="Category with this slug already exists")
    
    category = MasterCategory(**category_create.model_dump())
    category_doc = serialize_doc(category.model_dump())
    
    await db.master_categories.insert_one(category_doc)
    
    return category

@router.put("/{category_id}", response_model=MasterCategory)
async def update_category(category_id: str, category_update: MasterCategoryCreate, request: Request):
    """Update category (cannot update system categories)"""
    db = get_db(request)
    
    # Check if category exists
    existing = await db.master_categories.find_one({'id': category_id, 'deleted_at': None}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if it's a system category
    if existing.get('is_system'):
        raise HTTPException(status_code=403, detail="Cannot modify system categories")
    
    # Update category
    update_data = category_update.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.master_categories.update_one(
        {'id': category_id},
        {'$set': update_data}
    )
    
    # Get updated category
    category_doc = await db.master_categories.find_one({'id': category_id}, {"_id": 0})
    category_doc = deserialize_doc(category_doc)
    
    return MasterCategory(**category_doc)

@router.delete("/{category_id}")
async def delete_category(category_id: str, request: Request):
    """Soft delete category (cannot delete system categories)"""
    db = get_db(request)
    
    # Check if category exists
    existing = await db.master_categories.find_one({'id': category_id, 'deleted_at': None}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if it's a system category
    if existing.get('is_system'):
        raise HTTPException(status_code=403, detail="Cannot delete system categories")
    
    # Soft delete
    await db.master_categories.update_one(
        {'id': category_id},
        {'$set': {'deleted_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Category deleted successfully"}
