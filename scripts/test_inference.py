import sys
import os
# Add src/ to PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from serving.inference import predict

# Sample customer 1: Low risk (High tenure, DSL, Partner, Dependents, low monthly charges)
low_risk_customer = {
    "Gender": "Female",
    "SeniorCitizen": 0,
    "Partner": "Yes",
    "Dependents": "Yes",
    "Tenure": 72,
    "PhoneService": "Yes",
    "MultipleLines": "Yes",
    "InternetService": "DSL",
    "OnlineSecurity": "Yes",
    "OnlineBackup": "Yes",
    "DeviceProtection": "Yes",
    "TechSupport": "Yes",
    "StreamingTV": "No",
    "StreamingMovies": "No",
    "Contract": "Two year",
    "PaperlessBilling": "No",
    "PaymentMethod": "Credit card (automatic)",
    "MonthlyCharges": 64.80,
    "TotalCharges": 4666.00
}

# Sample customer 2: High risk (Low tenure, Month-to-month, Fiber optic, High monthly charges, Electronic check)
high_risk_customer = {
    "Gender": "Male",
    "SeniorCitizen": 1,
    "Partner": "No",
    "Dependents": "No",
    "Tenure": 2,
    "PhoneService": "Yes",
    "MultipleLines": "Yes",
    "InternetService": "Fiber optic",
    "OnlineSecurity": "No",
    "OnlineBackup": "No",
    "DeviceProtection": "No",
    "TechSupport": "No",
    "StreamingTV": "Yes",
    "StreamingMovies": "Yes",
    "Contract": "Month-to-month",
    "PaperlessBilling": "Yes",
    "PaymentMethod": "Electronic check",
    "MonthlyCharges": 95.85,
    "TotalCharges": 191.70
}

def run_test():
    print("=" * 60)
    print("RUNNING INFERENCE PIPELINE TEST")
    print("=" * 60)
    
    for name, customer in [("Low Risk Customer", low_risk_customer), ("High Risk Customer", high_risk_customer)]:
        print(f"\nEvaluating: {name}")
        print("-" * 40)
        try:
            res = predict(customer)
            print(f"Prediction: {res['prediction']}")
            
            # Print top 5 SHAP feature contributions
            shaps = res.get("shap_values", {})
            if shaps:
                print("Top 5 SHAP Values (Feature Contributions):")
                # Sort by absolute contribution descending
                sorted_shaps = sorted(shaps.items(), key=lambda x: abs(x[1]), reverse=True)
                for feature, val in sorted_shaps[:5]:
                    print(f"  - {feature}: {val:+.4f}")
            else:
                print("Warning: No SHAP values returned.")
        except Exception as e:
            print(f"Error predicting for {name}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    run_test()
