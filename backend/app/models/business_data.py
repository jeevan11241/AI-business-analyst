from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from app.core.database import Base
import datetime

class BusinessData(Base):
    __tablename__ = "business_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    business_name = Column(String(255))
    date = Column(Date)
    total_sales = Column(Float)
    total_expenses = Column(Float)
    inventory_cost = Column(Float)
    salary_cost = Column(Float)
    customer_count = Column(Integer)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
