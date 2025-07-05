# YieldFarmVault Honey Pot Analysis

This directory contains a comprehensive test suite for analyzing the `YieldFarmVault` smart contract, which is designed as a honey pot to trap unsuspecting users.

## What is a Honey Pot Contract?

A honey pot contract is a malicious smart contract that appears to offer profitable opportunities (like high yield farming returns) but contains hidden mechanisms that prevent users from withdrawing their funds or allow the contract owner to steal deposited funds.

## YieldFarmVault Honey Pot Mechanisms

### 1. **False Profit Promise**
- Claims to offer 110% returns on staked ETH
- Uses fake audit claims ("Audited by MythX, CertiK") to build false legitimacy
- Appears to be a legitimate DeFi yield farming vault

### 2. **Owner Backdoor (`drainVault`)**
- Owner can withdraw ALL funds from the contract at any time
- Users have no protection against exit scams
- This is the primary honey pot mechanism

### 3. **Reentrancy Vulnerability**
- The `claimRewards()` function is vulnerable to reentrancy attacks
- External call happens before state change (violates CEI pattern)
- Malicious contracts can drain more funds than they deserve

### 4. **Economic Impossibility**
- The contract cannot sustain 110% returns for multiple users
- Limited initial funding makes the promised returns mathematically impossible
- Later users will be unable to claim rewards even if owner doesn't drain

### 5. **Failed Transaction Traps**
- Users lose their stake balance even when reward claims fail
- Creates a "first come, first served" scenario

## Test Coverage

The test suite covers:

### Basic Functionality Tests
- Contract deployment and initialization
- Staking functionality 
- Basic access controls

### Honey Pot Mechanism Tests
- Owner exit scam scenarios
- Economic impossibility demonstrations
- Reentrancy attack simulations
- Failed transaction behaviors

### Security Vulnerability Analysis
- Reentrancy vulnerability demonstration with malicious contract
- Financial analysis showing unsustainable economics
- Documentation of all identified attack vectors

## Running the Tests

```bash
npm install
npx hardhat test
```

## Key Findings

1. **Primary Risk**: Owner can steal all funds via `drainVault()`
2. **Secondary Risk**: Reentrancy vulnerability allows advanced attackers to drain funds
3. **Economic Risk**: Promised returns are mathematically impossible to sustain
4. **User Risk**: Normal users will lose their staked ETH with no recourse

## Educational Purpose

This test suite serves as an educational example of:
- How to identify honey pot contracts
- Common smart contract vulnerabilities
- Why thorough security audits are essential
- The importance of decentralized, trustless protocols

⚠️ **Warning**: Never interact with suspicious contracts promising unrealistic returns. Always verify audit claims and examine contract code before depositing funds.

## Files

- `contracts/YieldFarmVault.sol` - The honey pot contract
- `contracts/MaliciousReentrancy.sol` - Attack contract demonstrating reentrancy
- `test/YieldFarmVault.js` - Comprehensive test suite
- `README.md` - This documentation
