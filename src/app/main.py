from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import pandas as pd
from src.serving.inference import predict  # Core ML inference logic

# Initialize FastAPI application
app = FastAPI(
    title="Telco Customer Churn Prediction API",
    description="ML API for predicting customer churn in telecom industry",
    version="1.0.0"
)

# Enable CORS for cross-origin frontend consumption
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === HEALTH CHECK ENDPOINT ===
@app.get("/")
def root():
    """
    Health check endpoint for monitoring and load balancer health checks.
    """
    return {"status": "ok"}

# === REQUEST DATA SCHEMA ===
# Pydantic model for automatic validation and API documentation
class CustomerData(BaseModel):
    """
    Customer data schema for churn prediction.
    
    This schema defines the exact 18 features required for churn prediction.
    All features match the original dataset structure for consistency.
    """
    # Demographics
    Gender: str                # "Male" or "Female"
    Partner: str               # "Yes" or "No" - has partner
    Dependents: str            # "Yes" or "No" - has dependents
    
    # Phone services
    PhoneService: str          # "Yes" or "No"
    MultipleLines: str         # "Yes", "No", or "No phone service"
    
    # Internet services  
    InternetService: str       # "DSL", "Fiber optic", or "No"
    OnlineSecurity: str        # "Yes", "No", or "No internet service"
    OnlineBackup: str          # "Yes", "No", or "No internet service"
    DeviceProtection: str      # "Yes", "No", or "No internet service"
    TechSupport: str           # "Yes", "No", or "No internet service"
    StreamingTV: str           # "Yes", "No", or "No internet service"
    StreamingMovies: str       # "Yes", "No", or "No internet service"
    
    # Account information
    Contract: str              # "Month-to-month", "One year", "Two year"
    PaperlessBilling: str      # "Yes" or "No"
    PaymentMethod: str         # "Electronic check", "Mailed check", etc.
    
    # Numeric features
    Tenure: int                # Number of months with company
    MonthlyCharges: float      # Monthly charges in dollars
    TotalCharges: float        # Total charges to date

# === MAIN PREDICTION API ENDPOINT ===
@app.post("/predict")
def get_prediction(data: CustomerData):
    """
    Main prediction endpoint for customer churn prediction.
    
    This endpoint:
    1. Receives validated customer data via Pydantic model
    2. Calls the inference pipeline to transform features and predict
    3. Returns churn prediction in JSON format
    
    Expected Response:
    - {"prediction": "Likely to churn", "shap_values": {...}} or {"prediction": "Not likely to churn", "shap_values": {...}}
    - {"error": "error_message"} if prediction fails
    """
    try:
        # Convert Pydantic model to dict and call inference pipeline
        result = predict(data.dict())
        return result
    except Exception as e:
        # Return error details for debugging
        return {"error": str(e)}


# === DASHBOARD DATA AND STATS API ===

def get_dashboard_data() -> pd.DataFrame:
    """
    Helper function to load and clean raw customer churn data.
    """
    base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    csv_path = os.path.join(base_path, "data", "raw", "Telco-Customer-Churn.csv")
    
    if not os.path.exists(csv_path):
        # Fallback to current working directory
        csv_path = "data/raw/Telco-Customer-Churn.csv"
        
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Raw churn dataset not found at {csv_path}")
        
    df = pd.read_csv(csv_path)
    df.columns = df.columns.str.strip()
    
    # Normalize naming for stats
    df = df.rename(columns={"gender": "Gender", "tenure": "Tenure"})
    
    if "TotalCharges" in df.columns:
        df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce").fillna(0)
        
    return df


