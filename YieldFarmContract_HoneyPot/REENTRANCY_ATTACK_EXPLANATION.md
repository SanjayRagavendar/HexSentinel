# Reentrancy Attack Explanation

## The Vulnerability in YieldFarmVault

The `claimRewards()` function in YieldFarmVault contains a classic reentrancy vulnerability:

```solidity
function claimRewards() public {
    require(stakeBalance[msg.sender] > 0, "Nothing to claim");          //  CHECK
    
    uint256 reward = stakeBalance[msg.sender] * 110 / 100;             // Calculate reward
    
    (bool sent, ) = msg.sender.call{value: reward}("");               //  EXTERNAL INTERACTION
    require(sent, "Transfer failed");
    
    stakeBalance[msg.sender] = 0;                                      //  EFFECT (too late!)
}
```

**The Problem**: This violates the **Checks-Effects-Interactions (CEI)** pattern by:
1. Making an external call (`msg.sender.call`) BEFORE
2. Updating the state (`stakeBalance[msg.sender] = 0`)

## How the Attack Works

### Step-by-Step Attack Flow:

1. **Attacker deploys MaliciousReentrancy contract**
2. **Attacker calls `attack()` with some ETH (e.g., 0.1 ETH)**
3. **MaliciousReentrancy stakes 0.1 ETH in YieldFarmVault**
4. **MaliciousReentrancy calls `claimRewards()` on YieldFarmVault**

### The Reentrancy Loop:

```
YieldFarmVault.claimRewards() execution:
├─ Check: stakeBalance[malicious] = 0.1 ETH ✅
├─ Calculate: reward = 0.1 * 110/100 = 0.11 ETH
├─ Send ETH: malicious.call{value: 0.11 ETH}("")
│  │
│  └─ This triggers MaliciousReentrancy.receive()
│     ├─ attackCount < maxAttacks? YES (0 < 3)
│     ├─ stakeBalance still 0.1 ETH? YES (not reset yet!)
│     └─ Call YieldFarmVault.claimRewards() AGAIN!
│        │
│        └─ YieldFarmVault.claimRewards() execution #2:
│           ├─ Check: stakeBalance[malicious] = 0.1 ETH ✅ (still!)
│           ├─ Calculate: reward = 0.11 ETH
│           ├─ Send ETH: malicious.call{value: 0.11 ETH}("")
│           │  │
│           │  └─ MaliciousReentrancy.receive() #2
│           │     ├─ attackCount < maxAttacks? YES (1 < 3)
│           │     └─ Call claimRewards() AGAIN!
│           │        │
│           │        └─ (This continues until maxAttacks reached)
│           │
│           └─ Finally sets: stakeBalance[malicious] = 0
│
└─ Finally sets: stakeBalance[malicious] = 0 (but already done by inner call)
```

### Attack Result:

- **Attacker staked**: 0.1 ETH
- **Attacker received**: 0.11 ETH × 3 = **0.33 ETH**
- **Attacker profit**: 0.33 - 0.1 = **0.23 ETH** (230% return instead of 10%!)
- **Vault lost**: 0.23 ETH more than it should have

## Why the Attack Succeeds

1. **State Not Updated**: `stakeBalance[msg.sender] = 0` happens AFTER the external call
2. **Reentrancy Possible**: The `.call()` allows the malicious contract to execute code
3. **Same State Reused**: Each reentrant call sees the same non-zero stake balance
4. **Multiple Payouts**: The attacker gets paid multiple times for the same stake

## Code Analysis

### Vulnerable Pattern:
```solidity
// BAD: External call before state change
(bool sent, ) = msg.sender.call{value: reward}("");  // External call first
stakeBalance[msg.sender] = 0;                        // State change second
```

### Secure Pattern (CEI):
```solidity
// GOOD: State change before external call
stakeBalance[msg.sender] = 0;                        // Effect first
(bool sent, ) = msg.sender.call{value: reward}("");  // Interaction last
```

### Or Use Reentrancy Guard:
```solidity
bool private locked;

modifier noReentrant() {
    require(!locked, "No reentrancy");
    locked = true;
    _;
    locked = false;
}

function claimRewards() public noReentrant { ... }
```

## Attack Demonstration

The test suite includes a working demonstration:

```javascript
it("Should demonstrate successful reentrancy attack", async function () {
    // Deploy malicious contract
    const maliciousContract = await MaliciousReentrancy.deploy(vault.target);
    
    // Execute attack with 0.1 ETH
    await maliciousContract.attack({ value: ethers.parseEther("0.1") });
    
    // Attacker received much more than 110% return
    const finalBalance = await ethers.provider.getBalance(maliciousContract.target);
    expect(finalBalance).to.be.greaterThan(ethers.parseEther("0.11")); // More than 110%
});
```

## Real-World Impact

- **For Attackers**: Can drain significantly more funds than legitimately owed
- **For Normal Users**: Contract funds get depleted, making their claims fail
- **For Contract Owner**: Even the owner's exit scam becomes less profitable
- **For Protocol**: Complete loss of user trust and funds

This reentrancy vulnerability makes an already malicious honey pot even more dangerous, as sophisticated attackers can exploit it before the owner can perform their exit scam.
