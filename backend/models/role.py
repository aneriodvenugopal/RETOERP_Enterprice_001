from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid

class Role(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # SuperAdmin, TenantAdmin, Staff, Customer
    slug: str  # super_admin, tenant_admin, staff, customer
    description: Optional[str] = None
    is_system: bool = True  # System roles cannot be deleted
    permissions: List[str] = []  # List of permission slugs
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RoleCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    permissions: List[str] = []

class Permission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str  # view_projects, create_property, manage_leads, etc.
    module: str  # project, property, lead, payment, etc.
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PermissionCreate(BaseModel):
    name: str
    slug: str
    module: str
    description: Optional[str] = None
