from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str  # Reference to Tenant
    name: str
    description: Optional[str] = None
    project_type: str  # residential, commercial, agricultural, etc.
    location: str
    address: Optional[str] = None
    city: str
    state: str
    country: str = "India"
    pincode: Optional[str] = None
    
    # Geolocation (for map)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # Project details
    total_area: Optional[float] = None  # in sq ft or acres
    total_units: int = 0  # Total properties in project
    
    # Status
    status: str = "active"  # active, completed, upcoming, on_hold
    start_date: Optional[str] = None  # Match database field name
    expected_completion: Optional[str] = None  # Match database field name
    launch_date: Optional[datetime] = None  # Keep for backward compatibility
    completion_date: Optional[datetime] = None  # Keep for backward compatibility
    
    # Additional fields from database
    rera_number: Optional[str] = None
    
    # Pricing
    price_per_unit: Optional[float] = None  # Base price
    currency_id: str
    
    # Media
    images: list[str] = []  # Image URLs
    brochure_url: Optional[str] = None
    video_url: Optional[str] = None
    
    # Features & Amenities
    amenities: list[str] = []  # Category IDs
    features: list[str] = []
    
    # Stats (computed)
    available_units: int = 0
    sold_units: int = 0
    blocked_units: int = 0
    
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())  # Match database format
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())  # Match database format
    deleted_at: Optional[str] = None  # Match database format

class ProjectCreate(BaseModel):
    tenant_id: str
    name: str
    description: Optional[str] = None
    project_type: str
    location: str
    address: Optional[str] = None
    city: str
    state: str
    country: str = "India"
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_area: Optional[float] = None
    currency_id: str
    price_per_unit: Optional[float] = None
    launch_date: Optional[datetime] = None
    images: list[str] = []
    amenities: list[str] = []
    features: list[str] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None
    price_per_unit: Optional[float] = None
    images: Optional[list[str]] = None
    amenities: Optional[list[str]] = None
    features: Optional[list[str]] = None