@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    """
    Computes statistical and plotting data for the customer churn dashboard.
    """
    try:
        df = get_dashboard_data()
        
        # 1. Summary KPIs
        total_customers = len(df)
        churn_counts = df["Churn"].value_counts()
        total_churned = int(churn_counts.get("Yes", 0))
        total_retained = int(churn_counts.get("No", 0))
        churn_rate = round(float((total_churned / total_customers) * 100), 2) if total_customers > 0 else 0.0
        
        total_monthly_charges = round(float(df["MonthlyCharges"].sum()), 2)
        average_monthly_charges = round(float(df["MonthlyCharges"].mean()), 2)
        average_tenure = round(float(df["Tenure"].mean()), 2) if "Tenure" in df.columns else 0.0
        
        # 2. Churn by Contract Type
        churn_by_contract = {}
        for contract_type in df["Contract"].unique():
            sub_df = df[df["Contract"] == contract_type]
            sub_total = len(sub_df)
            sub_churned = int(sub_df["Churn"].eq("Yes").sum())
            sub_retained = sub_total - sub_churned
            sub_rate = round(float((sub_churned / sub_total) * 100), 2) if sub_total > 0 else 0.0
            churn_by_contract[contract_type] = {
                "churned": sub_churned,
                "retained": sub_retained,
                "rate": sub_rate
            }
            
        # 3. Churn by Internet Service
        churn_by_internet = {}
        for internet in df["InternetService"].unique():
            sub_df = df[df["InternetService"] == internet]
            sub_total = len(sub_df)
            sub_churned = int(sub_df["Churn"].eq("Yes").sum())
            sub_retained = sub_total - sub_churned
            sub_rate = round(float((sub_churned / sub_total) * 100), 2) if sub_total > 0 else 0.0
            churn_by_internet[internet] = {
                "churned": sub_churned,
                "retained": sub_retained,
                "rate": sub_rate
            }

        # 4. Churn by Payment Method
        churn_by_payment = {}
        for payment in df["PaymentMethod"].unique():
            sub_df = df[df["PaymentMethod"] == payment]
            sub_total = len(sub_df)
            sub_churned = int(sub_df["Churn"].eq("Yes").sum())
            sub_retained = sub_total - sub_churned
            sub_rate = round(float((sub_churned / sub_total) * 100), 2) if sub_total > 0 else 0.0
            churn_by_payment[payment] = {
                "churned": sub_churned,
                "retained": sub_retained,
                "rate": sub_rate
            }

        # 5. Churn by Tenure Cohort
        cohorts = [
            ("0-12 Months", 0, 12),
            ("13-24 Months", 13, 24),
            ("25-48 Months", 25, 48),
            ("49-72 Months", 49, 120)
        ]
        churn_by_tenure = {}
        for name, low, high in cohorts:
            sub_df = df[(df["Tenure"] >= low) & (df["Tenure"] <= high)]
            sub_total = len(sub_df)
            sub_churned = int(sub_df["Churn"].eq("Yes").sum())
            sub_retained = sub_total - sub_churned
            sub_rate = round(float((sub_churned / sub_total) * 100), 2) if sub_total > 0 else 0.0
            churn_by_tenure[name] = {
                "churned": sub_churned,
                "retained": sub_retained,
                "rate": sub_rate
            }

        # 6. Churn by Tech Support
        churn_by_tech_support = {}
        for support in df["TechSupport"].unique():
            sub_df = df[df["TechSupport"] == support]
            sub_total = len(sub_df)
            sub_churned = int(sub_df["Churn"].eq("Yes").sum())
            sub_retained = sub_total - sub_churned
            sub_rate = round(float((sub_churned / sub_total) * 100), 2) if sub_total > 0 else 0.0
            churn_by_tech_support[support] = {
                "churned": sub_churned,
                "retained": sub_retained,
                "rate": sub_rate
            }

        # 7. Demographics
        demographics = {
            "gender": {},
            "senior_citizen": {},
            "partner": {},
            "dependents": {}
        }
        
        # Gender
        for val in df["Gender"].unique():
            sub_df = df[df["Gender"] == val]
            sub_total = len(sub_df)
            sub_churned = int(sub_df["Churn"].eq("Yes").sum())
            sub_retained = sub_total - sub_churned
            sub_rate = round(float((sub_churned / sub_total) * 100), 2) if sub_total > 0 else 0.0
            demographics["gender"][val] = {
                "churned": sub_churned,
                "retained": sub_retained,
                "rate": sub_rate
            }
            
        # SeniorCitizen
        for val in df["SeniorCitizen"].unique():
            sub_df = df[df["SeniorCitizen"] == val]
            sub_total = len(sub_df)
            sub_churned = int(sub_df["Churn"].eq("Yes").sum())
            sub_retained = sub_total - sub_churned
            sub_rate = round(float((sub_churned / sub_total) * 100), 2) if sub_total > 0 else 0.0
            label = "Yes" if val == 1 else "No"
            demographics["senior_citizen"][label] = {
                "churned": sub_churned,
                "retained": sub_retained,
                "rate": sub_rate
            }
            
        # Partner
        for val in df["Partner"].unique():
            sub_df = df[df["Partner"] == val]
            sub_total = len(sub_df)
            sub_churned = int(sub_df["Churn"].eq("Yes").sum())
            sub_retained = sub_total - sub_churned
            sub_rate = round(float((sub_churned / sub_total) * 100), 2) if sub_total > 0 else 0.0
            demographics["partner"][val] = {
                "churned": sub_churned,
                "retained": sub_retained,
                "rate": sub_rate
            }
            
        # Dependents
        for val in df["Dependents"].unique():
            sub_df = df[df["Dependents"] == val]
            sub_total = len(sub_df)
            sub_churned = int(sub_df["Churn"].eq("Yes").sum())
            sub_retained = sub_total - sub_churned
            sub_rate = round(float((sub_churned / sub_total) * 100), 2) if sub_total > 0 else 0.0
            demographics["dependents"][val] = {
                "churned": sub_churned,
                "retained": sub_retained,
                "rate": sub_rate
            }

        # 8. Monthly Charges Distribution
        churned_df = df[df["Churn"] == "Yes"]
        retained_df = df[df["Churn"] == "No"]
        
        def get_dist_stats(sub_df):
            if len(sub_df) == 0:
                return {"average": 0.0, "min": 0.0, "max": 0.0, "quantiles": [0.0, 0.0, 0.0, 0.0, 0.0]}
            charges = sub_df["MonthlyCharges"]
            q = charges.quantile([0.0, 0.25, 0.50, 0.75, 1.0]).tolist()
            return {
                "average": round(float(charges.mean()), 2),
                "min": round(float(charges.min()), 2),
                "max": round(float(charges.max()), 2),
                "quantiles": [round(float(val), 2) for val in q]
            }
            
        charges_distribution = {
            "churned": get_dist_stats(churned_df),
            "retained": get_dist_stats(retained_df)
        }
        
        return {
            "summary": {
                "total_customers": total_customers,
                "churn_rate": churn_rate,
                "total_churned": total_churned,
                "total_retained": total_retained,
                "total_monthly_charges": total_monthly_charges,
                "average_monthly_charges": average_monthly_charges,
                "average_tenure": average_tenure
            },
            "churn_by_contract": churn_by_contract,
            "churn_by_internet_service": churn_by_internet,
            "churn_by_payment_method": churn_by_payment,
            "churn_by_tenure_cohort": churn_by_tenure,
            "churn_by_tech_support": churn_by_tech_support,
            "demographics": demographics,
            "charges_distribution": charges_distribution
        }
    except Exception as e:
        return {"error": f"Failed to compute dashboard stats: {str(e)}"}
 
