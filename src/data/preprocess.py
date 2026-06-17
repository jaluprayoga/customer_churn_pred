import os
import json
import joblib
import mlflow
import pandas as pd
from sklearn.model_selection import train_test_split


def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Basic cleaning for Telco churn.
    - trim column names
    - drop obvious ID cols
    - fix TotalCharges to numeric
    """
    # tidy headers
    df.columns = df.columns.str.strip()  # Remove leading/trailing whitespace

    # drop ids if present
    for col in ["customerID", "CustomerID", "customer_id"]:
        if col in df.columns:
            df = df.drop(columns=[col])
            
    # rename columns to consistent capitalization
    df = df.rename(columns={"gender": "Gender", "tenure": "Tenure"})

    # TotalCharges often has blanks in this dataset -> coerce to float
    if "TotalCharges" in df.columns:
        df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")

    return df

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineers features for Telco churn.
    """

    # SeniorCitizen should be 0/1 ints if present
    if "SeniorCitizen" in df.columns:
        df["SeniorCitizen"] = df["SeniorCitizen"].fillna(0).astype(int)

    # converts True/False to 1/0 for all boolean columns
    bool_cols = df.select_dtypes(include='bool').columns
    df[bool_cols] = df[bool_cols].astype(int)

    # Binary categorical columns
    binary_cols = [
        'Gender', 'Partner', 'Dependents', 
        'PhoneService', 'PaperlessBilling', 'Churn'
    ]

    binary_mapping = {
        'Yes': 1, 'No': 0,
        'Male': 1, 'Female': 0
    }

    for col in binary_cols:
        if col in df.columns:
            df[col] = df[col].map(binary_mapping).astype(int)

    # Map the 6 internet sub-services to binary 0/1 (Yes -> 1, others -> 0)
    internet_sub_services = [
        "OnlineSecurity",
        "OnlineBackup",
        "DeviceProtection",
        "TechSupport",
        "StreamingTV",
        "StreamingMovies",
    ]

    sub_services_mapping = {
        'Yes': 1, 'No': 0, 'No internet service': 0
    }

    for col in internet_sub_services:
        if col in df.columns:
            df[col] = df[col].map(sub_services_mapping).astype(int)

    # fill NA values
    # - numeric: fill with 0
    num_cols = df.select_dtypes(include=["number"]).columns
    df[num_cols] = df[num_cols].fillna(0)

    multi_cat_cols = [
        'MultipleLines', 'InternetService', 'Contract', 
        'PaymentMethod'
    ]

    df = pd.get_dummies(df, columns=multi_cat_cols, drop_first=True)

    # Drop redundant PhoneService feature
    if 'MultipleLines_No phone service' in df.columns:
        df = df.drop(columns=['MultipleLines_No phone service'])

    return df


def preprocess_and_engineer_features(df_raw: pd.DataFrame, target_col: str = "Churn", feature_columns = None) -> pd.DataFrame:
    """
    Cleans raw data, engineers features, and converts boolean columns.
    """
    # 1. Preprocess
    df_clean = preprocess_data(df_raw)

    # 2. Build Features
    df_clean = build_features(df_clean)
    
    # 3. Convert boolean columns to integers for XGBoost
    for c in df_clean.select_dtypes(include=["bool"]).columns:
        df_clean[c] = df_clean[c].astype(int)
        
    return df_clean


def prepare_modeling_data(
    df: pd.DataFrame, 
    target_col: str = "Churn", 
    test_size: float = 0.2, 
    project_root: str = ".", 
    save_csv=True, 
    save_log=True,
    is_inference=False,
    feature_columns=None
):
    """
    Orchestrates the complete data preparation pipeline:
    1. If df is provided, cleans, feature-engineers, and splits the data, saving X_train, X_test, y_train, y_test to data/processed/.
       If df is not provided, loads the pre-split datasets directly from data/processed/.
    2. Saves serving schema artifacts (feature_columns.json/txt, preprocessing.pkl).
    """
    processed_dir = os.path.join(project_root, "data", "processed")

    # If target column is not in columns (inference time), exclude it from preprocessing target
    effective_target = target_col if target_col in df.columns else None
    
    df_enc = preprocess_and_engineer_features(df, target_col=effective_target, feature_columns=feature_columns)

    if is_inference:
        return df_enc

    # 2. Train/Test Split
    print("[Pipeline] Splitting data...")
    X = df_enc.drop(columns=[target_col])
    y = df_enc[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        stratify=y,
        random_state=42
    )
    print(f"[OK] Train: {X_train.shape[0]} samples | Test: {X_test.shape[0]} samples")

    # 3. Save split datasets to data/processed/
    if save_csv:
        os.makedirs(processed_dir, exist_ok=True)
        X_train.to_csv(os.path.join(processed_dir, "X_train.csv"), index=False)
        X_test.to_csv(os.path.join(processed_dir, "X_test.csv"), index=False)
        pd.DataFrame(y_train).to_csv(os.path.join(processed_dir, "y_train.csv"), index=False)
        pd.DataFrame(y_test).to_csv(os.path.join(processed_dir, "y_test.csv"), index=False)
    
        print(f"[OK] Saved split datasets to {processed_dir}")
    
    if save_log:
        feature_cols = list(X.columns)
        # Save serving schema metadata artifacts
        artifacts_dir = os.path.join(project_root, "artifacts")
        os.makedirs(artifacts_dir, exist_ok=True)

        # Save feature columns JSON
        with open(os.path.join(artifacts_dir, "feature_columns.json"), "w") as f:
            json.dump(feature_cols, f)

        mlflow.log_text("\n".join(feature_cols), artifact_file="feature_columns.txt")

        preprocessing_artifact = {
            "feature_columns": feature_cols,
            "target": target_col
        }
        joblib.dump(preprocessing_artifact, os.path.join(artifacts_dir, "preprocessing.pkl"))
        mlflow.log_artifact(os.path.join(artifacts_dir, "preprocessing.pkl"))
        print(f"[OK] Saved {len(feature_cols)} feature columns for serving consistency")

    return X_train, X_test, y_train, y_test
