import os
# Make sure Python can find src package
import sys
sys.path.append(os.path.abspath("src"))

from data.load_data import load_data
from data.preprocess import prepare_modeling_data

# === CONFIG ===
DATA_PATH = "data/raw/Telco-Customer-Churn.csv"
TARGET_COL = "Churn"

def main():
    print("=== Testing Phase 1: Load -> Preprocess -> Build Features ===")

    # Load Data
    print("\n[1] Loading data...")
    df = load_data(DATA_PATH)
    print(f"Data loaded. Shape: {df.shape}")
    print(df.head(3))

    # Preprocess
    print("\n[2] Preprocessing data...")
    df_clean = prepare_modeling_data(df, save_csv=False, save_log=False, is_inference=True)
    print(f"Data after preprocessing. Shape: {df_clean.shape}")
    print(df_clean.head(3))

    print("\n[OK] Data Preprocessing completed successfully!")

if __name__ == "__main__":
    main()
