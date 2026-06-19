import os
import json
import secrets
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Simple parser to load .env file if it exists, without introducing extra dependencies
def load_env_file():
    env_path = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        key, val = parts[0].strip(), parts[1].strip()
                        # Strip optional surrounding quotes from value
                        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                            val = val[1:-1]
                        if key and key not in os.environ:
                            os.environ[key] = val
        except Exception as e:
            print(f"[WARNING] Failed to load .env file: {e}")

load_env_file()

KEYS_FILE_PATH = os.environ.get("API_KEYS_FILE_PATH", os.path.join(BASE_DIR, "data", "api_keys.json"))

# Environment variables configuration
ENABLE_API_KEY_AUTH = os.environ.get("ENABLE_API_KEY_AUTH", "true").lower() in ("true", "1", "yes")
ENV_ADMIN_API_KEY = os.environ.get("ADMIN_API_KEY")

# API security schemes
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
security_bearer = HTTPBearer(auto_error=False)

class KeyCreateRequest(BaseModel):
    owner: str
    key: Optional[str] = None
    is_active: Optional[bool] = True

class KeyUpdateRequest(BaseModel):
    owner: Optional[str] = None
    is_active: Optional[bool] = None

# In-memory cached keys data
_cached_data = None

def load_keys_data() -> Dict[str, Any]:
    global _cached_data
    if _cached_data is not None:
        return _cached_data
        
    os.makedirs(os.path.dirname(KEYS_FILE_PATH), exist_ok=True)
    if not os.path.exists(KEYS_FILE_PATH):
        # Initialize default structure
        default_admin = secrets.token_urlsafe(16)
        default_client = "default_client_key_12345"
        data = {
            "admin_key": default_admin,
            "keys": {
                default_client: {
                    "owner": "Default Client",
                    "is_active": True,
                    "created_at": datetime.utcnow().isoformat()
                }
            }
        }
        with open(KEYS_FILE_PATH, "w") as f:
            json.dump(data, f, indent=2)
        print(f"\n==================================================")
        print(f"API KEYS SYSTEM INITIALIZED")
        print(f"Database: {KEYS_FILE_PATH}")
        print(f"Master Admin Key: {default_admin}")
        print(f"Default Client Key: {default_client}")
        print(f"==================================================\n")
        _cached_data = data
        return data

    try:
        with open(KEYS_FILE_PATH, "r") as f:
            data = json.load(f)
            # Ensure proper schema
            if "admin_key" not in data:
                data["admin_key"] = secrets.token_urlsafe(16)
            if "keys" not in data:
                data["keys"] = {}
            _cached_data = data
            return data
    except Exception as e:
        # Fallback if corrupt
        print(f"[WARNING] Failed to read keys file {KEYS_FILE_PATH}: {e}. Creating recovery fallback.")
        default_admin = secrets.token_urlsafe(16)
        data = {"admin_key": default_admin, "keys": {}}
        _cached_data = data
        return data

def save_keys_data(data: Dict[str, Any]):
    global _cached_data
    _cached_data = data
    os.makedirs(os.path.dirname(KEYS_FILE_PATH), exist_ok=True)
    with open(KEYS_FILE_PATH, "w") as f:
        json.dump(data, f, indent=2)

def get_admin_key() -> str:
    if ENV_ADMIN_API_KEY:
        return ENV_ADMIN_API_KEY
    data = load_keys_data()
    return data.get("admin_key", "admin_master_key_change_me")

def extract_api_key(
    x_api_key: Optional[str] = Depends(api_key_header),
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Optional[str]:
    if x_api_key:
        return x_api_key
    if auth and auth.scheme.lower() == "bearer":
        return auth.credentials
    return None

async def verify_api_key(api_key: Optional[str] = Depends(extract_api_key)) -> Dict[str, Any]:
    if not ENABLE_API_KEY_AUTH:
        return {"owner": "auth-disabled", "is_active": True}
        
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key missing. Provide header 'X-API-Key' or 'Authorization: Bearer <key>'"
        )
        
    # Check if it is the admin key (admin has general service access as well)
    admin_key = get_admin_key()
    if api_key == admin_key:
        return {"owner": "Admin Master", "is_active": True, "is_admin": True}
        
    data = load_keys_data()
    keys_map = data.get("keys", {})
    
    if api_key not in keys_map:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
        
    key_info = keys_map[api_key]
    if not key_info.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key has been disabled"
        )
        
    return key_info

async def verify_admin(api_key: Optional[str] = Depends(extract_api_key)) -> str:
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin API Key missing. Provide header 'X-API-Key' or 'Authorization: Bearer <key>'"
        )
    admin_key = get_admin_key()
    if api_key != admin_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Admin access required."
        )
    return api_key

# --- ADMIN API KEY MANAGEMENT ROUTER ---
admin_router = APIRouter(prefix="/api/admin/keys", tags=["Admin API Key Management"])

@admin_router.get("")
def list_keys(_admin_check: str = Depends(verify_admin)):
    """
    List all active and inactive API keys along with their owner and creation date.
    """
    data = load_keys_data()
    return data.get("keys", {})

@admin_router.post("", status_code=status.HTTP_201_CREATED)
def create_key(payload: KeyCreateRequest, _admin_check: str = Depends(verify_admin)):
    """
    Register a new client API key. If the key is not provided, a secure one will be auto-generated.
    """
    data = load_keys_data()
    keys_map = data.get("keys", {})
    
    key_val = payload.key
    if not key_val:
        key_val = secrets.token_hex(24)
        
    if key_val in keys_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API Key already exists"
        )
        
    keys_map[key_val] = {
        "owner": payload.owner,
        "is_active": payload.is_active if payload.is_active is not None else True,
        "created_at": datetime.utcnow().isoformat()
    }
    save_keys_data(data)
    return {"key": key_val, "metadata": keys_map[key_val]}

@admin_router.patch("/{key_val}")
def update_key(key_val: str, payload: KeyUpdateRequest, _admin_check: str = Depends(verify_admin)):
    """
    Update details (owner, status) for a specific API key.
    """
    data = load_keys_data()
    keys_map = data.get("keys", {})
    
    if key_val not in keys_map:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API Key not found"
        )
        
    if payload.owner is not None:
        keys_map[key_val]["owner"] = payload.owner
    if payload.is_active is not None:
        keys_map[key_val]["is_active"] = payload.is_active
        
    save_keys_data(data)
    return {"key": key_val, "metadata": keys_map[key_val]}

@admin_router.delete("/{key_val}")
def delete_key(key_val: str, _admin_check: str = Depends(verify_admin)):
    """
    Permanently delete/revoke an API key.
    """
    data = load_keys_data()
    keys_map = data.get("keys", {})
    
    if key_val not in keys_map:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API Key not found"
        )
        
    del keys_map[key_val]
    save_keys_data(data)
    return {"status": "success", "detail": "API key successfully revoked"}
