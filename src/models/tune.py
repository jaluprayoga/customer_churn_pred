import optuna
from optuna.samplers import TPESampler
from xgboost import XGBClassifier
from sklearn.model_selection import cross_val_score
from sklearn.metrics import make_scorer, recall_score

def threshold_recall(y_true, y_proba, threshold=0.5):
    y_pred = (y_proba >= threshold).astype(int)
    return recall_score(y_true, y_pred, zero_division=0)

def tune_model(X, y, threshold: float = 0.5, trials = 20):
    """
    Tunes an XGBoost model using Optuna optimizing recall at a custom threshold.

    Args:
        X (pd.DataFrame): Features.
        y (pd.Series): Target.
        threshold (float): Prediction threshold for recall calculation.
    """
    sampler = TPESampler(seed=42)
    study = optuna.create_study(direction="maximize", sampler=sampler)
    custom_scorer = make_scorer(
        threshold_recall,
        response_method="predict_proba",
        threshold=threshold
    )

    def objective(trial):
        params = {
            "n_estimators": trial.suggest_int("n_estimators", 300, 800),
            "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2),
            "max_depth": trial.suggest_int("max_depth", 3, 10),
            "subsample": trial.suggest_float("subsample", 0.5, 1.0),
            "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
            "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
            "gamma": trial.suggest_float("gamma", 0, 5),
            "reg_alpha": trial.suggest_float("reg_alpha", 0, 5),
            "reg_lambda": trial.suggest_float("reg_lambda", 0, 5),
            "random_state": 42,
            "n_jobs": -1,
            "scale_pos_weight": (y == 0).sum() / (y == 1).sum(),
            "eval_metric": "logloss"
        }
        model = XGBClassifier(**params)
        scores = cross_val_score(model, X, y, cv=3, scoring=custom_scorer)
        return scores.mean()

    study.optimize(objective, n_trials=trials)

    print("Best Params:", study.best_params)
    return study.best_params

