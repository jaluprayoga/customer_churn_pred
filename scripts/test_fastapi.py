import requests

url = "http://127.0.0.1:8000/predict"

sample_data = {
    "Gender": "Male",
    "SeniorCitizen": 0,
    "Partner": "Yes",
    "Dependents": "No",
    "Tenure": 5,
    "PhoneService": "Yes",
    "MultipleLines": "No",
    "InternetService": "Fiber optic",
    "OnlineSecurity": "No",
    "OnlineBackup": "Yes",
    "DeviceProtection": "No",
    "TechSupport": "No",
    "StreamingTV": "Yes",
    "StreamingMovies": "Yes",
    "Contract": "Month-to-month",
    "PaperlessBilling": "Yes",
    "PaymentMethod": "Electronic check",
    "MonthlyCharges": 70.35,
    "TotalCharges": 350.75
}

response = requests.post(url, json=sample_data)
print("Status Code:", response.status_code)
resp_json = response.json()
print("Response keys:", list(resp_json.keys()))
print("Prediction:", resp_json.get("prediction"))
if "shap_values" in resp_json:
    print("SHAP values successfully received!")
    print("Number of SHAP values:", len(resp_json["shap_values"]))
    # Print a few example SHAP values
    sample_shap = list(resp_json["shap_values"].items())[:5]
    print("Sample SHAP values:", dict(sample_shap))
else:
    print("❌ Error: SHAP values not found in response!")
