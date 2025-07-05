// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AuditRegistry is Ownable {
    
    constructor(address initialOwner) Ownable(initialOwner) {}

    enum ThreatLevel { Safe, Low, Medium, High, Critical }

    struct AuditReport {
        address contractAudited;      
        ThreatLevel threatLevel;      // Threat level enum
        uint256 threatScore;          // Raw threat score (0–81 or normalized to 500)
        string ipfsCid;               // IPFS CID of the report (Web3.Storage)
        uint256 timestamp;            // Timestamp of report submission
        uint8 auditVersion;         // Version of the audit report
    }
    
    uint256 public reportCount;
    mapping(uint256 => AuditReport) public reports;
    mapping(address => uint256[]) public reportsByContract;

    event ReportSubmitted(
        uint256 indexed reportId,
        address indexed contractAudited,
        address indexed auditor,
        ThreatLevel level,
        uint256 score,
        string cid,
        uint8 version
    );

    function submitReport(
        address _contractAudited,
        ThreatLevel _level,
        uint256 _threatScore,
        string memory _cid,
        uint8 _auditVersion
    ) external onlyOwner {
        require(_contractAudited != address(0), "Invalid contract address");
        require(bytes(_cid).length > 0, "IPFS CID cannot be empty");
        require(_threatScore <= 1000, "Threat score exceeds maximum");

        reports[reportCount] = AuditReport({
        contractAudited: _contractAudited,
        threatLevel: _level,
        threatScore: _threatScore,
        ipfsCid: _cid,
        timestamp: block.timestamp,
        auditVersion: _auditVersion
    });
        reportsByContract[_contractAudited].push(reportCount);

        emit ReportSubmitted(
            reportCount,
            _contractAudited,
            msg.sender,
            _level,
            _threatScore,
            _cid,
            _auditVersion
        );

        reportCount++;
    }

    function getReportsByContract(address auditedContract) external view returns (uint256[] memory) {
        require(auditedContract != address(0), "Invalid contract address");
        return reportsByContract[auditedContract];
    }

    function getLastTenReports() external view returns (uint256[] memory) {
        uint256 totalReports = reportCount;
        if (totalReports == 0) {
            return new uint256[](0);
        }
        
        uint256 returnCount = totalReports > 10 ? 10 : totalReports;
        uint256[] memory lastReports = new uint256[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            lastReports[i] = totalReports - returnCount + i;
        }
        
        return lastReports;
    }

    function isContractAudited(address contractAddress) external view returns (bool) {
        return reportsByContract[contractAddress].length > 0;
    }

    function getLatestReport(address contractAddress) external view returns (AuditReport memory) {
        uint256[] memory reportIds = reportsByContract[contractAddress];
        require(reportIds.length > 0, "No audit reports found for this contract");
        
        uint256 latestReportId = reportIds[reportIds.length - 1];
        return reports[latestReportId];
    }
}
