#!/usr/bin/env python3
"""
ML-based anomaly scoring for Ethereum smart contract threat analysis
Uses IsolationForest to detect anomalous behavior patterns
"""

import json
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import sys

# TODO: consult scikit-learn docs at https://scikit-learn.org/stable/modules/outlier_detection.html

def load_data():
    """Load baseline and metrics data from JSON files"""
    try:
        with open('baseline.json', 'r') as f:
            baseline_data = json.load(f)
        
        with open('metrics.json', 'r') as f:
            metrics_data = json.load(f)
        
        return baseline_data, metrics_data
    except FileNotFoundError as e:
        print(f"Error: Could not find required data file: {e}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in data file: {e}")
        sys.exit(1)

def extract_baseline_features(baseline_data):
    """Extract features from baseline data for training"""
    baseline = baseline_data.get('baseline', {})
    
    # Extract key features for anomaly detection
    features = [
        baseline.get('avgGas', 100000),      # Average gas usage
        baseline.get('stdGas', 50000),       # Gas usage standard deviation
        baseline.get('failRate', 0.1),       # Failure rate
        baseline.get('minGas', 21000),       # Minimum gas usage
        baseline.get('maxGas', 500000)       # Maximum gas usage
    ]
    
    return np.array(features).reshape(1, -1)

def extract_current_features(metrics_data):
    """Extract features from current metrics for scoring"""
    metrics = metrics_data.get('metrics', {})
    
    # Extract corresponding features from current data
    revert_rate = metrics.get('revertRate', {})
    oog = metrics.get('oog', {})
    gas_variance = metrics.get('gasVariance', {})
    external_calls = metrics.get('externalCalls', {})
    
    features = [
        gas_variance.get('avgGas', 100000),  # Average gas usage
        gas_variance.get('stdGas', 50000),   # Gas usage standard deviation
        revert_rate.get('revertRate', 0.1),  # Failure rate
        gas_variance.get('minGas', 21000),   # Minimum gas usage (estimated)
        gas_variance.get('maxGas', 500000)   # Maximum gas usage (estimated)
    ]
    
    return np.array(features).reshape(1, -1)

def train_isolation_forest(baseline_features):
    """Train IsolationForest model on baseline data"""
    # Create synthetic baseline data by adding noise to the single baseline point
    # This is a simplified approach - in production, you'd have more baseline data
    n_samples = 100
    noise_factor = 0.1
    
    # Generate synthetic baseline data
    baseline_array = baseline_features.flatten()
    synthetic_data = []
    
    for _ in range(n_samples):
        # Add random noise to baseline features
        noise = np.random.normal(0, noise_factor * np.abs(baseline_array))
        synthetic_point = baseline_array + noise
        synthetic_data.append(synthetic_point)
    
    synthetic_data = np.array(synthetic_data)
    
    # Train IsolationForest
    # contamination=0.05 means we expect 5% of data to be anomalous
    iso_forest = IsolationForest(
        contamination=0.05,
        random_state=42,
        n_estimators=100
    )
    
    # Fit the model
    iso_forest.fit(synthetic_data)
    
    return iso_forest

def compute_ml_score(model, current_features, baseline_features):
    """Compute ML-based anomaly score"""
    # Combine baseline and current features for scoring
    combined_features = np.vstack([baseline_features, current_features])
    
    # Get anomaly scores (lower values indicate more anomalous)
    anomaly_scores = model.decision_function(combined_features)
    
    # Get the score for current features (index 1)
    current_score = anomaly_scores[1]
    
    # Convert to 0-1000 scale
    # Normalize the score: typical range is -0.5 to 0.5
    # Map to 0-1000 where higher is better (less anomalous)
    normalized_score = (current_score + 0.5) * 1000
    normalized_score = np.clip(normalized_score, 0, 1000)
    
    return int(normalized_score), current_score

def main():
    """Main function to compute ML-based threat score"""
    print("Loading data for ML analysis...")
    baseline_data, metrics_data = load_data()
    
    print("Extracting features...")
    baseline_features = extract_baseline_features(baseline_data)
    current_features = extract_current_features(metrics_data)
    
    print("Training IsolationForest model...")
    model = train_isolation_forest(baseline_features)
    
    print("Computing ML-based threat score...")
    ml_score, raw_score = compute_ml_score(model, current_features, baseline_features)
    
    # Prepare output
    output = {
        'ml_score': ml_score,
        'raw_anomaly_score': float(raw_score),
        'baseline_features': baseline_features.flatten().tolist(),
        'current_features': current_features.flatten().tolist(),
        'timestamp': metrics_data.get('timestamp', ''),
        'contract_address': metrics_data.get('contractAddress', '')
    }
    
    # Print the ML score (this will be captured by the shell redirect)
    print(f"ML Score: {ml_score}/1000")
    print(f"Raw Anomaly Score: {raw_score:.4f}")
    print(f"Interpretation: {'LOW' if ml_score > 750 else 'MEDIUM' if ml_score > 500 else 'HIGH'} threat level")
    
    # Also save to file for the report generator
    with open('ml_score.json', 'w') as f:
        json.dump(output, f, indent=2)

if __name__ == "__main__":
    main() 