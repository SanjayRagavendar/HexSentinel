const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// TODO: verify API at https://docs.etherscan.io/

/**
 * Fetch transaction data from Etherscan API
 * @param {string} address - Contract address to analyze
 * @returns {Promise<Object>} Transaction data
 */
async function fetchEtherscanData(address) {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    
    if (!apiKey) {
        throw new Error('ETHERSCAN_API_KEY not found in environment variables');
    }
    
    const url = `https://api.etherscan.io/api`;
    const params = {
        module: 'account',
        action: 'txlist',
        address: address,
        startblock: 0,
        endblock: 99999999,
        sort: 'asc',
        apikey: apiKey
    };
    
    try {
        console.log(`Fetching transaction data for address: ${address}`);
        const response = await axios.get(url, { params });
        
        if (response.data.status === '1') {
            return response.data.result;
        } else {
            throw new Error(`Etherscan API error: ${response.data.message}`);
        }
    } catch (error) {
        console.error('Error fetching Etherscan data:', error.message);
        throw error;
    }
}

/**
 * Extract gas usage and success flags from transaction data
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Extracted metrics
 */
function extractMetrics(transactions) {
    const gasUsed = [];
    const successFlags = [];
    
    transactions.forEach(tx => {
        // Extract gas used (convert from hex to decimal)
        const gasUsedDecimal = parseInt(tx.gasUsed, 16);
        gasUsed.push(gasUsedDecimal);
        
        // Extract success flag (isError: "0" = success, "1" = failed)
        const isSuccess = tx.isError === "0";
        successFlags.push(isSuccess);
    });
    
    return {
        gasUsed,
        successFlags,
        totalTransactions: transactions.length,
        successfulTransactions: successFlags.filter(flag => flag).length,
        failedTransactions: successFlags.filter(flag => !flag).length
    };
}

/**
 * Calculate baseline statistics
 * @param {Object} metrics - Extracted metrics
 * @returns {Object} Baseline statistics
 */
function calculateBaseline(metrics) {
    const { gasUsed, successFlags } = metrics;
    
    // Calculate average gas usage
    const avgGas = gasUsed.reduce((sum, gas) => sum + gas, 0) / gasUsed.length;
    
    // Calculate gas usage standard deviation
    const variance = gasUsed.reduce((sum, gas) => sum + Math.pow(gas - avgGas, 2), 0) / gasUsed.length;
    const stdGas = Math.sqrt(variance);
    
    // Calculate failure rate
    const failRate = metrics.failedTransactions / metrics.totalTransactions;
    
    return {
        avgGas,
        stdGas,
        failRate,
        minGas: Math.min(...gasUsed),
        maxGas: Math.max(...gasUsed),
        totalGasUsed: gasUsed.reduce((sum, gas) => sum + gas, 0)
    };
}

/**
 * Main function to generate baseline data
 */
async function generateBaseline() {
    try {
        // Default to a well-known contract address for testing
        // In production, this would be the contract address to analyze
        const contractAddress = process.env.CONTRACT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT contract
        
        console.log('Starting Etherscan baseline analysis...');
        
        // Fetch transaction data
        const transactions = await fetchEtherscanData(contractAddress);
        
        if (!transactions || transactions.length === 0) {
            console.log('No transactions found for the specified address');
            return;
        }
        
        console.log(`Found ${transactions.length} transactions`);
        
        // Extract metrics
        const metrics = extractMetrics(transactions);
        
        // Calculate baseline
        const baseline = calculateBaseline(metrics);
        
        // Prepare output data
        const output = {
            contractAddress,
            timestamp: new Date().toISOString(),
            metrics,
            baseline,
            rawTransactions: transactions.slice(0, 100) // Store first 100 transactions for reference
        };
        
        // Write to file
        fs.writeFileSync('baseline.json', JSON.stringify(output, null, 2));
        
        console.log('Baseline analysis completed successfully!');
        console.log(`- Total transactions: ${metrics.totalTransactions}`);
        console.log(`- Successful: ${metrics.successfulTransactions}`);
        console.log(`- Failed: ${metrics.failedTransactions}`);
        console.log(`- Average gas used: ${baseline.avgGas.toFixed(2)}`);
        console.log(`- Gas usage std dev: ${baseline.stdGas.toFixed(2)}`);
        console.log(`- Failure rate: ${(baseline.failRate * 100).toFixed(2)}%`);
        console.log('Results saved to baseline.json');
        
    } catch (error) {
        console.error('Baseline generation failed:', error.message);
        process.exit(1);
    }
}

// Run the script if called directly
if (require.main === module) {
    generateBaseline();
}

module.exports = {
    fetchEtherscanData,
    extractMetrics,
    calculateBaseline,
    generateBaseline
}; 