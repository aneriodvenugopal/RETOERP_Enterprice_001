from fastapi import APIRouter, HTTPException, Request
from models.layout import ProjectLayout, LayoutCreate, LayoutUpdate, PlotStatusUpdate
from datetime import datetime, timezone
import uuid
from middleware.auth import get_current_user

router = APIRouter(prefix="/layouts", tags=["layouts"])

def get_db(request: Request):
    return request.app.state.db

@router.post("/projects/{project_id}/layout")
async def create_project_layout(
    project_id: str,
    layout_data: LayoutCreate,
    request: Request
):
    """Create or update layout for a project"""
    user = await get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if project exists and user has access
    project = await db.projects.find_one({
        'id': project_id,
        'tenant_id': user['tenant_id'],
        'deleted_at': None
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if layout already exists
    existing_layout = await db.project_layouts.find_one({
        'project_id': project_id,
        'deleted_at': None
    })
    
    if existing_layout:
        # Update existing layout
        update_data = {
            'layout_name': layout_data.layout_name,
            'svg_content': layout_data.svg_content,
            'svg_url': layout_data.svg_url,
            'plots': [plot.dict() for plot in layout_data.plots] if layout_data.plots else [],
            'metadata': layout_data.metadata,
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        await db.project_layouts.update_one(
            {'id': existing_layout['id']},
            {'$set': update_data}
        )
        
        return {"success": True, "message": "Layout updated successfully", "layout_id": existing_layout['id']}
    else:
        # Create new layout
        layout_id = str(uuid.uuid4())
        layout_doc = {
            'id': layout_id,
            'project_id': project_id,
            'tenant_id': user['tenant_id'],
            'layout_name': layout_data.layout_name,
            'svg_content': layout_data.svg_content,
            'svg_url': layout_data.svg_url,
            'plots': [plot.dict() for plot in layout_data.plots] if layout_data.plots else [],
            'metadata': layout_data.metadata,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'deleted_at': None
        }
        
        await db.project_layouts.insert_one(layout_doc)
        
        return {"success": True, "message": "Layout created successfully", "layout_id": layout_id}

@router.get("/projects/{project_id}/layout")
async def get_project_layout(project_id: str, request: Request):
    """Get layout for a project (authenticated)"""
    user = await get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    layout = await db.project_layouts.find_one({
        'project_id': project_id,
        'tenant_id': user['tenant_id'],
        'deleted_at': None
    }, {'_id': 0})
    
    # Get project details
    project = await db.projects.find_one(
        {'id': project_id, 'deleted_at': None},
        {'_id': 0}
    )
    
    # Return success response with layout (can be None if not found)
    return {
        'success': True,
        'layout': layout,
        'project': project
    }

@router.get("/public/projects/{project_id}/layout")
async def get_public_project_layout(project_id: str, request: Request):
    """Get layout for a project (public access - no auth required)"""
    db = get_db(request)
    
    # Get layout
    layout = await db.project_layouts.find_one({
        'project_id': project_id,
        'deleted_at': None
    }, {'_id': 0})
    
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    
    # Get project details (basic info only)
    project = await db.projects.find_one(
        {'id': project_id, 'deleted_at': None},
        {'_id': 0, 'id': 1, 'name': 1, 'location': 1, 'description': 1, 'total_units': 1}
    )
    
    # Remove sensitive tenant information
    if 'tenant_id' in layout:
        del layout['tenant_id']
    
    return {
        'layout': layout,
        'project': project
    }

@router.patch("/projects/{project_id}/layout/plots/{plot_id}")
async def update_plot_status(
    project_id: str,
    plot_id: str,
    status_update: PlotStatusUpdate,
    request: Request
):
    """Update status of a specific plot"""
    user = await get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get layout
    layout = await db.project_layouts.find_one({
        'project_id': project_id,
        'tenant_id': user['tenant_id'],
        'deleted_at': None
    })
    
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    
    # Find and update the plot
    plots = layout['plots']
    plot_found = False
    
    for plot in plots:
        if plot['id'] == plot_id:
            plot['status'] = status_update.status
            if status_update.property_id:
                plot['property_id'] = status_update.property_id
            if status_update.customer_name:
                plot['customer_name'] = status_update.customer_name
            if status_update.booking_date:
                plot['booking_date'] = status_update.booking_date
            plot_found = True
            break
    
    if not plot_found:
        raise HTTPException(status_code=404, detail="Plot not found")
    
    # Update layout
    await db.project_layouts.update_one(
        {'id': layout['id']},
        {
            '$set': {
                'plots': plots,
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Plot status updated successfully"}

@router.put("/{layout_id}/plots/coordinates")
async def update_plot_coordinates(
    layout_id: str,
    plots_data: dict,
    request: Request
):
    """Update coordinates/boundaries for multiple plots"""
    db = get_db(request)
    
    try:
        # Get layout
        layout = await db.master_layouts.find_one({
            'id': layout_id,
            'deleted_at': None
        })
        
        if not layout:
            raise HTTPException(status_code=404, detail="Layout not found")
        
        # Get updated plots from request
        updated_plots = plots_data.get('plots', [])
        
        if not updated_plots:
            raise HTTPException(status_code=400, detail="No plots data provided")
        
        # Update layout with new plot coordinates
        await db.master_layouts.update_one(
            {'id': layout_id},
            {
                '$set': {
                    'plots': updated_plots,
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        return {
            "success": True,
            "message": "Plot coordinates updated successfully",
            "plots_updated": len(updated_plots)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update plots: {str(e)}")

@router.delete("/projects/{project_id}/layout")
async def delete_project_layout(project_id: str, request: Request):
    """Soft delete a project layout"""
    user = await get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.project_layouts.update_one(
        {
            'project_id': project_id,
            'tenant_id': user['tenant_id'],
            'deleted_at': None
        },
        {
            '$set': {
                'deleted_at': datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Layout not found")
    
    return {"message": "Layout deleted successfully"}

@router.get("/projects/{project_id}/layout/summary")
async def get_layout_summary(project_id: str, request: Request):
    """Get summary statistics for a project layout"""
    user = await get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    layout = await db.project_layouts.find_one({
        'project_id': project_id,
        'tenant_id': user['tenant_id'],
        'deleted_at': None
    })
    
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    
    plots = layout['plots']
    total_plots = len(plots)
    
    status_counts = {
        'available': 0,
        'booked': 0,
        'blocked': 0,
        'sold': 0
    }
    
    total_value = 0
    total_area = 0
    
    for plot in plots:
        status = plot.get('status', 'available')
        if status in status_counts:
            status_counts[status] += 1
        total_value += plot.get('price', 0)
        total_area += plot.get('area', 0)
    
    return {
        'total_plots': total_plots,
        'status_counts': status_counts,
        'total_value': total_value,
        'total_area': total_area,
        'average_price': total_value / total_plots if total_plots > 0 else 0,
        'average_area': total_area / total_plots if total_plots > 0 else 0
    }

@router.post("/projects/{project_id}/layout/quick-create")
async def quick_create_layout(
    project_id: str,
    layout_data: LayoutCreate,
    request: Request
):
    """Quick create layout from SVG upload and manual plot marking"""
    user = await get_current_user(request)
    db = get_db(request)
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if project exists
    project = await db.projects.find_one({
        'id': project_id,
        'tenant_id': user['tenant_id'],
        'deleted_at': None
    })
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete existing layout if any
    await db.project_layouts.delete_many({
        'project_id': project_id,
        'tenant_id': user['tenant_id']
    })
    
    # Create new layout
    layout_id = str(uuid.uuid4())
    layout_doc = {
        'id': layout_id,
        'project_id': project_id,
        'tenant_id': user['tenant_id'],
        'layout_name': layout_data.layout_name,
        'svg_content': layout_data.svg_content,
        'svg_url': layout_data.svg_url,
        'plots': [plot.dict() for plot in layout_data.plots],
        'metadata': layout_data.metadata,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'updated_at': datetime.now(timezone.utc).isoformat(),
        'deleted_at': None
    }
    
    await db.project_layouts.insert_one(layout_doc)
    
    return {
        "message": "Layout created successfully",
        "layout_id": layout_id,
        "total_plots": len(layout_data.plots)
    }
