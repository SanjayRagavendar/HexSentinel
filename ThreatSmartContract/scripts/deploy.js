const { ethers } = require("hardhat");

async function main() {
  console.log("Starting AuditRegistry deployment...");

  // Get the contract factory
  const AuditRegistry = await ethers.getContractFactory("AuditRegistry");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "MATIC");

  // Deploy the contract with the deployer as the initial owner
  console.log("Deploying AuditRegistry contract...");
  const auditRegistry = await AuditRegistry.deploy(deployer.address);

  // Wait for deployment to be mined
  await auditRegistry.waitForDeployment();

  const contractAddress = await auditRegistry.getAddress();
  console.log("AuditRegistry deployed to:", contractAddress);

  // Get network info
  const network = await ethers.provider.getNetwork();
  const networkName = network.name;
  const chainId = Number(network.chainId); // Convert BigInt to number

  // Display deployment summary
  console.log("\n--- Deployment Summary ---");
  console.log("Contract: AuditRegistry");
  console.log("Address:", contractAddress);
  console.log("Owner:", deployer.address);
  console.log("Network:", networkName);
  console.log("Chain ID:", chainId);

  // Save deployment information
  const deploymentInfo = {
    contractName: "AuditRegistry",
    address: contractAddress,
    owner: deployer.address,
    network: networkName,
    chainId: chainId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  // Write deployment info to file
  const fs = require('fs');
  if (!fs.existsSync('deployments')) {
    fs.mkdirSync('deployments');
  }
  
  const deploymentFileName = networkName === "unknown" ? 
    `chainId-${chainId}` : 
    networkName;
    
  fs.writeFileSync(
    `deployments/${deploymentFileName}-deployment.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\nDeployment info saved to: deployments/${deploymentFileName}-deployment.json`);

  // Instructions for verification
  console.log("\n--- Verification Instructions ---");
  console.log("To verify the contract on Polygonscan, run:");
  console.log(`npx hardhat verify --network polygonAmoy ${contractAddress} "${deployer.address}"`);
  console.log("\nMake sure you have POLYGONSCAN_API_KEY set in your .env file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
