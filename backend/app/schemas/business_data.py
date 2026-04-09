from pydantic import BaseModel
from datetime import date
from typing import Optional
from pydantic import ConfigDict

class BusinessDataCreate(BaseModel):
    business_name: str
    date: date
    total_sales: float
    total_expenses: float
    inventory_cost: float
    salary_cost: float
    customer_count: int
    notes: Optional[str] = None

class BusinessDataResponse(BusinessDataCreate):
    id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)
