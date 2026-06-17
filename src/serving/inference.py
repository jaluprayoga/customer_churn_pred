"""
INFERENCE PIPELINE - Production ML Model Serving with Feature Consistency
=========================================================================

This module provides the core inference functionality for the Telco Churn prediction model.
It ensures that serving-time feature transformations exactly match training-time transformations,
which is CRITICAL for model accuracy in production.

Key Responsibilities:
1. Load MLflow-logged model and feature metadata from training
2. Apply identical feature transformations as used during training
3. Ensure correct feature ordering for model input
4. Convert model predictions to user-friendly output

CRITICAL PATTERN: Training/Serving Consistency
- Uses fixed BINARY_MAP for deterministic binary encoding
- Applies same one-hot encoding with drop_first=True
- Maintains exact feature column order from training
- Handles missing/new categorical values gracefully

Production Deployment:
- MODEL_DIR points to containerized model artifacts
- Feature schema loaded from training-time artifacts
- Optimized for single-row inference (real-time serving)
"""

import os
import pandas as pd
import mlflow
import mlflow.sklearn
import shap
import glob

# Global SHAP explainer
explainer = None

# === MODEL LOADING CONFIGURATION ===
# IMPORTANT: This path is set during Docker container build
# In development: uses local src/serving/model if present, else falls back to local MLflow runs
# In production: uses model copied to container at build time
MODEL_DIR = "src/serving/model" if os.path.exists("src/serving/model/MLmodel") or os.path.exists("./src/serving/model/MLmodel") else "/app/model"

try:
    # Load the trained XGBoost model in MLflow pyfunc format
    # This ensures compatibility regardless of the underlying ML library
    model = mlflow.pyfunc.load_model(MODEL_DIR)
    
    # Load native model for SHAP calculations
    try:
        native_model = mlflow.sklearn.load_model(MODEL_DIR)
        explainer = shap.TreeExplainer(native_model)
        print(f"[Serving] Model and SHAP Explainer loaded successfully from {MODEL_DIR}")
    except Exception as shap_load_err:
        print(f"[Serving] Note: Failed to load SHAP explainer from {MODEL_DIR}: {shap_load_err}")
except Exception as e:
    print(f"[Serving] Note: Failed to load model from {MODEL_DIR}: {e}. Trying fallback...")
    # Fallback for local development (OPTIONAL)
    try:
        # Try loading from local MLflow tracking
        local_model_paths = glob.glob("./mlruns/*/*/artifacts/model")
        # Only consider models that have feature_columns.txt (production ready)
        local_model_paths = [
            p for p in local_model_paths
            if os.path.exists(os.path.join(os.path.dirname(p), "feature_columns.txt"))
            or os.path.exists(os.path.join(p, "feature_columns.txt"))
        ]
        if local_model_paths:
            latest_model = max(local_model_paths, key=os.path.getmtime)
            model = mlflow.pyfunc.load_model(latest_model)
            MODEL_DIR = latest_model
            print(f"[Serving] Fallback: Loaded model from {latest_model}")
            
            # Load native model for SHAP calculations in fallback
            try:
                native_model = mlflow.sklearn.load_model(latest_model)
                explainer = shap.TreeExplainer(native_model)
                print(f"[Serving] Fallback: Loaded SHAP Explainer from {latest_model}")
            except Exception as shap_load_err:
                print(f"[Serving] Note: Failed to load SHAP explainer from fallback: {shap_load_err}")
        else:
            raise Exception("No production-ready model found in local mlruns (missing feature_columns.txt)")
    except Exception as fallback_error:
        raise Exception(f"Failed to load model: {e}. Fallback failed: {fallback_error}")

# === FEATURE SCHEMA LOADING ===
# CRITICAL: Load the exact feature column order used during training
# This ensures the model receives features in the expected order
try:
    feature_file = os.path.join(MODEL_DIR, "feature_columns.txt")
    if not os.path.exists(feature_file):
        # Fallback for local development MLflow layout
        parent_dir = os.path.dirname(MODEL_DIR)
        parent_feature_file = os.path.join(parent_dir, "feature_columns.txt")
        if os.path.exists(parent_feature_file):
            feature_file = parent_feature_file

    with open(feature_file) as f:
        FEATURE_COLS = [ln.strip() for ln in f if ln.strip()]
    print(f"[Serving] Loaded {len(FEATURE_COLS)} feature columns from training")
