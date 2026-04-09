from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.business_data import BusinessDataCreate, BusinessDataResponse
from app.models.business_data import BusinessData
from app.routers.auth import get_current_user
from app.models.user import User
import pandas as pd
import io

router = APIRouter()

@router.post("/business-data", response_model=BusinessDataResponse)
def create_business_data(data: BusinessDataCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_data = BusinessData(**data.model_dump(), user_id=current_user.id)
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    return new_data

# Alias endpoint used by the frontend form
@router.post("/data/enter", response_model=BusinessDataResponse)
def enter_business_data(data: BusinessDataCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_data = BusinessData(**data.model_dump(), user_id=current_user.id)
    db.add(new_data)
    db.commit()
    db.refresh(new_data)
    return new_data

@router.get("/business-data", response_model=list[BusinessDataResponse])
def get_business_data(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(BusinessData).filter(BusinessData.user_id == current_user.id).all()

@router.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be CSV")
    
    contents = await file.read()
    df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
    
    # Process dataframe and save to db...
    records = df.to_dict(orient="records")
    for row in records:
        # Assuming CSV columns match our model exactly
        new_data = BusinessData(
            user_id=current_user.id,
            business_name=row.get('business_name', 'Uploaded File'),
            date=pd.to_datetime(row.get('date', pd.Timestamp.now().date())).date(),
            total_sales=row.get('total_sales', 0),
            total_expenses=row.get('total_expenses', 0),
            inventory_cost=row.get('inventory_cost', 0),
            salary_cost=row.get('salary_cost', 0),
            customer_count=row.get('customer_count', 0),
            notes="Bulk Upload"
        )
        db.add(new_data)
    db.commit()
    return {"message": f"Successfully uploaded and processed {len(records)} records"}
