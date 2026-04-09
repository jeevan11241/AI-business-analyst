from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.business_data import BusinessData
from app.models.prediction import Prediction, Suggestion
from app.routers.alerts import send_alert_email
import pandas as pd
import joblib
import os

router = APIRouter()
MODEL_DIR = "app/ml_models"

@router.post("/predict/{business_data_id}")
def make_prediction(business_data_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = db.query(BusinessData).filter(BusinessData.id == business_data_id, BusinessData.user_id == current_user.id).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data not found")
        
    model_path = os.path.join(MODEL_DIR, "best_model.pkl")
    if not os.path.exists(model_path):
        return {"message": "Model not trained yet. Cannot predict. Falling back to rule-based analysis."}
        
    model = joblib.load(model_path)
    
    features = [[data.total_sales, data.total_expenses, data.inventory_cost, data.salary_cost, data.customer_count]]
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1] if hasattr(model, "predict_proba") else float(prediction)
    
    risk_level = "Low"
    if probability > 0.7:
        risk_level = "High"
    elif probability > 0.4:
        risk_level = "Medium"
        
    pred_record = Prediction(
        user_id=current_user.id,
        business_data_id=business_data_id,
        predicted_label="Loss" if prediction == 1 else "Profit",
        risk_level=risk_level,
        probability_score=probability,
        model_used="Best Model"
    )
    db.add(pred_record)
    db.commit()
    db.refresh(pred_record)
    
    # Generate Suggestions
    suggestions = generate_suggestions(data, pred_record.id, db)
    
    # Send email asynchronously if High Risk
    if risk_level == "High":
        background_tasks.add_task(send_alert_email, current_user.email, current_user.username, data.business_name, "Loss", risk_level, suggestions)
        
    return {"prediction": pred_record, "suggestions": suggestions}

def generate_suggestions(data: BusinessData, prediction_id: int, db: Session):
    suggestions = []
    
    if data.inventory_cost > (0.3 * data.total_sales):
        suggestions.append({
            "text": "Reduce inventory purchasing or clear slow-moving stock.",
            "reason": "Inventory cost is too high compared to total sales.",
            "priority": "High"
        })
        
    if data.salary_cost > (0.4 * data.total_sales):
        suggestions.append({
            "text": "Optimize workforce allocation or reduce unnecessary labor cost.",
            "reason": "Salary cost eats a significant margin of sales.",
            "priority": "Medium"
        })
        
    if data.total_expenses > data.total_sales:
        suggestions.append({
            "text": "Control operational expenses and improve revenue strategy.",
            "reason": "Total expenses exceed total sales, indicating current loss.",
            "priority": "High"
        })
        
    saved_suggestions = []
    for s in suggestions:
        sug = Suggestion(
            prediction_id=prediction_id,
            suggestion_text=s["text"],
            reason_text=s["reason"],
            priority_level=s["priority"]
        )
        db.add(sug)
        saved_suggestions.append(sug)
        
    db.commit()
    return saved_suggestions

@router.get("/history")
def get_prediction_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Prediction).filter(Prediction.user_id == current_user.id).all()
