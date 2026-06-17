import os
import sys

# Add src folder to python path so we can import src.app.main
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from src.app.main import app

client = TestClient(app)

def test_root():
    print("Testing root/health endpoint...")
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    print("[SUCCESS] Root endpoint is healthy.")

def test_dashboard_stats():
    print("Testing /api/dashboard/stats endpoint...")
    response = client.get("/api/dashboard/stats", headers={"Origin": "http://localhost:3000"})
    
    # Verify status code
    assert response.status_code == 200
    
    # Verify CORS Headers
    assert "access-control-allow-origin" in response.headers
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    print("[SUCCESS] CORS headers are configured correctly.")
    
    data = response.json()
    
    # Assert main dictionary keys
    assert "summary" in data, "Missing summary key"
    assert "churn_by_contract" in data, "Missing churn_by_contract key"
    assert "churn_by_internet_service" in data, "Missing churn_by_internet_service key"
    assert "churn_by_payment_method" in data, "Missing churn_by_payment_method key"
    assert "churn_by_tenure_cohort" in data, "Missing churn_by_tenure_cohort key"
    assert "churn_by_tech_support" in data, "Missing churn_by_tech_support key"
    assert "demographics" in data, "Missing demographics key"
    assert "charges_distribution" in data, "Missing charges_distribution key"
    print("[SUCCESS] All required top-level JSON keys are present.")
    
    # Verify summary numbers
    summary = data["summary"]
    assert summary["total_customers"] == 7043, f"Expected 7043 customers, got {summary['total_customers']}"
    assert summary["total_churned"] == 1869, f"Expected 1869 churned, got {summary['total_churned']}"
    assert summary["total_retained"] == 5174, f"Expected 5174 retained, got {summary['total_retained']}"
    assert abs(summary["churn_rate"] - 26.54) < 0.1, f"Expected Churn rate ~26.54%, got {summary['churn_rate']}"
    assert summary["average_monthly_charges"] > 0, "Average monthly charges should be positive"
    assert summary["average_tenure"] > 0, "Average tenure should be positive"
    print("[SUCCESS] Summary KPI computations match expected dataset parameters.")
    
    # Verify nested structures
    assert "Month-to-month" in data["churn_by_contract"]
    assert "Fiber optic" in data["churn_by_internet_service"]
    assert "Electronic check" in data["churn_by_payment_method"]
    assert "0-12 Months" in data["churn_by_tenure_cohort"]
    assert "gender" in data["demographics"]
    assert "senior_citizen" in data["demographics"]
    assert "churned" in data["charges_distribution"]
    assert len(data["charges_distribution"]["churned"]["quantiles"]) == 5
    print("[SUCCESS] Nested chart values are correctly formatted.")

if __name__ == "__main__":
    import traceback
    try:
        test_root()
        test_dashboard_stats()
        print("\n=== ALL TESTS PASSED SUCCESSFULLY ===")
    except AssertionError as err:
        print(f"\n[FAILURE] Assertion failed: {err}")
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        traceback.print_exc()
        sys.exit(1)
