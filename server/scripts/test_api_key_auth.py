import os
import sys
import tempfile
import json
import shutil

# Override keys database path for testing to avoid polluting actual data
test_dir = tempfile.mkdtemp()
test_keys_path = os.path.join(test_dir, "test_api_keys.json")
os.environ["API_KEYS_FILE_PATH"] = test_keys_path
os.environ["ADMIN_API_KEY"] = "test_admin_key"

# Add src folder to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from src.app.main import app
from src.app.auth import load_keys_data, save_keys_data

# Initialize the test client
client = TestClient(app)

def setup_test_keys():
    # Write initial data to test keys file
    data = {
        "admin_key": "test_admin_key",
        "keys": {
            "test_client_key": {
                "owner": "Test Client",
                "is_active": True,
                "created_at": "2026-06-20T00:00:00"
            },
            "disabled_client_key": {
                "owner": "Disabled Client",
                "is_active": False,
                "created_at": "2026-06-20T00:00:00"
            }
        }
    }
    save_keys_data(data)

def cleanup_test_keys():
    try:
        shutil.rmtree(test_dir)
    except Exception:
        pass

def test_public_endpoints():
    print("Testing public endpoints (health check)...")
    # Health check should not require API key
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    print("[SUCCESS] Health check is public.")

def test_unauthorized_access():
    print("Testing protected endpoints without a key...")
    # Churn prediction should fail
    response = client.post("/predict", json={})
    assert response.status_code == 401
    assert "API Key missing" in response.json()["detail"]

    # Dashboard stats should fail
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 401
    assert "API Key missing" in response.json()["detail"]
    print("[SUCCESS] Protected endpoints reject missing keys.")

def test_invalid_key_access():
    print("Testing protected endpoints with invalid keys...")
    headers = {"X-API-Key": "invalid_key_123"}
    response = client.post("/predict", json={}, headers=headers)
    assert response.status_code == 401
    assert "Invalid API Key" in response.json()["detail"]
    
    # Test with Bearer auth format
    headers_bearer = {"Authorization": "Bearer invalid_key_123"}
    response = client.get("/api/dashboard/stats", headers=headers_bearer)
    assert response.status_code == 401
    assert "Invalid API Key" in response.json()["detail"]
    print("[SUCCESS] Protected endpoints reject invalid keys.")

def test_disabled_key_access():
    print("Testing protected endpoints with a disabled key...")
    headers = {"X-API-Key": "disabled_client_key"}
    response = client.post("/predict", json={}, headers=headers)
    assert response.status_code == 401
    assert "API Key has been disabled" in response.json()["detail"]
    print("[SUCCESS] Protected endpoints reject disabled keys.")

def test_valid_key_access():
    print("Testing protected endpoints with a valid client key...")
    sample_data = {
        "Gender": "Male",
        "Partner": "Yes",
        "Dependents": "No",
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
        "Tenure": 5,
        "MonthlyCharges": 70.35,
        "TotalCharges": 350.75
    }
    # Test predict with X-API-Key header
    headers = {"X-API-Key": "test_client_key"}
    response = client.post("/predict", json=sample_data, headers=headers)
    assert response.status_code == 200
    assert "prediction" in response.json()
    
    # Test dashboard/stats with Bearer token
    headers_bearer = {"Authorization": "Bearer test_client_key"}
    response = client.get("/api/dashboard/stats", headers=headers_bearer)
    assert response.status_code == 200
    assert "summary" in response.json()
    print("[SUCCESS] Valid client key successfully accesses protected endpoints.")

def test_admin_permissions():
    print("Testing admin authorization check...")
    # Query admin keys using client key (should fail)
    headers_client = {"X-API-Key": "test_client_key"}
    response = client.get("/api/admin/keys", headers=headers_client)
    assert response.status_code == 403
    assert "Insufficient permissions" in response.json()["detail"]
    
    # Query admin keys using no key (should fail)
    response = client.get("/api/admin/keys")
    assert response.status_code == 401
    print("[SUCCESS] Admin endpoints reject non-admin keys.")

def test_admin_key_lifecycle():
    print("Testing admin API Key CRUD operations...")
    admin_headers = {"X-API-Key": "test_admin_key"}
    
    # 1. List keys
    response = client.get("/api/admin/keys", headers=admin_headers)
    assert response.status_code == 200
    keys = response.json()
    assert "test_client_key" in keys
    assert "disabled_client_key" in keys
    
    # 2. Create a new key
    payload = {"owner": "Temp Admin Client", "key": "temp_client_key", "is_active": True}
    response = client.post("/api/admin/keys", json=payload, headers=admin_headers)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["key"] == "temp_client_key"
    assert res_data["metadata"]["owner"] == "Temp Admin Client"
    
    # Verify the new key works
    new_headers = {"X-API-Key": "temp_client_key"}
    sample_data = {
        "Gender": "Male",
        "Partner": "Yes",
        "Dependents": "No",
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
        "Tenure": 5,
        "MonthlyCharges": 70.35,
        "TotalCharges": 350.75
    }
    response = client.post("/predict", json=sample_data, headers=new_headers)
    assert response.status_code == 200
    
    # 3. Update the key to disabled
    update_payload = {"is_active": False}
    response = client.patch("/api/admin/keys/temp_client_key", json=update_payload, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["metadata"]["is_active"] is False
    
    # Verify it is now rejected
    response = client.post("/predict", json=sample_data, headers=new_headers)
    assert response.status_code == 401
    
    # 4. Delete the key
    response = client.delete("/api/admin/keys/temp_client_key", headers=admin_headers)
    assert response.status_code == 200
    
    # Verify it is still rejected and not found in keys list
    response = client.post("/predict", json=sample_data, headers=new_headers)
    assert response.status_code == 401
    
    response = client.get("/api/admin/keys", headers=admin_headers)
    assert "temp_client_key" not in response.json()
    print("[SUCCESS] Admin API Key CRUD lifecycle functions correctly.")

if __name__ == "__main__":
    import traceback
    try:
        setup_test_keys()
        test_public_endpoints()
        test_unauthorized_access()
        test_invalid_key_access()
        test_disabled_key_access()
        test_valid_key_access()
        test_admin_permissions()
        test_admin_key_lifecycle()
        print("\n=== ALL API KEY AUTH TESTS PASSED ===")
    except AssertionError as err:
        print(f"\n[FAILURE] Assertion failed: {err}")
        traceback.print_exc()
        cleanup_test_keys()
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        traceback.print_exc()
        cleanup_test_keys()
        sys.exit(1)
    finally:
        cleanup_test_keys()
