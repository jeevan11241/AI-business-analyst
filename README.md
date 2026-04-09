# MIND PROFIT - Predictive Analytics Model

Predictive Analytics framework for early identification and prevention of business losses in small-scale industries using machine learning.

## Features
- **FastAPI Backend** with JWT authentication and pyodbc SQL Server integration.
- **Scikit-learn Integration** evaluating Logistic Regression, Random Forest, and Gradient Boosting.
- **Rules Engine** combined with analytics to provide concrete business suggestions.
- **Next.js Frontend** using App router and Vanilla CSS for modern dynamic UI.
- **FastMail Auto-Alerts** triggered correctly for High-Risk assessments.

## Local Setup Instructions

### 1. Backend (FastAPI)
1. Install Python 3.9+
2. Navigate to `./backend/`
3. Create a virtual environment: `python -m venv venv`
4. Activate venv: `venv\Scripts\activate` (Windows)
5. Install packages: `pip install -r requirements.txt`
6. Fill in the `.env` variables (Database URL and FastMail App Password).
7. Start server: `uvicorn app.main:app --reload`
*Swagger Docs available at http://127.0.0.1:8000/docs*

### 2. Frontend (Next.js)
1. Install Node.js (v18+)
2. Navigate to `./frontend/`
3. Run `npm install`
4. Run `npm run dev`
*App available at http://localhost:3000*
