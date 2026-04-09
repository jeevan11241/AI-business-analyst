from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.prediction import Prediction
from app.models.business_data import BusinessData

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    records = db.query(BusinessData).filter(BusinessData.user_id == current_user.id).count()
    preds = db.query(Prediction).filter(Prediction.user_id == current_user.id).all()
    
    high_risk = len([p for p in preds if p.risk_level == "High"])
    low_risk = len([p for p in preds if p.risk_level == "Low"])
    
    return {
        "total_records": records,
        "total_predictions": len(preds),
        "high_risk_cases": high_risk,
        "low_risk_cases": low_risk
    }
