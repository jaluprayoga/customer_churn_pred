from fastapi import FastAPI
from pydantic import BaseModel
import os
import sys

# Ensure we can import from src/serving when running "uvicorn src.app.app:app"
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from serving.inference import predict  # our single source of truth for inference

app = FastAPI()

@app.get("/")
def root():
    return {"status": "ok"}

# Request schema (same fields you collect in the UI)
class CustomerData(BaseModel):
    Gender: str
    Partner: str
    Dependents: str
    PhoneService: str
    MultipleLines: str
    InternetService: str
    OnlineSecurity: str
    OnlineBackup: str
    DeviceProtection: str
    TechSupport: str
    StreamingTV: str
    StreamingMovies: str
    Contract: str
    PaperlessBilling: str
    PaymentMethod: str
    Tenure: int
    MonthlyCharges: float
    TotalCharges: float

@app.post("/predict")
def api_predict(data: CustomerData):
    try:
        out = predict(data.dict())
        return out
    except Exception as e:
        return {"error": str(e)}

