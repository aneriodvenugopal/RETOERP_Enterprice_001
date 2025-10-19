from fastapi import APIRouter, HTTPException, Request
from models.project import Project, ProjectCreate, ProjectUpdate
from utils.helpers import serialize_doc, deserialize_doc
from services.audit_log_service import AuditLogService
from middleware.auth import get_current_user
from typing import List, Optional
from datetime import datetime, timezone

router = APIRouter(prefix="/projects", tags=["projects"])

def get_db(request: Request):
    return request.app.state.db

@router.post("/", response_model=Project)
async def create_project(project_create: ProjectCreate, request: Request):
    """Create a new project"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Check if tenant exists
    tenant = await db.tenants.find_one({'id': project_create.tenant_id, 'deleted_at': None}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Create project
    project = Project(**project_create.model_dump())
    project_doc = serialize_doc(project.model_dump())
    
    await db.projects.insert_one(project_doc)
    
    # Audit log
    audit_service = AuditLogService(db)
    await audit_service.log(
        auditable_type="Project",
        auditable_id=project.id,
        event="created",
        module="project",
        user_id=user.get('user_id'),
        new_values=project_doc,
        tenant_id=project.tenant_id,
        ip_address=request.client.host
    )
    
    return project

@router.get("/", response_model=List[Project])
async def get_projects(
    request: Request,
    tenant_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get all projects with filters"""
    db = get_db(request)
    user = await get_current_user(request)
    
    query = {'deleted_at': None}
    
    # If not super admin, filter by tenant
    if user.get('role') != 'super_admin':
        query['tenant_id'] = user.get('tenant_id')
    elif tenant_id:
        query['tenant_id'] = tenant_id
    
    if status:
        query['status'] = status
    
    projects = await db.projects.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    
    # Skip deserialization since Pydantic model expects string datetime fields
    # for project in projects:
    #     deserialize_doc(project)
    
    return [Project(**p) for p in projects]

@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str, request: Request):
    """Get project by ID"""
    db = get_db(request)
    
    project_doc = await db.projects.find_one({'id': project_id, 'deleted_at': None}, {"_id": 0})
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_doc = deserialize_doc(project_doc)
    return Project(**project_doc)

@router.get("/{project_id}/stats")
async def get_project_stats(project_id: str, request: Request):
    """Get project statistics"""
    db = get_db(request)
    
    # Check if project exists
    project = await db.projects.find_one({'id': project_id, 'deleted_at': None}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get property counts by status
    pipeline = [
        {'$match': {'project_id': project_id, 'deleted_at': None}},
        {'$lookup': {
            'from': 'master_categories',
            'localField': 'status_id',
            'foreignField': 'id',
            'as': 'status_info'
        }},
        {'$unwind': '$status_info'},
        {'$group': {
            '_id': '$status_info.slug',
            'count': {'$sum': 1},
            'total_value': {'$sum': '$price'}
        }}
    ]
    
    status_stats = await db.properties.aggregate(pipeline).to_list(100)
    
    # Total properties
    total_properties = await db.properties.count_documents({
        'project_id': project_id,
        'deleted_at': None
    })
    
    return {
        'project_id': project_id,
        'total_properties': total_properties,
        'status_breakdown': status_stats,
        'available': next((s['count'] for s in status_stats if s['_id'] == 'available'), 0),
        'blocked': next((s['count'] for s in status_stats if s['_id'] == 'blocked'), 0),
        'booked': next((s['count'] for s in status_stats if s['_id'] == 'booked'), 0),
        'sold': next((s['count'] for s in status_stats if s['_id'] == 'sold'), 0),
    }

@router.put("/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: ProjectUpdate, request: Request):
    """Update project"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Get existing project
    existing = await db.projects.find_one({'id': project_id, 'deleted_at': None}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Update project
    update_data = project_update.model_dump(exclude_none=True)
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.projects.update_one(
        {'id': project_id},
        {'$set': update_data}
    )
    
    # Audit log
    audit_service = AuditLogService(db)
    await audit_service.log(
        auditable_type="Project",
        auditable_id=project_id,
        event="updated",
        module="project",
        user_id=user.get('user_id'),
        old_values=existing,
        new_values=update_data,
        tenant_id=existing.get('tenant_id'),
        project_id=project_id,
        ip_address=request.client.host
    )
    
    # Get updated project
    project_doc = await db.projects.find_one({'id': project_id}, {"_id": 0})
    project_doc = deserialize_doc(project_doc)
    
    return Project(**project_doc)

@router.delete("/{project_id}")
async def delete_project(project_id: str, request: Request):
    """Soft delete project"""
    db = get_db(request)
    user = await get_current_user(request)
    
    # Get existing project
    existing = await db.projects.find_one({'id': project_id, 'deleted_at': None}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Soft delete
    await db.projects.update_one(
        {'id': project_id},
        {'$set': {'deleted_at': datetime.now(timezone.utc).isoformat()}}
    )
    
    # Audit log
    audit_service = AuditLogService(db)
    await audit_service.log(
        auditable_type="Project",
        auditable_id=project_id,
        event="deleted",
        module="project",
        user_id=user.get('user_id'),
        tenant_id=existing.get('tenant_id'),
        project_id=project_id,
        ip_address=request.client.host
    )
    
    return {"message": "Project deleted successfully"}
