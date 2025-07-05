const fs = require('fs');

/**
 * Load data from JSON files
 * @param {string} tracesFile - Path to raw traces file
 * @param {string} baselineFile - Path to baseline file
 * @returns {Object} Loaded data
 */
function loadData(tracesFile = 'raw-traces.json', baselineFile = 'baseline.json') {
    try {
        const tracesData = JSON.parse(fs.readFileSync(tracesFile, 'utf8'));
        const baselineData = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
        
        return { tracesData, baselineData };
    } catch (error) {
        console.error('Error loading data:', error.message);
        throw error;
    }
}

/**
 * Calculate revert rate score (0-300)
 * @param {Array} traces - Array of trace objects
 * @param {Object} baseline - Baseline data
 * @returns {Object} Revert rate metrics and score
 */
function calculateRevertRateScore(traces, baseline) {
    const totalTraces = traces.length;
    const revertedTraces = traces.filter(t => t.reverted).length;
    const revertRate = revertedTraces / totalTraces;
    
    // Compare with baseline failure rate
    const baselineFailRate = baseline.baseline.failRate || 0.1; // Default 10%
    const deviation = Math.abs(revertRate - baselineFailRate);
    
    // Score calculation: 300 points for perfect match, decreasing with deviation
    // Max penalty for 50% deviation or more
    const maxDeviation = 0.5;
    const score = Math.max(0, 300 * (1 - deviation / maxDeviation));
    
    return {
        totalTraces,
        revertedTraces,
        revertRate,
        baselineFailRate,
        deviation,
        score: Math.round(score)
    };
}

/**
 * Calculate out-of-gas penalty score (0-200)
 * @param {Array} traces - Array of trace objects
 * @param {Object} baseline - Baseline data
 * @returns {Object} OOG metrics and score
 */
function calculateOOGScore(traces, baseline) {
    const successfulTraces = traces.filter(t => t.success && t.gasUsed !== "0");
    
    if (successfulTraces.length === 0) {
        return {
            totalSuccessful: 0,
            oogCount: 0,
            oogRate: 0,
            score: 0
        };
    }
    
    // Count transactions that used more than 90% of gas limit
    // Assuming typical gas limit of 30M for simplicity
    const gasLimit = 30000000;
    const oogThreshold = gasLimit * 0.9;
    
    const oogCount = successfulTraces.filter(t => {
        const gasUsed = parseInt(t.gasUsed);
        return gasUsed > oogThreshold;
    }).length;
    
    const oogRate = oogCount / successfulTraces.length;
    
    // Score: 200 points for 0% OOG, decreasing linearly to 0 at 50% OOG
    const maxOOGRate = 0.5;
    const score = Math.max(0, 200 * (1 - oogRate / maxOOGRate));
    
    return {
        totalSuccessful: successfulTraces.length,
        oogCount,
        oogRate,
        gasLimit,
        oogThreshold,
        score: Math.round(score)
    };
}

/**
 * Calculate gas usage variance score (0-250)
 * @param {Array} traces - Array of trace objects
 * @param {Object} baseline - Baseline data
 * @returns {Object} Gas variance metrics and score
 */
function calculateGasVarianceScore(traces, baseline) {
    const successfulTraces = traces.filter(t => t.success && t.gasUsed !== "0");
    
    if (successfulTraces.length < 2) {
        return {
            totalSuccessful: successfulTraces.length,
            avgGas: 0,
            stdGas: 0,
            baselineStdGas: baseline.baseline.stdGas || 100000,
            varianceRatio: 0,
            score: 0
        };
    }
    
    // Calculate current gas usage statistics
    const gasUsed = successfulTraces.map(t => parseInt(t.gasUsed));
    const avgGas = gasUsed.reduce((sum, gas) => sum + gas, 0) / gasUsed.length;
    
    const variance = gasUsed.reduce((sum, gas) => sum + Math.pow(gas - avgGas, 2), 0) / gasUsed.length;
    const stdGas = Math.sqrt(variance);
    
    // Compare with baseline standard deviation
    const baselineStdGas = baseline.baseline.stdGas || 100000;
    const varianceRatio = stdGas / baselineStdGas;
    
    // Score: 250 points for variance ratio <= 1, decreasing to 0 at ratio >= 5
    const maxRatio = 5;
    const score = Math.max(0, 250 * (1 - (varianceRatio - 1) / (maxRatio - 1)));
    
    return {
        totalSuccessful: successfulTraces.length,
        avgGas: Math.round(avgGas),
        stdGas: Math.round(stdGas),
        baselineStdGas: Math.round(baselineStdGas),
        varianceRatio,
        score: Math.round(score)
    };
}

