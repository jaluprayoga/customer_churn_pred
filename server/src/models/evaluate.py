import time
from sklearn.metrics import classification_report, confusion_matrix, precision_score, recall_score, f1_score, roc_auc_score

def evaluate_model(model, X_test, y_test, threshold: float = 0.5):
    """
    Evaluates a model on test data using a custom decision threshold.

    Args:
        model: Trained classifier supporting predict_proba.
        X_test: Test features.
        y_test: Test labels.
        threshold (float): Classification threshold for the positive class.

    Returns:
        tuple: (dict of metrics, predicted labels numpy array, float: inference time in seconds)
    """
    t1 = time.time()
    proba = model.predict_proba(X_test)[:, 1]
    y_pred = (proba >= threshold).astype(int)
    pred_time = time.time() - t1

    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, proba)

    metrics = {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc
    }

    return metrics, y_pred, pred_time


def print_evaluation_report(y_test, y_pred, metrics, pred_time):
    """
    Prints a formatted evaluation report including confusion matrix and classification report.
    """
    print("\n[Evaluation] Detailed Classification Report:")
    print(classification_report(y_test, y_pred, digits=3))
    print("[Evaluation] Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    print("\n[Evaluation] Model Performance:")
    print(f"   Precision: {metrics['precision']:.3f} | Recall: {metrics['recall']:.3f}")
    print(f"   F1 Score: {metrics['f1']:.3f} | ROC AUC: {metrics['roc_auc']:.3f}")
    print(f"   Inference time: {pred_time:.4f}s")

