from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class Property(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str  # Reference to Project
    tenant_id: str  # Reference to Tenant (denormalized for easy querying)
    
    # Property identification
    property_number: str  # Plot 101, Flat A-201, etc.
    property_type_id: str  # Reference to MasterCategory (plot, flat, villa)
    
    # Details
    area: float  # in sq ft or sq yards
    unit: str = "sqft"  # sqft, sqyards, sqm
    facing: Optional[str] = None  # North, South, East, West
    floor: Optional[int] = None  # For flats
    block: Optional[str] = None  # Block A, B, C
    
    # Pricing
    price: float
    currency_id: str
    price_per_sqft: Optional[float] = None
    
    # Status
    status_id: str  # Reference to MasterCategory (available, blocked, booked, sold, resale)
    
    # Blocking (24-hour hold)
    blocked_by: Optional[str] = None  # User ID
    blocked_at: Optional[datetime] = None
    blocked_until: Optional[datetime] = None
    
    # Booking
    booked_by: Optional[str] = None  # Customer ID
    booked_at: Optional[datetime] = None
    
    # Layout position (for visual representation)
    layout_x: Optional[float] = None
    layout_y: Optional[float] = None
    
    # Features
    features: list[str] = []  # Corner plot, park facing, etc.
    
    # Media
    images: list[str] = []
    
    # Dimensions (for plots)
    length: Optional[float] = None
    width: Optional[float] = None
    
    # Resale
    is_resale: bool = False
    resale_requested_at: Optional[datetime] = None
    resale_approved_at: Optional[datetime] = None
    original_owner_id: Optional[str] = None
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    deleted_at: Optional[datetime] = None

class PropertyCreate(BaseModel):
    project_id: str
    tenant_id: str
    property_number: str
    property_type_id: str
    area: float
    unit: str = "sqft"
    facing: Optional[str] = None
    floor: Optional[int] = None
    block: Optional[str] = None
    price: float
    currency_id: str
    status_id: str
    features: list[str] = []
    images: list[str] = []
    length: Optional[float] = None
    width: Optional[float] = None
    layout_x: Optional[float] = None
    layout_y: Optional[float] = None

class PropertyUpdate(BaseModel):
    property_number: Optional[str] = None
    area: Optional[float] = None
    facing: Optional[str] = None
    floor: Optional[int] = None
    price: Optional[float] = None
    status_id: Optional[str] = None
    features: Optional[list[str]] = None
    images: Optional[list[str]] = None

class PropertyBlock(BaseModel):
    property_id: str
    user_id: str
    duration_hours: int = 24

class PropertyBook(BaseModel):
    property_id: str
    customer_id: str
