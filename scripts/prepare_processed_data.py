import os, sys
import pandas as pd

# make src importable
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.data.preprocess import prepare_modeling_data

RAW = "data/raw/Telco-Customer-Churn.csv"

# load raw
df = pd.read_csv(RAW)

# Centralized clean, feature engineer, type convert, and save splits
prepare_modeling_data(df, target_col="Churn")
