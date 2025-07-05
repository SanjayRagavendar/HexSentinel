const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("AuditRegistry", function () {
  // We define a fixture to reuse the same setup in every test.
  async function deployAuditRegistryFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, auditor, otherAccount] = await ethers.getSigners();

    const AuditRegistry = await ethers.getContractFactory("AuditRegistry");
    const auditRegistry = await AuditRegistry.deploy(owner.address);

    // Sample contract address for testing - using ethers.getAddress for proper checksumming
    const sampleContractAddress = ethers.getAddress("0x742d35cc6561c90e3d6a3c1234567890abcdef12");
    const sampleCid = "QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o";

    return { 
      auditRegistry, 
      owner, 
      auditor, 
      otherAccount, 
      sampleContractAddress, 
      sampleCid 
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { auditRegistry, owner } = await loadFixture(deployAuditRegistryFixture);
      expect(await auditRegistry.owner()).to.equal(owner.address);
    });

    it("Should initialize reportCount to 0", async function () {
      const { auditRegistry } = await loadFixture(deployAuditRegistryFixture);
      expect(await auditRegistry.reportCount()).to.equal(0);
    });
  });

  describe("Submit Report", function () {
    describe("Validations", function () {
      it("Should revert if called by non-owner", async function () {
        const { auditRegistry, otherAccount, sampleContractAddress, sampleCid } = 
          await loadFixture(deployAuditRegistryFixture);

        await expect(
          auditRegistry.connect(otherAccount).submitReport(
            sampleContractAddress,
            1, // ThreatLevel.Low
            250,
            sampleCid,
            1
          )
        ).to.be.revertedWithCustomError(auditRegistry, "OwnableUnauthorizedAccount");
      });

      it("Should revert with invalid contract address", async function () {
        const { auditRegistry, sampleCid } = await loadFixture(deployAuditRegistryFixture);

        await expect(
          auditRegistry.submitReport(
            ethers.ZeroAddress,
            1, // ThreatLevel.Low
            250,
            sampleCid,
            1
          )
        ).to.be.revertedWith("Invalid contract address");
      });

      it("Should revert with empty IPFS CID", async function () {
        const { auditRegistry, sampleContractAddress } = await loadFixture(deployAuditRegistryFixture);

        await expect(
          auditRegistry.submitReport(
            sampleContractAddress,
            1, // ThreatLevel.Low
            250,
            "",
            1
          )
        ).to.be.revertedWith("IPFS CID cannot be empty");
      });

      it("Should revert with threat score exceeding maximum", async function () {
        const { auditRegistry, sampleContractAddress, sampleCid } = 
          await loadFixture(deployAuditRegistryFixture);

        await expect(
          auditRegistry.submitReport(
            sampleContractAddress,
            1, // ThreatLevel.Low
            1001, // Exceeds max of 1000
            sampleCid,
            1
          )
        ).to.be.revertedWith("Threat score exceeds maximum");
      });
    });

    describe("Successful Submission", function () {
      it("Should submit report successfully", async function () {
        const { auditRegistry, sampleContractAddress, sampleCid } = 
          await loadFixture(deployAuditRegistryFixture);

        await expect(
          auditRegistry.submitReport(
            sampleContractAddress,
            1, // ThreatLevel.Low
            250,
            sampleCid,
            1
          )
        ).not.to.be.reverted;
      });

      it("Should increment reportCount", async function () {
        const { auditRegistry, sampleContractAddress, sampleCid } = 
          await loadFixture(deployAuditRegistryFixture);

        await auditRegistry.submitReport(
          sampleContractAddress,
          1, // ThreatLevel.Low
          250,
          sampleCid,
          1
        );

        expect(await auditRegistry.reportCount()).to.equal(1);
      });

      it("Should store report data correctly", async function () {
        const { auditRegistry, sampleContractAddress, sampleCid } = 
          await loadFixture(deployAuditRegistryFixture);

        await auditRegistry.submitReport(
          sampleContractAddress,
          2, // ThreatLevel.Medium
          500,
          sampleCid,
          1
        );

        const report = await auditRegistry.reports(0);
        expect(report.contractAudited).to.equal(sampleContractAddress);
        expect(report.threatLevel).to.equal(2);
        expect(report.threatScore).to.equal(500);
        expect(report.ipfsCid).to.equal(sampleCid);
        expect(report.auditVersion).to.equal(1);
        expect(report.timestamp).to.be.gt(0);
      });

      it("Should emit ReportSubmitted event", async function () {
        const { auditRegistry, owner, sampleContractAddress, sampleCid } = 
          await loadFixture(deployAuditRegistryFixture);

        await expect(
          auditRegistry.submitReport(
            sampleContractAddress,
            3, // ThreatLevel.High
            750,
            sampleCid,
            1
          )
        ).to.emit(auditRegistry, "ReportSubmitted")
         .withArgs(0, sampleContractAddress, owner.address, 3, 750, sampleCid, 1);
      });

      it("Should allow multiple reports for same contract", async function () {
        const { auditRegistry, sampleContractAddress, sampleCid } = 
          await loadFixture(deployAuditRegistryFixture);

        // Submit first report
        await auditRegistry.submitReport(
          sampleContractAddress,
          1, // ThreatLevel.Low
          250,
          sampleCid,
          1
        );

        // Submit second report for same contract
        await auditRegistry.submitReport(
          sampleContractAddress,
          2, // ThreatLevel.Medium
          500,
          "QmNewCidForSecondReport123456789",
          2
        );

        expect(await auditRegistry.reportCount()).to.equal(2);
        
        const reportIds = await auditRegistry.getReportsByContract(sampleContractAddress);
        expect(reportIds.length).to.equal(2);
        expect(reportIds[0]).to.equal(0);
        expect(reportIds[1]).to.equal(1);
      });
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      const { auditRegistry, sampleContractAddress, sampleCid } = 
        await loadFixture(deployAuditRegistryFixture);
      
      // Submit multiple reports for testing
      await auditRegistry.submitReport(
        sampleContractAddress,
        1, // ThreatLevel.Low
        250,
        sampleCid,
        1
      );
      
      await auditRegistry.submitReport(
        ethers.getAddress("0x123456789abcdef123456789abcdef123456789a"),
        2, // ThreatLevel.Medium
        500,
        "QmSecondCid123456789",
        1
      );
    });

    describe("getReportsByContract", function () {
      it("Should return reports for specific contract", async function () {
        const { auditRegistry, sampleContractAddress } = 
          await loadFixture(deployAuditRegistryFixture);
        
        await auditRegistry.submitReport(
          sampleContractAddress,
          1,
          250,
          "QmTestCid",
          1
        );

        const reports = await auditRegistry.getReportsByContract(sampleContractAddress);
        expect(reports.length).to.equal(1);
        expect(reports[0]).to.equal(0);
      });

      it("Should revert with invalid contract address", async function () {
        const { auditRegistry } = await loadFixture(deployAuditRegistryFixture);

        await expect(
          auditRegistry.getReportsByContract(ethers.ZeroAddress)
        ).to.be.revertedWith("Invalid contract address");
      });

      it("Should return empty array for contract with no reports", async function () {
        const { auditRegistry } = await loadFixture(deployAuditRegistryFixture);

        const reports = await auditRegistry.getReportsByContract(
          ethers.getAddress("0x1234567890123456789012345678901234567890")
        );
        expect(reports.length).to.equal(0);
      });
    });

    describe("isContractAudited", function () {
      it("Should return true for audited contract", async function () {
        const { auditRegistry, sampleContractAddress } = 
          await loadFixture(deployAuditRegistryFixture);
        
        await auditRegistry.submitReport(
          sampleContractAddress,
          1,
          250,
          "QmTestCid",
          1
        );

        expect(await auditRegistry.isContractAudited(sampleContractAddress)).to.be.true;
      });

      it("Should return false for non-audited contract", async function () {
        const { auditRegistry } = await loadFixture(deployAuditRegistryFixture);

        expect(
          await auditRegistry.isContractAudited(ethers.getAddress("0x9876543210987654321098765432109876543210"))
        ).to.be.false;
      });
    });

    describe("getLatestReport", function () {
      it("Should return latest report for contract", async function () {
        const { auditRegistry, sampleContractAddress } = 
          await loadFixture(deployAuditRegistryFixture);
        
        // Submit first report
        await auditRegistry.submitReport(
          sampleContractAddress,
          1,
          250,
          "QmFirstCid",
          1
        );
        
        // Submit second report (latest)
        await auditRegistry.submitReport(
          sampleContractAddress,
          3,
          750,
          "QmLatestCid",
          2
        );

        const latestReport = await auditRegistry.getLatestReport(sampleContractAddress);
        expect(latestReport.threatLevel).to.equal(3);
        expect(latestReport.threatScore).to.equal(750);
        expect(latestReport.ipfsCid).to.equal("QmLatestCid");
        expect(latestReport.auditVersion).to.equal(2);
      });

      it("Should revert for contract with no reports", async function () {
        const { auditRegistry } = await loadFixture(deployAuditRegistryFixture);

        await expect(
          auditRegistry.getLatestReport(ethers.getAddress("0x1111111111111111111111111111111111111111"))
        ).to.be.revertedWith("No audit reports found for this contract");
      });
    });

    describe("getLastTenReports", function () {
      it("Should return empty array when no reports exist", async function () {
        const { auditRegistry } = await loadFixture(deployAuditRegistryFixture);

        const lastReports = await auditRegistry.getLastTenReports();
        expect(lastReports.length).to.equal(0);
      });

      it("Should return correct report IDs when less than 10 reports", async function () {
        const { auditRegistry, sampleContractAddress } = 
          await loadFixture(deployAuditRegistryFixture);
        
        // Submit 3 reports
        for (let i = 0; i < 3; i++) {
          await auditRegistry.submitReport(
            sampleContractAddress,
            1,
            250 + i,
            `QmCid${i}`,
            1
          );
        }

        const lastReports = await auditRegistry.getLastTenReports();
        expect(lastReports.length).to.equal(3);
        expect(lastReports[0]).to.equal(0);
        expect(lastReports[1]).to.equal(1);
        expect(lastReports[2]).to.equal(2);
      });

      it("Should return last 10 reports when more than 10 exist", async function () {
        const { auditRegistry, sampleContractAddress } = 
          await loadFixture(deployAuditRegistryFixture);
        
        // Submit 15 reports
        for (let i = 0; i < 15; i++) {
          await auditRegistry.submitReport(
            sampleContractAddress,
            1,
            250 + i,
            `QmCid${i}`,
            1
          );
        }

        const lastReports = await auditRegistry.getLastTenReports();
        expect(lastReports.length).to.equal(10);
        expect(lastReports[0]).to.equal(5); // Should start from report ID 5
        expect(lastReports[9]).to.equal(14); // Should end at report ID 14
      });
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum threat score", async function () {
      const { auditRegistry, sampleContractAddress, sampleCid } = 
        await loadFixture(deployAuditRegistryFixture);

      await expect(
        auditRegistry.submitReport(
          sampleContractAddress,
          4, // ThreatLevel.Critical
          1000, // Maximum allowed
          sampleCid,
          1
        )
      ).not.to.be.reverted;
    });

    it("Should handle minimum threat score", async function () {
      const { auditRegistry, sampleContractAddress, sampleCid } = 
        await loadFixture(deployAuditRegistryFixture);

      await expect(
        auditRegistry.submitReport(
          sampleContractAddress,
          0, // ThreatLevel.Safe
          0, // Minimum score
          sampleCid,
          1
        )
      ).not.to.be.reverted;
    });

    it("Should handle all threat levels", async function () {
      const { auditRegistry, sampleContractAddress, sampleCid } = 
        await loadFixture(deployAuditRegistryFixture);

      const threatLevels = [0, 1, 2, 3, 4]; // Safe, Low, Medium, High, Critical
      
      for (let i = 0; i < threatLevels.length; i++) {
        await expect(
          auditRegistry.submitReport(
            ethers.getAddress(`0x${'1'.repeat(39)}${i}`), // Different contract addresses
            threatLevels[i],
            i * 200,
            `${sampleCid}${i}`,
            1
          )
        ).not.to.be.reverted;
      }
    });
  });
});
