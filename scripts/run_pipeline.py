import os
import sys
import argparse
import pandas as pd
import json
import mlflow
import mlflow.sklearn
# Allow imports from src/ directory structure
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Local modules - Core pipeline components
from src.data.load_data import load_data
from src.data.preprocess import prepare_modeling_data
from src.utils.validate_data import validate_telco_data
from src.models.train import train_model
from src.models.evaluate import evaluate_model, print_evaluation_report
from src.models.tune import tune_model

def setup_mlflow(args, project_root):
    """Configure MLflow tracking URI and set the experiment."""
    mlruns_path = args.mlflow_uri or f"file:///{project_root.replace(os.sep, '/')}/mlruns"
    mlflow.set_tracking_uri(mlruns_path)
    mlflow.set_experiment(args.experiment)
    return mlruns_path


def load_and_validate_data(input_path):
    """Load the raw data and perform validation checks."""
    print("[Pipeline] Loading data...")
    df = load_data(input_path)
    print(f"[OK] Data loaded: {df.shape[0]} rows, {df.shape[1]} columns")

    print("[Pipeline] Validating data quality with Great Expectations...")
    is_valid, failed = validate_telco_data(df)
    mlflow.log_metric("data_quality_pass", int(is_valid))

    if not is_valid:
        mlflow.log_text(json.dumps(failed, indent=2), artifact_file="failed_expectations.json")
        raise ValueError(f"[Error] Data quality check failed. Issues: {failed}")
    
    print("[OK] Data validation passed. Logged to MLflow.")
    return df



def main(args):
    """Main training pipeline function that orchestrates the complete ML workflow."""
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    setup_mlflow(args, project_root)
    threshold=args.threshold
    test_size=args.test_size
    istune=args.tune
    input_data=args.input
    target_column=args.target
    n_trials=args.trials

    with mlflow.start_run():
        mlflow.log_param("model", "xgboost")
        mlflow.log_param("threshold", threshold)
        mlflow.log_param("test_size", test_size)
        mlflow.log_param("tuning_run", istune)

        # Stage 1: Load & Validate
        df = load_and_validate_data(input_data)

        # Stages 2, 3, & 4: Process, Feature Engineer, and Split the data
        print("[Pipeline] Preparing modeling data...")
        prepare_modeling_data(
            df, target_col=target_column, test_size=test_size, project_root=project_root
        )

        # Stage 5: Train
        print("[Pipeline] Training XGBoost model...")
        if istune:
            print("[Pipeline] Running hyperparameter tuning with Optuna...")
            processed_dir = os.path.join(project_root, "data", "processed")
            X_train = pd.read_csv(os.path.join(processed_dir, "X_train.csv"))
            y_train = pd.read_csv(os.path.join(processed_dir, "y_train.csv")).iloc[:, 0]
            
            best_params = tune_model(X_train, y_train, threshold=threshold, trials=n_trials)
            print(f"[OK] Hyperparameter tuning complete. Best parameters found: {best_params}")
        else:
            best_params = {
                'n_estimators':500,
                'learning_rate':0.05,
                'max_depth':6,
                'subsample':0.8,
                'colsample_bytree':0.8,
                'random_state':42,
                'n_jobs':-1,
                'eval_metric':'logloss'
            }
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()

        # Log hyperparameters to MLflow
        for key, val in best_params.items():
            mlflow.log_param(key, val)

        model, train_metrics = train_model(
            project_root=project_root,
            threshold=threshold,
            random_state=42,
            n_jobs=-1,
            eval_metric="logloss",
            scale_pos_weight = scale_pos_weight,
            **best_params
        )
        train_time = train_metrics["train_time"]
        mlflow.log_metric("train_time", train_time)
        print(f"[OK] Model trained in {train_time:.2f} seconds")

        # Stage 6: Evaluate
        print("[Pipeline] Evaluating model performance...")
        processed_dir = os.path.join(project_root, "data", "processed")
        X_test = pd.read_csv(os.path.join(processed_dir, "X_test.csv"))
        y_test = pd.read_csv(os.path.join(processed_dir, "y_test.csv")).iloc[:, 0]
        metrics, y_pred, pred_time = evaluate_model(model, X_test, y_test, threshold)
        
        # Log to MLflow
        mlflow.log_metric("pred_time", pred_time)
        mlflow.log_metric("precision", metrics["precision"])
        mlflow.log_metric("recall", metrics["recall"])
        mlflow.log_metric("f1", metrics["f1"])
        mlflow.log_metric("roc_auc", metrics["roc_auc"])

        # Stage 7: Serialize
        print("[Pipeline] Saving model to MLflow...")
        mlflow.sklearn.log_model(model, artifact_path="model")
        print("[OK] Model saved to MLflow for serving pipeline")

        # Save to local for serving pipeline
        if istune:
            local_model_path = os.path.join(project_root, "src", "serving", "model")
            print(f"[Pipeline] Saving model to local serving directory: {local_model_path}")
            import shutil
            if os.path.exists(local_model_path):
                shutil.rmtree(local_model_path)
            mlflow.sklearn.save_model(model, path=local_model_path)
            
            # Also save feature_columns.txt into local_model_path for consistency in serving
            feature_json_path = os.path.join(project_root, "artifacts", "feature_columns.json")
            if os.path.exists(feature_json_path):
                with open(feature_json_path, "r") as f:
                    feature_cols = json.load(f)
                with open(os.path.join(local_model_path, "feature_columns.txt"), "w") as f:
                    f.write("\n".join(feature_cols) + "\n")
            print("[OK] Local serving model and feature columns saved successfully.")

        # Summary Outputs & Reports
        print("\n[Pipeline] Performance Summary:")
        print(f"   Training time: {train_time:.2f}s")
        print_evaluation_report(y_test, y_pred, metrics, pred_time)
        print(f"   Samples per second: {len(X_test)/pred_time:.0f}")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Run churn pipeline with XGBoost + MLflow")
    p.add_argument("--input", type=str, required=True,
                   help="path to CSV (e.g., data/raw/Telco-Customer-Churn.csv)")
    p.add_argument("--target", type=str, default="Churn")
    p.add_argument("--threshold", type=float, default=0.35)
    p.add_argument("--test_size", type=float, default=0.2)
    p.add_argument("--experiment", type=str, default="Telco Churn")
    p.add_argument("--tune", action="store_true",
                   help="Run hyperparameter tuning with Optuna before training")
    p.add_argument("--trials", type=int, default=30,
                   help="Number of tuning trials for Optuna")
    p.add_argument("--mlflow_uri", type=str, default=None,
                    help="override MLflow tracking URI, else uses project_root/mlruns")

    args = p.parse_args()
    main(args)
