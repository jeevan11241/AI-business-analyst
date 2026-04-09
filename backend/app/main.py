from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, data, ml, predictions, dashboard, alerts
from app.core.database import Base, engine

# Create the tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MIND PROFIT - Predictive Analytics API",
    description="Identifying Business Loss in Small Scale Industries",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(data.router, tags=["data"])
app.include_router(ml.router, prefix="/ml", tags=["machine learning"])
app.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])

@app.get("/")
def read_root():
    return {"message": "Welcome to MIND PROFIT API"}
