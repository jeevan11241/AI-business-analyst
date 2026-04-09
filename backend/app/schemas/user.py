from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime

class UserCreate(BaseModel):
    company_name: str
    owner_name: str
    username: str
    email: EmailStr
    mobile_number: str
    password: str

class UserResponse(BaseModel):
    id: int
    company_name: str
    owner_name: str
    username: str
    email: str
    mobile_number: str
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