except Exception as e:
    raise Exception(f"Failed to load feature columns: {e}")

# === FEATURE TRANSFORMATION CONSTANTS ===
# CRITICAL: Mappings are dynamically aligned using the training-time FEATURE_COLS
# metadata to prevent train/serve feature skew.

def _serve_transform(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply identical feature transformations as used during model training.
    
    This function leverages the prepare_modeling_data pipeline function
    to ensure perfect feature engineering consistency between training and serving.
    """
    try:
        from src.data.preprocess import prepare_modeling_data
    except ModuleNotFoundError:
        from data.preprocess import prepare_modeling_data

    # Apply preprocessing and feature engineering in inference mode
    df_enc = prepare_modeling_data(
        df, 
        target_col="Churn", 
        is_inference=True,
        feature_columns=FEATURE_COLS
    )
    
    # Align features with the expected training schema columns and order
    df_enc = df_enc.reindex(columns=FEATURE_COLS, fill_value=0)
    
    return df_enc

def predict(input_dict: dict) -> dict:
    """
    Main prediction function for customer churn inference with SHAP values.
    
    This function provides the complete inference pipeline from raw customer data
    to business-friendly prediction output and feature importances (SHAP values).
    
    Pipeline:
    1. Convert input dictionary to DataFrame
    2. Apply feature transformations (identical to training)
    3. Generate model prediction using loaded XGBoost model
    4. Calculate SHAP values for the sample
    5. Convert prediction to user-friendly string
    
    Args:
        input_dict: Dictionary containing raw customer data with keys matching
                   the CustomerData schema (18 features total)
                   
    Returns:
        A dictionary with keys:
        - "prediction": "Likely to churn" or "Not likely to churn"
        - "shap_values": Dictionary mapping each feature column name to its SHAP value
        
    Example:
        >>> customer_data = {
        ...     "gender": "Female", "tenure": 1, "Contract": "Month-to-month",
        ...     "MonthlyCharges": 85.0, ... # other features
        ... }
        >>> predict(customer_data)
        {"prediction": "Likely to churn", "shap_values": {...}}
    """
    
    # === STEP 1: Convert Input to DataFrame ===
    # Create single-row DataFrame for pandas transformations
    df = pd.DataFrame([input_dict])
    
    # === STEP 2: Apply Feature Transformations ===
    # Use the same transformation pipeline as training
    df_enc = _serve_transform(df)
    
    # === STEP 3: Generate Model Prediction ===
    # Call the loaded MLflow model for inference
    # The model returns predictions in various formats depending on the ML library
    try:
        preds = model.predict(df_enc)
        
        # Normalize prediction output to consistent format
        if hasattr(preds, "tolist"):
            preds = preds.tolist()  # Convert numpy array to list
            
        # Extract single prediction value (for single-row input)
        if isinstance(preds, (list, tuple)) and len(preds) == 1:
            result = preds[0]
        else:
            result = preds
            
    except Exception as e:
        raise Exception(f"Model prediction failed: {e}")
    
    # === STEP 4: Calculate SHAP values (Feature Importance) ===
    shap_dict = {}
    if explainer is not None:
        try:
            shap_vals = explainer.shap_values(df_enc)
            if hasattr(shap_vals, "tolist"):
                if len(shap_vals.shape) == 2:
                    single_shap_vals = shap_vals[0].tolist()
                else:
                    single_shap_vals = shap_vals.tolist()
            else:
                single_shap_vals = list(shap_vals)
            
            # Use FEATURE_COLS as keys
            shap_dict = dict(zip(FEATURE_COLS, single_shap_vals))
        except Exception as shap_err:
            print(f"[Serving] Failed to calculate SHAP values: {shap_err}")

    # === STEP 5: Convert to Business-Friendly Output ===
    # Convert binary prediction (0/1) to actionable business language
    prediction_str = "Likely to churn" if result == 1 else "Not likely to churn"
    
    return {
        "prediction": prediction_str,
        "shap_values": shap_dict
    }
