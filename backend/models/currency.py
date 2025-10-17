from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid

class Currency(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str  # INR, USD, SAR, AED, GBP, EUR
    name: str  # Indian Rupee, US Dollar, etc.
    symbol: str  # ₹, $, ﷼, etc.
    exchange_rate: float = 1.0  # Rate relative to USD
    is_active: bool = True
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CurrencyCreate(BaseModel):
    code: str
    name: str
    symbol: str
    exchange_rate: float = 1.0
