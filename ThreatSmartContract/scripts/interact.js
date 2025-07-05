const { ethers } = require("hardhat");

async function main() {
  // Your deployed contract address on Polygon Amoy
  const contractAddress = "0x65a4d19418dFe8c134eA0b8fFaA32C7621F7E592";
  
  if (contractAddress === "YOUR_DEPLOYED_CONTRACT_ADDRESS") {
    console.log("Please update the contractAddress variable with your deployed contract address");
    return;
  }

  // Get the contract factory and attach to deployed instance
  const AuditRegistry = await ethers.getContractFactory("AuditRegistry");
  const auditRegistry = AuditRegistry.attach(contractAddress);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Interacting with contract as:", signer.address);

  try {
    // Check current owner
    const owner = await auditRegistry.owner();
    console.log("Contract owner:", owner);

    // Check current report count
    const reportCount = await auditRegistry.reportCount();
    console.log("Current report count:", reportCount.toString());

    // Example: Submit a test report (only works if you're the owner)
    const testContractAddress = "0x742d35cc6561c90e3d6a3c1234567890abcdef12";
    const testCid = "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o";
    
    console.log("\nSubmitting test report...");
    const tx = await auditRegistry.submitReport(
      testContractAddress,
      1, // ThreatLevel.Low
      250,
      testCid,
      1
    );

    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for transaction confirmation...");
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);

    // Check updated report count
    const newReportCount = await auditRegistry.reportCount();
    console.log("New report count:", newReportCount.toString());

    // Get the submitted report
    const report = await auditRegistry.reports(newReportCount - 1n);
    console.log("\nSubmitted report details:");
    console.log("Contract audited:", report.contractAudited);
    console.log("Threat level:", report.threatLevel);
    console.log("Threat score:", report.threatScore.toString());
    console.log("IPFS CID:", report.ipfsCid);
    console.log("Timestamp:", new Date(Number(report.timestamp) * 1000).toISOString());
    console.log("Audit version:", report.auditVersion);

  } catch (error) {
    console.error("Error interacting with contract:", error.message);
    
    if (error.message.includes("OwnableUnauthorizedAccount")) {
      console.log("\nNote: You can only submit reports if you're the contract owner.");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
