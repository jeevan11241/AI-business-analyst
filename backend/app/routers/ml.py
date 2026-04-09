from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.business_data import BusinessData
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib
import os

router = APIRouter()

MODEL_DIR = "app/ml_models"
os.makedirs(MODEL_DIR, exist_ok=True)

@router.post("/train")
def train_models(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = db.query(BusinessData).filter(BusinessData.user_id == current_user.id).all()
    if len(data) < 50:
        return {"message": "Not enough data to train. Please add more records.", "required": 50, "current": len(data)}
        
    df = pd.DataFrame([{
        "total_sales": d.total_sales,
        "total_expenses": d.total_expenses,
        "inventory_cost": d.inventory_cost,
        "salary_cost": d.salary_cost,
        "customer_count": d.customer_count,
    } for d in data])
    
    # Simple feature engineering for Target "loss_flag"
    df["loss_flag"] = (df["total_expenses"] > df["total_sales"]).astype(int)
    
    X = df.drop("loss_flag", axis=1)
    y = df["loss_flag"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    models = {
        "LogisticRegression": LogisticRegression(),
        "RandomForestClassifier": RandomForestClassifier(),
        "GradientBoostingClassifier": GradientBoostingClassifier()
    }
    
    results = []
    best_model = None
    best_f1 = 0
    best_model_name = ""
    
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else y_pred
        
        f1 = f1_score(y_test, y_pred)
        acc = accuracy_score(y_test, y_pred)
        
        results.append({
            "model_name": name,
            "accuracy": acc,
            "precision": precision_score(y_test, y_pred, zero_division=0),
            "recall": recall_score(y_test, y_pred, zero_division=0),
            "f1_score": f1,
            "roc_auc": roc_auc_score(y_test, y_proba)
        })
        
        if f1 > best_f1:
            best_f1 = f1
            best_model = model
            best_model_name = name
            
    # Save best model
    joblib.dump(best_model, os.path.join(MODEL_DIR, "best_model.pkl"))
    
    return {
        "message": "Training successful",
        "best_model": best_model_name,
        "metrics": results
    }

@router.get("/metrics")
def get_metrics():
    # In a real scenario, fetch this from the database (model_metrics table)
    # For now, return a placeholder indicating where stats are read
    return {"message": "Metrics can be generated via /train"}
