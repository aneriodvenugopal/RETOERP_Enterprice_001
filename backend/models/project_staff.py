from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class ProjectStaffBase(BaseModel):
    """Base model for project staff assignment"""
    user_id: str
    project_id: Optional[str] = None  # NULL = tenant-level staff, otherwise project-specific
    role: str  # "manager", "sales", "admin", etc.
    commission_rate: float = 0.0  # Commission percentage
    can_create_staff: bool = False  # Can this staff create sub-staff
    can_view_all_projects: bool = False  # Tenant-level access
    status: str = "active"  # active, inactive, suspended
    
class ProjectStaff(ProjectStaffBase):
    """Project staff with all fields"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    assigned_by: Optional[str] = None  # User ID who assigned this staff
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    deleted_at: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class ProjectStaffCreate(ProjectStaffBase):
    """Create project staff assignment"""
    pass

class ProjectStaffUpdate(BaseModel):
    """Update project staff assignment"""
    role: Optional[str] = None
    commission_rate: Optional[float] = None
    can_create_staff: Optional[bool] = None
    can_view_all_projects: Optional[bool] = None
    status: Optional[str] = None
    project_id: Optional[str] = None  # Allow project transfer

class QuickStaffCreate(BaseModel):
    """Quickly create new staff during project creation"""
    phone: str
    name: str
    email: Optional[str] = None
    role: str = "sales"
    commission_rate: float = 0.0
    password: str = "staff123"  # Default password
