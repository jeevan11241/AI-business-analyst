


from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.core.database import Base
import datetime

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    business_data_id = Column(Integer, ForeignKey("business_data.id"))
    predicted_label = Column(String(50)) # Profit or Loss
    risk_level = Column(String(50)) # Low, Medium, High
    probability_score = Column(Float)
    model_used = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Suggestion(Base):
    __tablename__ = "suggestions"

    id = Column(Integer, primary_key=True, index=True)
    prediction_id = Column(Integer, ForeignKey("predictions.id"))
    suggestion_text = Column(String(500))
    reason_text = Column(String(500))
    priority_level = Column(String(50))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
