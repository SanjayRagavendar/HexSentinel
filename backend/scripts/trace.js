const { ethers } = require("hardhat");
const fs = require('fs');

/**
 * Deploy SimpleVault contract
 * @returns {Promise<Object>} Deployed contract and signer
 */
async function deployContract() {
    console.log("Deploying SimpleVault contract...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    const SimpleVault = await ethers.getContractFactory("SimpleVault");
    const vault = await SimpleVault.deploy();
    await vault.waitForDeployment();
    
    const vaultAddress = await vault.getAddress();
    console.log("SimpleVault deployed to:", vaultAddress);
    
    return { vault, deployer, vaultAddress };
}

/**
 * Execute a transaction and capture trace data
 * @param {Object} vault - Contract instance
 * @param {Object} signer - Signer instance
 * @param {string} functionName - Function to call
 * @param {Array} args - Function arguments
 * @returns {Promise<Object>} Trace data
 */
async function executeTransaction(vault, signer, functionName, args = []) {
    try {
        console.log(`Executing ${functionName} with args:`, args);
        
        // Get initial gas estimate
        const gasEstimate = await vault[functionName].estimateGas(...args);
        
        // Execute transaction
        const tx = await vault[functionName](...args);
        const receipt = await tx.wait();
        
        return {
            functionName,
            args,
            success: true,
            gasUsed: receipt.gasUsed.toString(),
            gasEstimate: gasEstimate.toString(),
            reverted: false,
            error: null,
            blockNumber: receipt.blockNumber,
            transactionHash: receipt.hash
        };
        
    } catch (error) {
        console.log(`Transaction failed: ${functionName}`, error.message);
        
        return {
            functionName,
            args,
            success: false,
            gasUsed: "0",
            gasEstimate: "0",
            reverted: true,
            error: error.message,
            blockNumber: null,
            transactionHash: null
        };
    }
}

/**
 * Generate test scenarios for the contract
 * @param {Object} vault - Contract instance
 * @param {Object} signer - Signer instance
 * @returns {Array} Array of test scenarios
 */
function generateTestScenarios(vault, signer) {
    const scenarios = [];
    
    // Test store function with different values (will have varying gas usage)
    for (let i = 1; i <= 10; i++) {
        scenarios.push({
            functionName: 'store',
            args: [i],
            description: `store(${i}) - should vary gas usage`
        });
    }
    
    // Test riskyFunction with different seeds (some will revert)
    for (let i = 1; i <= 10; i++) {
        scenarios.push({
            functionName: 'riskyFunction',
            args: [i],
            description: `riskyFunction(${i}) - may revert randomly`
        });
    }
    
    // Test deposit with different amounts
    scenarios.push({
        functionName: 'deposit',
        args: [],
        value: ethers.parseEther("0.5"),
        description: 'deposit(0.5 ETH) - valid deposit'
    });
    
    scenarios.push({
        functionName: 'deposit',
        args: [],
        value: ethers.parseEther("0.05"),
        description: 'deposit(0.05 ETH) - should revert (too small)'
    });
    
    scenarios.push({
        functionName: 'deposit',
        args: [],
        value: ethers.parseEther("2000"),
        description: 'deposit(2000 ETH) - should revert (too large)'
    });
    
    // Test withdraw without balance (should revert)
    scenarios.push({
        functionName: 'withdraw',
        args: [ethers.parseEther("1")],
        description: 'withdraw(1 ETH) - should revert (no balance)'
    });
    
    return scenarios;
}

/**
 * Execute all test scenarios and collect traces
 * @param {Object} vault - Contract instance
 * @param {Object} signer - Signer instance
 * @returns {Promise<Array>} Array of trace results
 */
async function collectTraces(vault, signer) {
    const scenarios = generateTestScenarios(vault, signer);
    const traces = [];
    
    console.log(`Executing ${scenarios.length} test scenarios...`);
    
    for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        console.log(`\n[${i + 1}/${scenarios.length}] ${scenario.description}`);
        
        try {
            let result;
            
            if (scenario.value) {
                // Handle payable functions
                const tx = await vault[scenario.functionName](...scenario.args, {
                    value: scenario.value
                });
                const receipt = await tx.wait();
                
                result = {
                    functionName: scenario.functionName,
                    args: scenario.args,
                    value: scenario.value.toString(),
                    success: true,
                    gasUsed: receipt.gasUsed.toString(),
                    gasEstimate: "0", // Hard to estimate with value
                    reverted: false,
                    error: null,
                    blockNumber: receipt.blockNumber,
                    transactionHash: receipt.hash
                };
            } else {
                result = await executeTransaction(vault, signer, scenario.functionName, scenario.args);
            }
            
            traces.push({
                ...result,
                scenarioIndex: i,
                description: scenario.description,
                timestamp: new Date().toISOString()
            });
            
            // Add delay between transactions to avoid nonce issues
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`Error in scenario ${i + 1}:`, error.message);
            
            traces.push({
                functionName: scenario.functionName,
                args: scenario.args,
                value: scenario.value?.toString() || "0",
                success: false,
                gasUsed: "0",
                gasEstimate: "0",
                reverted: true,
                error: error.message,
                blockNumber: null,
                transactionHash: null,
                scenarioIndex: i,
                description: scenario.description,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    return traces;
}

/**
 * Main function to run trace collection
 */
async function main() {
    try {
        console.log("Starting trace collection...");
        
        // Deploy contract
        const { vault, deployer, vaultAddress } = await deployContract();
        
        // Collect traces
        const traces = await collectTraces(vault, deployer);
        
        // Prepare output data
        const output = {
            contractAddress: vaultAddress,
            deployerAddress: deployer.address,
            timestamp: new Date().toISOString(),
            totalTraces: traces.length,
            successfulTraces: traces.filter(t => t.success).length,
            failedTraces: traces.filter(t => !t.success).length,
            traces: traces
        };
        
        // Write to file
        fs.writeFileSync('raw-traces.json', JSON.stringify(output, null, 2));
        
        console.log('\nTrace collection completed successfully!');
        console.log(`- Total traces: ${output.totalTraces}`);
        console.log(`- Successful: ${output.successfulTraces}`);
        console.log(`- Failed: ${output.failedTraces}`);
        console.log('Results saved to raw-traces.json');
        
    } catch (error) {
        console.error('Trace collection failed:', error);
        process.exit(1);
    }
}

// Run the script if called directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    deployContract,
    executeTransaction,
    collectTraces,
    generateTestScenarios
}; 