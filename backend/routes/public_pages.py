"""
Public Landing Pages - Tenant & Project Detail Pages
These are public pages that can be accessed without authentication
Can be linked with custom domains
"""
from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/public", tags=["public-pages"])

def get_db(request: Request):
    return request.app.state.db


@router.get("/tenant/{tenant_id}")
async def get_tenant_landing_page(tenant_id: str, request: Request):
    """
    Public Tenant Landing Page
    Shows: Company info, projects, statistics
    Can be accessed via custom domain or retoerp.com/public/tenant/{id}
    """
    db = get_db(request)
    
    # Get tenant info
    tenant = await db.tenants.find_one({'id': tenant_id, 'deleted_at': None}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    
    # Get all projects for this tenant
    projects = await db.projects.find(
        {'tenant_id': tenant_id, 'deleted_at': None},
        {"_id": 0}
    ).to_list(length=100)
    
    # Group projects by category
    projects_by_category = {}
    total_properties = 0
    
    for project in projects:
        # Get property count for each project
        property_count = await db.properties.count_documents({
            'project_id': project['id'],
            'deleted_at': None
        })
        project['property_count'] = property_count
        total_properties += property_count
        
        # Get available properties count
        available_count = await db.properties.count_documents({
            'project_id': project['id'],
            'status': 'available',
            'deleted_at': None
        })
        project['available_count'] = available_count
        
        # Group by category
        category = project.get('category', 'Other')
        if category not in projects_by_category:
            projects_by_category[category] = []
        projects_by_category[category].append(project)
    
    # Get tenant statistics
    total_bookings = await db.bookings.count_documents({'tenant_id': tenant_id})
    total_leads = await db.leads.count_documents({'tenant_id': tenant_id})
    
    # Calculate years of experience (from created_at)
    years_in_business = 0
    if tenant.get('created_at'):
        try:
            created_date = datetime.fromisoformat(tenant['created_at'].replace('Z', '+00:00'))
            years_in_business = (datetime.now() - created_date).days // 365
        except:
            years_in_business = 0
    
    return {
        "success": True,
        "tenant": tenant,
        "projects": projects,
        "projects_by_category": projects_by_category,
        "statistics": {
            "total_projects": len(projects),
            "total_properties": total_properties,
            "total_bookings": total_bookings,
            "total_leads": total_leads,
            "years_in_business": max(years_in_business, 1)
        }
    }


@router.get("/project/{project_id}")
async def get_project_landing_page(project_id: str, request: Request):
    """
    Public Project Landing Page
    Shows: Project details, layout, properties, amenities
    Can be accessed via custom domain or retoerp.com/public/project/{id}
    """
    db = get_db(request)
    
    # Get project info
    project = await db.projects.find_one({'id': project_id, 'deleted_at': None}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get tenant info
    tenant = await db.tenants.find_one({'id': project['tenant_id']}, {"_id": 0})
    
    # Get layout info
    layout = await db.layouts.find_one({'project_id': project_id}, {"_id": 0})
    
    # Get all properties with details
    properties = await db.properties.find(
        {'project_id': project_id, 'deleted_at': None},
        {"_id": 0}
    ).to_list(length=1000)
    
    # Group properties by status
    properties_by_status = {
        'available': [],
        'booked': [],
        'reserved': [],
        'sold': []
    }
    
    for prop in properties:
        status = prop.get('status', 'available')
        if status in properties_by_status:
            properties_by_status[status].append(prop)
    
    # Calculate statistics
    stats = {
        'total_properties': len(properties),
        'available': len(properties_by_status['available']),
        'booked': len(properties_by_status['booked']),
        'reserved': len(properties_by_status['reserved']),
        'sold': len(properties_by_status['sold'])
    }
    
    # Get price range
    prices = [p.get('price', 0) for p in properties if p.get('price')]
    min_price = min(prices) if prices else 0
    max_price = max(prices) if prices else 0
    
    return {
        "success": True,
        "project": project,
        "tenant": tenant,
        "layout": layout,
        "properties": properties,
        "properties_by_status": properties_by_status,
        "statistics": stats,
        "price_range": {
            "min": min_price,
            "max": max_price
        }
    }


@router.get("/tenant/by-domain/{domain}")
async def get_tenant_by_domain(domain: str, request: Request):
    """
    Get tenant by custom domain or subdomain
    Used for domain-based routing
    """
    db = get_db(request)
    
    # Try to find by custom domain
    tenant = await db.tenants.find_one({
        '$or': [
            {'custom_domain': domain},
            {'subdomain': domain}
        ],
        'deleted_at': None
    }, {"_id": 0})
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found for this domain")
    
    return {
        "success": True,
        "tenant_id": tenant['id'],
        "tenant": tenant
    }


@router.get("/project/by-domain/{domain}")
async def get_project_by_domain(domain: str, request: Request):
    """
    Get project by custom domain
    Used for domain-based routing
    """
    db = get_db(request)
    
    # Try to find project by custom domain or subdomain
    project = await db.projects.find_one({
        '$or': [
            {'custom_domain': domain},
            {'subdomain': domain}
        ],
        'deleted_at': None
    }, {"_id": 0})
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found for this domain")
    
    return {
        "success": True,
        "project_id": project['id'],
        "project": project
    }


@router.get("/tenants")
async def get_all_tenants(
    request: Request,
    search: Optional[str] = None,
    limit: int = 100,
    skip: int = 0
):
    """
    Get all active tenants for directory/discovery
    Used on marketing pages and tenants directory
    """
    db = get_db(request)
    
    # Build query
    query = {'deleted_at': None, 'status': 'active'}
    
    # Add search filter if provided
    if search:
        query['$or'] = [
            {'company_name': {'$regex': search, '$options': 'i'}},
            {'city': {'$regex': search, '$options': 'i'}},
            {'state': {'$regex': search, '$options': 'i'}}
        ]
    
    # Get tenants
    tenants = await db.tenants.find(
        query,
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(length=limit)
    
    # Enrich with statistics for each tenant
    for tenant in tenants:
        # Get project count
        project_count = await db.projects.count_documents({
            'tenant_id': tenant['id'],
            'deleted_at': None
        })
        tenant['project_count'] = project_count
        
        # Get total properties count
        projects = await db.projects.find(
            {'tenant_id': tenant['id'], 'deleted_at': None},
            {"id": 1}
        ).to_list(length=100)
        
        project_ids = [p['id'] for p in projects]
        property_count = await db.properties.count_documents({
            'project_id': {'$in': project_ids},
            'deleted_at': None
        })
        tenant['property_count'] = property_count
        
        # Get bookings count
        booking_count = await db.bookings.count_documents({'tenant_id': tenant['id']})
        tenant['booking_count'] = booking_count
    
    # Get total count for pagination
    total = await db.tenants.count_documents(query)
    
    return {
        "success": True,
        "tenants": tenants,
        "total": total,
        "limit": limit,
        "skip": skip
    }



@router.get("/layouts")
async def get_all_public_layouts(
    request: Request,
    limit: int = 50,
    skip: int = 0
):
    """
    Get all public layouts for homepage display
    Shows layouts that are marked as templates or public
    """
    db = get_db(request)
    
    # Get layouts that are templates or have is_public=True
    query = {
        'deleted_at': None,
        '$or': [
            {'is_template': True},
            {'is_public': True}
        ]
    }
    
    # Get layouts with basic info
    layouts = await db.layouts.find(
        query,
        {
            "_id": 0,
            "id": 1,
            "layout_name": 1,
            "layout_type": 1,
            "svg_url": 1,
            "thumbnail_url": 1,
            "created_at": 1,
            "tenant_id": 1,
            "plots": 1
        }
    ).sort('created_at', -1).skip(skip).limit(limit).to_list(length=limit)
    
    # Enrich with plot count and tenant info
    for layout in layouts:
        # Count plots
        layout['plot_count'] = len(layout.get('plots', []))
        
        # Get available plots count
        available_count = sum(1 for p in layout.get('plots', []) if p.get('status') == 'available')
        layout['available_plots'] = available_count
        
        # Get tenant name if exists
        if layout.get('tenant_id'):
            tenant = await db.tenants.find_one(
                {'id': layout['tenant_id']},
                {'company_name': 1, '_id': 0}
            )
            if tenant:
                layout['tenant_name'] = tenant.get('company_name')
        
        # Remove plots array to reduce payload size
        layout.pop('plots', None)
    
    # Get total count
    total = await db.layouts.count_documents(query)
    
    return {
        "success": True,
        "layouts": layouts,
        "total": total,
        "limit": limit,
        "skip": skip
    }
