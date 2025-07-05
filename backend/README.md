# Ethereum Smart Contract Threat Analysis MVP

A lean, zero-Docker MVP for analyzing Ethereum smart contract security threats using transaction traces, gas analysis, and machine learning anomaly detection.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- npm or yarn

### Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env and add your Etherscan API key
   ```

### Running the Analysis

Execute the complete threat analysis pipeline:

```bash
npm run full-analysis
```

Or run individual steps:

```bash
# 1. Generate baseline from Etherscan
npm run baseline

# 2. Start local Hardhat node (in separate terminal)
npx hardhat node

# 3. Collect transaction traces
npm run trace

# 4. Compute threat metrics
npm run metrics

# 5. Generate ML anomaly score
npm run ml-score

# 6. Generate final report
npm run report
```

## 📁 Project Structure

```
├── contracts/
│   └── SimpleVault.sol          # Sample contract for testing
├── scripts/
│   ├── etherscanBaseline.js     # Etherscan API integration
│   ├── trace.js                 # Transaction trace collection
│   ├── computeMetrics.js        # Threat metric computation
│   ├── ml_score.py             # ML anomaly detection
│   └── generateReport.js        # Report generation
├── hardhat.config.js            # Hardhat configuration
├── package.json                 # Node.js dependencies
├── requirements.txt             # Python dependencies
└── README.md                   # This file
```

## 🔍 Analysis Components

### 1. Etherscan Baseline (`scripts/etherscanBaseline.js`)
- Fetches historical transaction data from Etherscan API
- Extracts gas usage and success/failure patterns
- Creates baseline for comparison
- **TODO**: Verify API at https://docs.etherscan.io/

### 2. Trace Collection (`scripts/trace.js`)
- Deploys `SimpleVault` contract on local Hardhat network
- Executes various test scenarios (deposits, withdrawals, risky functions)
- Records gas usage, revert status, and transaction details
- Generates `raw-traces.json`

### 3. Metric Computation (`scripts/computeMetrics.js`)
Computes four key threat metrics:

- **Revert Rate** (0-300 points): Compares failure rate to baseline
- **Out-of-Gas Count** (0-200 points): Penalizes high gas usage
- **Gas Usage Variance** (0-250 points): Measures gas usage consistency
- **External Calls Frequency** (0-250 points): Identifies risky external interactions

### 4. ML Anomaly Detection (`scripts/ml_score.py`)
- Uses IsolationForest algorithm for anomaly detection
- Trains on baseline data to identify unusual patterns
- **TODO**: Consult scikit-learn docs at https://scikit-learn.org/stable/modules/outlier_detection.html

### 5. Report Generation (`scripts/generateReport.js`)
- Combines metrics and ML scores (70% metrics, 30% ML)
- Generates comprehensive markdown report
- Provides actionable recommendations and next steps

## 📊 Output Files

- `baseline.json` - Historical transaction data and baseline metrics
- `raw-traces.json` - Collected transaction traces and gas data
- `metrics.json` - Computed threat metrics and scores
- `ml_score.txt` - ML anomaly detection results
- `ml_score.json` - Detailed ML analysis data
- `report.md` - Final comprehensive threat analysis report

## 🎯 Threat Scoring

The system generates scores out of 1000:

- **800-1000**: LOW threat level
- **600-799**: MEDIUM threat level  
- **400-599**: HIGH threat level
- **0-399**: CRITICAL threat level

### Score Breakdown
- **Metrics Score** (70% weight): Based on revert rate, gas usage, and external calls
- **ML Score** (30% weight): Based on anomaly detection against baseline patterns

## 🔧 Configuration

### Environment Variables
```bash
ETHERSCAN_API_KEY=your_api_key_here    # Required for baseline analysis
REPORT_GAS=true                        # Optional: Enable gas reporting
CONTRACT_ADDRESS=0x...                 # Optional: Target contract for baseline
```

### Hardhat Configuration
- Solidity version: 0.8.19
- Local network: http://127.0.0.1:8545
- Chain ID: 31337

## 🧪 Testing

The `SimpleVault` contract includes various test scenarios:
- Normal deposits and withdrawals
- Invalid amounts (too small/large)
- Risky functions with random reverts
- External call functions
- Gas-intensive operations

## 📈 Extending the MVP

### Adding New Metrics
1. Add calculation function in `computeMetrics.js`
2. Update score weighting in `calculateCombinedScore()`
3. Add to report generation in `generateReport.js`

### Custom Contracts
1. Replace `SimpleVault.sol` with your contract
2. Update test scenarios in `trace.js`
3. Adjust external call detection in `computeMetrics.js`

### Enhanced ML Features
1. Add more features to `extract_current_features()` in `ml_score.py`
2. Experiment with different ML algorithms
3. Implement cross-validation for model validation

## 🚨 Security Notes

- This is an MVP for educational/demonstration purposes
- Production use requires additional security measures
- Always conduct professional security audits for production contracts
- The ML model uses synthetic data generation - real production should use actual historical data

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Etherscan API Documentation](https://docs.etherscan.io/)
- [scikit-learn Outlier Detection](https://scikit-learn.org/stable/modules/outlier_detection.html)
- [Ethereum Gas Optimization](https://ethereum.org/en/developers/docs/gas/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all scripts run successfully
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details. 