const fs = require('fs');

/**
 * Load metrics and ML score data
 * @returns {Object} Combined data from all sources
 */
function loadReportData() {
    try {
        const metricsData = JSON.parse(fs.readFileSync('metrics.json', 'utf8'));
        const mlScoreData = JSON.parse(fs.readFileSync('ml_score.json', 'utf8'));
        
        return { metricsData, mlScoreData };
    } catch (error) {
        console.error('Error loading report data:', error.message);
        throw error;
    }
}

/**
 * Calculate combined threat score
 * @param {Object} metricsData - Metrics data
 * @param {Object} mlScoreData - ML score data
 * @returns {Object} Combined scoring information
 */
function calculateCombinedScore(metricsData, mlScoreData) {
    const metricsScore = metricsData.combined.combinedScore;
    const mlScore = mlScoreData.ml_score;
    
    // Weighted combination: 70% metrics, 30% ML
    const combinedScore = Math.round(metricsScore * 0.7 + mlScore * 0.3);
    
    return {
        metricsScore,
        mlScore,
        combinedScore,
        weights: { metrics: 0.7, ml: 0.3 }
    };
}

/**
 * Determine threat level based on score
 * @param {number} score - Combined threat score
 * @returns {string} Threat level description
 */
function getThreatLevel(score) {
    if (score >= 800) return 'LOW';
    if (score >= 600) return 'MEDIUM';
    if (score >= 400) return 'HIGH';
    return 'CRITICAL';
}

/**
 * Generate detailed breakdown section
 * @param {Object} metricsData - Metrics data
 * @returns {string} Markdown formatted breakdown
 */
function generateBreakdown(metricsData) {
    const metrics = metricsData.metrics;
    
    return `
## Breakdown

### Revert Rate Analysis
• **Score**: ${metrics.revertRate.score}/300
• **Revert Rate**: ${(metrics.revertRate.revertRate * 100).toFixed(2)}%
• **Baseline Comparison**: ${(metrics.revertRate.baselineFailRate * 100).toFixed(2)}% baseline
• **Deviation**: ${(metrics.revertRate.deviation * 100).toFixed(2)}% from baseline

### Out-of-Gas Analysis
• **Score**: ${metrics.oog.score}/200
• **OOG Transactions**: ${metrics.oog.oogCount}/${metrics.oog.totalSuccessful}
• **OOG Rate**: ${(metrics.oog.oogRate * 100).toFixed(2)}%
• **Gas Limit**: ${metrics.oog.gasLimit.toLocaleString()}
• **Threshold**: ${metrics.oog.oogThreshold.toLocaleString()}

### Gas Usage Variance Analysis
• **Score**: ${metrics.gasVariance.score}/250
• **Average Gas**: ${metrics.gasVariance.avgGas.toLocaleString()}
• **Standard Deviation**: ${metrics.gasVariance.stdGas.toLocaleString()}
• **Baseline Std Dev**: ${metrics.gasVariance.baselineStdGas.toLocaleString()}
• **Variance Ratio**: ${metrics.gasVariance.varianceRatio.toFixed(2)}x baseline

### External Calls Analysis
• **Score**: ${metrics.externalCalls.score}/250
• **External Call Rate**: ${(metrics.externalCalls.externalCallRate * 100).toFixed(2)}%
• **External Call Functions**: ${metrics.externalCalls.externalCallFunctions.join(', ')}
• **Total Traces**: ${metrics.externalCalls.totalTraces}`;
}

/**
 * Generate recommendations based on scores
 * @param {Object} metricsData - Metrics data
 * @param {Object} mlScoreData - ML score data
 * @returns {string} Markdown formatted recommendations
 */
function generateRecommendations(metricsData, mlScoreData) {
    const recommendations = [];
    const metrics = metricsData.metrics;
    
    // Revert rate recommendations
    if (metrics.revertRate.score < 200) {
        recommendations.push('**High revert rate detected**: Review contract logic for potential issues causing frequent transaction failures.');
    }
    
    // OOG recommendations
    if (metrics.oog.score < 150) {
        recommendations.push('**Out-of-gas issues detected**: Optimize gas usage or increase gas limits for complex operations.');
    }
    
    // Gas variance recommendations
    if (metrics.gasVariance.score < 175) {
        recommendations.push('**High gas usage variance**: Consider standardizing gas usage patterns across similar operations.');
    }
    
    // External calls recommendations
    if (metrics.externalCalls.score < 175) {
        recommendations.push('**Frequent external calls detected**: Review external call patterns for potential security risks.');
    }
    
    // ML anomaly recommendations
    if (mlScoreData.ml_score < 600) {
        recommendations.push('**ML anomaly detection triggered**: Contract behavior deviates significantly from baseline patterns.');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('**No immediate concerns detected**: Contract behavior appears normal based on current analysis.');
    }
    
    return recommendations.map(rec => `1. ${rec}`).join('\n');
}

