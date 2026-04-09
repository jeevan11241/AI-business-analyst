from sqlalchemy import Column, Integer, String, Boolean, DateTime
from app.core.database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255))
    owner_name = Column(String(255))
    username = Column(String(255), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    mobile_number = Column(String(50))
    password_hash = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
