import os
import time
import pandas as pd
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, recall_score

def train_model(
    project_root: str = ".",
    threshold: float = 0.5,
    n_estimators: int = 300,
    learning_rate: float = 0.1,
    max_depth: int = 6,
    scale_pos_weight: float = None,
    random_state: int = 42,
    n_jobs: int = -1,
    eval_metric: str = "logloss",
    **kwargs
):
    """
    Loads pre-split features and labels from data/processed/, trains an XGBoost model,
    and returns the model along with evaluation metrics computed at the specified threshold.

    Args:
        project_root (str): Project root directory path.
        threshold (float): Probability threshold for calculating accuracy and recall metrics.
        n_estimators (int): Number of trees in XGBoost.
        learning_rate (float): XGBoost learning rate.
        max_depth (int): Maximum depth of trees.
        scale_pos_weight (float): XGBoost scale weight. If None, it is calculated from training set.
        random_state (int): Random state seed.
        n_jobs (int): Threading count.
        eval_metric (str): XGBoost evaluation metric.
        **kwargs: Additional hyperparameters passed to XGBClassifier.

    Returns:
        tuple: (Trained XGBClassifier model, dict: metrics)
    """
    processed_dir = os.path.join(project_root, "data", "processed")
    
    # Load from centralized folder
    X_train = pd.read_csv(os.path.join(processed_dir, "X_train.csv"))
    X_test = pd.read_csv(os.path.join(processed_dir, "X_test.csv"))
    y_train = pd.read_csv(os.path.join(processed_dir, "y_train.csv")).iloc[:, 0]
    y_test = pd.read_csv(os.path.join(processed_dir, "y_test.csv")).iloc[:, 0]

    # Automatically compute scale_pos_weight if not explicitly provided
    if scale_pos_weight is None:
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

    model = XGBClassifier(
        n_estimators=n_estimators,
        learning_rate=learning_rate,
        max_depth=max_depth,
        scale_pos_weight=scale_pos_weight,
        random_state=random_state,
        n_jobs=n_jobs,
        eval_metric=eval_metric,
        **kwargs
    )

    t0 = time.time()
    model.fit(X_train, y_train)
    train_time = time.time() - t0

    # Custom threshold predictions
    proba = model.predict_proba(X_test)[:, 1]
    preds = (proba >= threshold).astype(int)
    acc = accuracy_score(y_test, preds)
    rec = recall_score(y_test, preds)

    print(f"Model trained. Accuracy (threshold {threshold}): {acc:.4f}, Recall (threshold {threshold}): {rec:.4f}")

    metrics = {
        "accuracy": acc,
        "recall": rec,
        "train_time": train_time
    }

    return model, metrics