/**
 * Generate next steps section
 * @param {Object} combinedScore - Combined scoring information
 * @returns {string} Markdown formatted next steps
 */
function generateNextSteps(combinedScore) {
    const { combinedScore: score, threatLevel } = combinedScore;
    
    if (score >= 800) {
        return `1. **Continue monitoring**: Regular threat analysis recommended
2. **Document baseline**: Current behavior serves as good baseline
3. **Consider advanced analysis**: Implement additional security measures for production`;
    } else if (score >= 600) {
        return `1. **Address recommendations**: Implement suggested improvements
2. **Increase monitoring frequency**: More frequent analysis recommended
3. **Review contract logic**: Detailed code review suggested
4. **Test thoroughly**: Comprehensive testing before production deployment`;
    } else {
        return `1. **Immediate action required**: Address all identified issues
2. **Security audit recommended**: Professional security audit advised
3. **Refactor if necessary**: Consider contract redesign for critical issues
4. **Extensive testing**: Comprehensive testing and validation required
5. **Gradual deployment**: Consider phased rollout with monitoring`;
    }
}

/**
 * Generate the complete threat report
 * @param {Object} metricsData - Metrics data
 * @param {Object} mlScoreData - ML score data
 * @returns {string} Complete markdown report
 */
function generateReport(metricsData, mlScoreData) {
    const combinedScore = calculateCombinedScore(metricsData, mlScoreData);
    const threatLevel = getThreatLevel(combinedScore.combinedScore);
    
    const report = `# Threat Report

**Contract Address**: ${metricsData.contractAddress}
**Analysis Date**: ${new Date().toLocaleDateString()}
**Analysis Time**: ${new Date().toLocaleTimeString()}

## Executive Summary

- **Threat Score (Metrics)**: ${combinedScore.metricsScore}/1000
- **ML Score**: ${combinedScore.mlScore}/1000
- **Combined Score**: ${combinedScore.combinedScore}/1000
- **Overall Threat Level**: **${threatLevel}**

${generateBreakdown(metricsData)}

## ML Analysis

- **Raw Anomaly Score**: ${mlScoreData.raw_anomaly_score.toFixed(4)}
- **Interpretation**: ${mlScoreData.ml_score > 750 ? 'LOW' : mlScoreData.ml_score > 500 ? 'MEDIUM' : 'HIGH'} threat level
- **Model**: IsolationForest with 5% contamination
- **Features**: Gas usage patterns, failure rates, variance metrics

## Recommendations

${generateRecommendations(metricsData, mlScoreData)}

## Next Steps

${generateNextSteps({ combinedScore: combinedScore.combinedScore, threatLevel })}

---

*Report generated by Ethereum Smart Contract Threat Analysis MVP*
*Analysis completed at ${new Date().toISOString()}*`;

    return report;
}

/**
 * Main function to generate and save the report
 */
function main() {
    try {
        console.log('Loading data for report generation...');
        const { metricsData, mlScoreData } = loadReportData();
        
        console.log('Generating threat analysis report...');
        const report = generateReport(metricsData, mlScoreData);
        
        // Write report to file
        fs.writeFileSync('report.md', report);
        
        console.log('Report generated successfully!');
        console.log('Report saved to report.md');
        
        // Also print a summary to console
        const combinedScore = calculateCombinedScore(metricsData, mlScoreData);
        const threatLevel = getThreatLevel(combinedScore.combinedScore);
        
        console.log('\n=== Report Summary ===');
        console.log(`Threat Level: ${threatLevel}`);
        console.log(`Combined Score: ${combinedScore.combinedScore}/1000`);
        console.log(`Metrics Score: ${combinedScore.metricsScore}/1000`);
        console.log(`ML Score: ${combinedScore.mlScore}/1000`);
        
    } catch (error) {
        console.error('Report generation failed:', error.message);
        process.exit(1);
    }
}

// Run the script if called directly
if (require.main === module) {
    main();
}

module.exports = {
    loadReportData,
    calculateCombinedScore,
    getThreatLevel,
    generateBreakdown,
    generateRecommendations,
    generateNextSteps,
    generateReport
}; 