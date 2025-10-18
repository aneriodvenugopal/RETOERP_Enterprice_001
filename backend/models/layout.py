from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class Coordinate(BaseModel):
    x: float
    y: float

class LayoutPlot(BaseModel):
    id: str
    display_name: str
    block: Optional[str] = None
    coordinates: List[Coordinate]
    price: float
    area: float
    status: str  # available, booked, blocked, sold
    amenities: List[str] = []
    property_id: Optional[str] = None  # Link to actual property
    customer_name: Optional[str] = None  # If booked/sold
    booking_date: Optional[str] = None

class ProjectLayout(BaseModel):
    id: str
    project_id: str
    tenant_id: str
    layout_name: str
    svg_content: Optional[str] = None  # Full SVG code
    svg_url: Optional[str] = None  # Or URL to SVG file
    plots: List[LayoutPlot]
    metadata: Dict = {}
    created_at: str
    updated_at: str
    deleted_at: Optional[str] = None

class LayoutCreate(BaseModel):
    layout_name: str
    svg_content: Optional[str] = None
    svg_url: Optional[str] = None
    plots: List[LayoutPlot]
    metadata: Dict = {}

class LayoutUpdate(BaseModel):
    layout_name: Optional[str] = None
    svg_content: Optional[str] = None
    svg_url: Optional[str] = None
    plots: Optional[List[LayoutPlot]] = None
    metadata: Optional[Dict] = None

class PlotStatusUpdate(BaseModel):
    status: str
    property_id: Optional[str] = None
    customer_name: Optional[str] = None
    booking_date: Optional[str] = None