/**
 * Calculate external calls frequency score (0-250)
 * @param {Array} traces - Array of trace objects
 * @param {Object} baseline - Baseline data
 * @returns {Object} External calls metrics and score
 */
function calculateExternalCallsScore(traces, baseline) {
    // Count transactions that make external calls
    // For this MVP, we'll identify external calls by function name
    const externalCallFunctions = ['externalCall', 'withdraw']; // Functions that make external calls
    const externalCallTraces = traces.filter(t => 
        externalCallFunctions.includes(t.functionName)
    );
    
    const totalTraces = traces.length;
    const externalCallRate = externalCallTraces.length / totalTraces;
    
    // Score: 250 points for 0% external calls, decreasing to 0 at 50% external calls
    // External calls are generally considered risky
    const maxExternalCallRate = 0.5;
    const score = Math.max(0, 250 * (1 - externalCallRate / maxExternalCallRate));
    
    return {
        totalTraces,
        externalCallTraces: externalCallTraces.length,
        externalCallRate,
        externalCallFunctions,
        score: Math.round(score)
    };
}

/**
 * Calculate combined threat score
 * @param {Object} metrics - All computed metrics
 * @returns {number} Combined score out of 1000
 */
function calculateCombinedScore(metrics) {
    const { revertRate, oog, gasVariance, externalCalls } = metrics;
    
    const combinedScore = revertRate.score + oog.score + gasVariance.score + externalCalls.score;
    
    return {
        combinedScore,
        breakdown: {
            revertRate: revertRate.score,
            oog: oog.score,
            gasVariance: gasVariance.score,
            externalCalls: externalCalls.score
        }
    };
}

/**
 * Main function to compute all metrics
 */
function computeMetrics() {
    try {
        console.log('Loading trace and baseline data...');
        const { tracesData, baselineData } = loadData();
        
        console.log('Computing threat metrics...');
        
        // Calculate individual metric scores
        const revertRate = calculateRevertRateScore(tracesData.traces, baselineData);
        const oog = calculateOOGScore(tracesData.traces, baselineData);
        const gasVariance = calculateGasVarianceScore(tracesData.traces, baselineData);
        const externalCalls = calculateExternalCallsScore(tracesData.traces, baselineData);
        
        // Calculate combined score
        const combined = calculateCombinedScore({
            revertRate,
            oog,
            gasVariance,
            externalCalls
        });
        
        // Prepare output
        const output = {
            timestamp: new Date().toISOString(),
            contractAddress: tracesData.contractAddress,
            metrics: {
                revertRate,
                oog,
                gasVariance,
                externalCalls
            },
            combined,
            summary: {
                totalScore: combined.combinedScore,
                maxPossibleScore: 1000,
                threatLevel: combined.combinedScore < 500 ? 'HIGH' : 
                           combined.combinedScore < 750 ? 'MEDIUM' : 'LOW'
            }
        };
        
        // Write to file
        fs.writeFileSync('metrics.json', JSON.stringify(output, null, 2));
        
        // Print summary
        console.log('\n=== Threat Analysis Results ===');
        console.log(`Contract: ${output.contractAddress}`);
        console.log(`Total Score: ${combined.combinedScore}/1000`);
        console.log(`Threat Level: ${output.summary.threatLevel}`);
        console.log('\nBreakdown:');
        console.log(`- Revert Rate: ${revertRate.score}/300 (${revertRate.revertRate.toFixed(2)}% revert rate)`);
        console.log(`- Out-of-Gas: ${oog.score}/200 (${oog.oogCount} OOG transactions)`);
        console.log(`- Gas Variance: ${gasVariance.score}/250 (std dev: ${gasVariance.stdGas})`);
        console.log(`- External Calls: ${externalCalls.score}/250 (${externalCalls.externalCallRate.toFixed(2)}% external call rate)`);
        console.log('\nResults saved to metrics.json');
        
    } catch (error) {
        console.error('Metric computation failed:', error.message);
        process.exit(1);
    }
}

// Run the script if called directly
if (require.main === module) {
    computeMetrics();
}

module.exports = {
    loadData,
    calculateRevertRateScore,
    calculateOOGScore,
    calculateGasVarianceScore,
    calculateExternalCallsScore,
    calculateCombinedScore,
    computeMetrics
}; 