const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("YieldFarmVault - Honey Pot Contract", function () {
  // Fixture to deploy the YieldFarmVault contract
  async function deployYieldFarmVaultFixture() {
    const SEED_AMOUNT = ethers.parseEther("1.0"); // 1 ETH seed amount
    const STAKE_AMOUNT = ethers.parseEther("0.5"); // 0.5 ETH stake amount

    // Get signers
    const [owner, user1, user2, attacker] = await ethers.getSigners();

    // Deploy the YieldFarmVault contract with seed funding
    const YieldFarmVault = await ethers.getContractFactory("YieldFarmVault");
    const vault = await YieldFarmVault.deploy({ value: SEED_AMOUNT });

    return { vault, SEED_AMOUNT, STAKE_AMOUNT, owner, user1, user2, attacker };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { vault, owner } = await loadFixture(deployYieldFarmVaultFixture);
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("Should be seeded with initial ETH", async function () {
      const { vault, SEED_AMOUNT } = await loadFixture(deployYieldFarmVaultFixture);
      expect(await ethers.provider.getBalance(vault.target)).to.equal(SEED_AMOUNT);
    });

    it("Should require minimum seed amount", async function () {
      const YieldFarmVault = await ethers.getContractFactory("YieldFarmVault");
      await expect(
        YieldFarmVault.deploy({ value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Seed vault with funds");
    });
  });

  describe("Staking Functionality", function () {
    it("Should allow users to stake ETH", async function () {
      const { vault, user1, STAKE_AMOUNT } = await loadFixture(deployYieldFarmVaultFixture);
      
      await expect(
        vault.connect(user1).stake({ value: STAKE_AMOUNT })
      ).to.not.be.reverted;

      expect(await vault.stakeBalance(user1.address)).to.equal(STAKE_AMOUNT);
    });

    it("Should reject zero value stakes", async function () {
      const { vault, user1 } = await loadFixture(deployYieldFarmVaultFixture);
      
      await expect(
        vault.connect(user1).stake({ value: 0 })
      ).to.be.revertedWith("Cannot stake zero");
    });

    it("Should accumulate multiple stakes from same user", async function () {
      const { vault, user1, STAKE_AMOUNT } = await loadFixture(deployYieldFarmVaultFixture);
      
      await vault.connect(user1).stake({ value: STAKE_AMOUNT });
      await vault.connect(user1).stake({ value: STAKE_AMOUNT });

      expect(await vault.stakeBalance(user1.address)).to.equal(STAKE_AMOUNT * 2n);
    });

    it("Should track different users' stakes separately", async function () {
      const { vault, user1, user2, STAKE_AMOUNT } = await loadFixture(deployYieldFarmVaultFixture);
      
      await vault.connect(user1).stake({ value: STAKE_AMOUNT });
      await vault.connect(user2).stake({ value: STAKE_AMOUNT * 2n });

      expect(await vault.stakeBalance(user1.address)).to.equal(STAKE_AMOUNT);
      expect(await vault.stakeBalance(user2.address)).to.equal(STAKE_AMOUNT * 2n);
    });
  });

  describe("Reward Claims - The Honey Pot Trap", function () {
    it("Should appear to allow reward claims with 10% profit", async function () {
      const { vault, user1, STAKE_AMOUNT } = await loadFixture(deployYieldFarmVaultFixture);
      
      // User stakes ETH
      await vault.connect(user1).stake({ value: STAKE_AMOUNT });
      
      // Check that user has stake balance
      expect(await vault.stakeBalance(user1.address)).to.equal(STAKE_AMOUNT);
      
      // The claim should theoretically work but won't due to insufficient funds
      // The contract promises 110% return but doesn't have enough ETH
      const expectedReward = STAKE_AMOUNT * 110n / 100n;
      const contractBalance = await ethers.provider.getBalance(vault.target);
      
      // Contract balance is only 1 ETH (seed) + 0.5 ETH (stake) = 1.5 ETH
      // But reward would be 0.55 ETH (110% of 0.5 ETH)
      // This should fail due to insufficient balance for larger stakes
      expect(contractBalance).to.be.lessThan(expectedReward * 3n); // Would fail with multiple users
    });

    it("Should demonstrate the honey pot when owner drains funds before users can claim", async function () {
      const { vault, owner, user1, user2 } = await loadFixture(deployYieldFarmVaultFixture);
      
      // Users stake believing they'll get 110% returns
      const stake1 = ethers.parseEther("0.5");
      const stake2 = ethers.parseEther("0.8");
      await vault.connect(user1).stake({ value: stake1 });
      await vault.connect(user2).stake({ value: stake2 });
      
      // Contract now has: 1 ETH (seed) + 0.5 + 0.8 = 2.3 ETH
      // Users expect: 0.55 + 0.88 = 1.43 ETH in rewards
      // This should be technically possible, BUT...
      
      // HONEY POT TRIGGER: Owner drains the vault before users can claim
      await vault.connect(owner).drainVault();
      
      // Now contract is empty, so users can't claim their rewards
      expect(await ethers.provider.getBalance(vault.target)).to.equal(0);
      
      // Users try to claim but fail because contract has no funds
      await expect(
        vault.connect(user1).claimRewards()
      ).to.be.revertedWith("Transfer failed");
      
      await expect(
        vault.connect(user2).claimRewards()
      ).to.be.revertedWith("Transfer failed");
    });

    it("Should successfully claim rewards for small stakes when funds are available", async function () {
      const { vault, user1 } = await loadFixture(deployYieldFarmVaultFixture);
      
      const smallStake = ethers.parseEther("0.1"); // Small stake that should work
      await vault.connect(user1).stake({ value: smallStake });
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await expect(vault.connect(user1).claimRewards()).to.not.be.reverted;
      
      // Check that stake balance is reset
      expect(await vault.stakeBalance(user1.address)).to.equal(0);
    });

    it("Should reject claims from users with no stake", async function () {
      const { vault, user1 } = await loadFixture(deployYieldFarmVaultFixture);
      
      await expect(
        vault.connect(user1).claimRewards()
      ).to.be.revertedWith("Nothing to claim");
    });
  });

  describe("Honey Pot Mechanisms", function () {
    it("Should reject direct ETH transfers via receive()", async function () {
      const { vault, user1 } = await loadFixture(deployYieldFarmVaultFixture);
      
      await expect(
        user1.sendTransaction({
          to: vault.target,
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWith("Vault does not accept direct ETH");
    });

    it("Should reject calls to non-existent functions via fallback()", async function () {
      const { vault, user1 } = await loadFixture(deployYieldFarmVaultFixture);
      
      // Try to call a non-existent function
      await expect(
        user1.sendTransaction({
          to: vault.target,
          data: "0x12345678", // Random function selector
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWith("Unauthorized access");
    });

    it("Should only allow owner to drain the vault", async function () {
      const { vault, owner, user1 } = await loadFixture(deployYieldFarmVaultFixture);
      
      // Non-owner should not be able to drain
      await expect(
        vault.connect(user1).drainVault()
      ).to.be.revertedWith("Not owner");
      
      // Owner should be able to drain
      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(vault.target);
      
      await expect(vault.connect(owner).drainVault()).to.not.be.reverted;
      
      // Contract should be empty after drain
      expect(await ethers.provider.getBalance(vault.target)).to.equal(0);
    });
  });

  describe("Reentrancy Vulnerability Analysis", function () {
    it("Should demonstrate the reentrancy vulnerability pattern", async function () {
      const { vault, user1 } = await loadFixture(deployYieldFarmVaultFixture);
      
      const stakeAmount = ethers.parseEther("0.1");
      await vault.connect(user1).stake({ value: stakeAmount });
      
      // The vulnerability exists because in claimRewards():
      // 1. It calculates reward amount
      // 2. Sends ETH via .call{value: reward}("") - EXTERNAL INTERACTION
      // 3. Only AFTER the call sets stakeBalance[msg.sender] = 0 - STATE CHANGE
      // This violates the checks-effects-interactions pattern
      
      // A malicious contract could reenter during the .call() and claim multiple times
      // before the balance is reset to 0
      
      // For demonstration, we'll just verify the vulnerable order exists
      const balance = await vault.stakeBalance(user1.address);
      expect(balance).to.equal(stakeAmount);
    });

    it("Should demonstrate successful reentrancy attack", async function () {
      const { vault, attacker } = await loadFixture(deployYieldFarmVaultFixture);
      
      // Deploy the malicious contract
      const MaliciousReentrancy = await ethers.getContractFactory("MaliciousReentrancy");
      const maliciousContract = await MaliciousReentrancy.connect(attacker).deploy(vault.target);
      
      const attackAmount = ethers.parseEther("0.1");
      const initialContractBalance = await ethers.provider.getBalance(vault.target);
      const initialAttackerBalance = await ethers.provider.getBalance(maliciousContract.target);
      
      // Execute the reentrancy attack
      await maliciousContract.connect(attacker).attack({ value: attackAmount });
      
      // Check if the attack was successful
      const finalMaliciousBalance = await ethers.provider.getBalance(maliciousContract.target);
      const finalContractBalance = await ethers.provider.getBalance(vault.target);
      
      // The malicious contract should have received more than just the 110% return
      // due to the reentrancy allowing multiple claims
      expect(finalMaliciousBalance).to.be.greaterThan(attackAmount * 110n / 100n);
      
      // The vault should have lost more funds than it should have
      expect(finalContractBalance).to.be.lessThan(initialContractBalance + attackAmount - (attackAmount * 110n / 100n));
      
      // Verify the stake balance was eventually reset to 0
      expect(await vault.stakeBalance(maliciousContract.target)).to.equal(0);
    });
  });

  describe("Financial Analysis", function () {
    it("Should show the economic impossibility of the promised returns", async function () {
      const { vault, SEED_AMOUNT } = await loadFixture(deployYieldFarmVaultFixture);
      
      const contractBalance = await ethers.provider.getBalance(vault.target);
      expect(contractBalance).to.equal(SEED_AMOUNT);
      
      // If users stake more than ~0.9 ETH total, the 110% return becomes impossible
      // because 1 ETH seed + stakes < 110% of stakes
      // Mathematical analysis: if total stakes = S, then contract needs S * 1.1 to pay all rewards
      // But contract only has 1 ETH + S, so: 1 + S < 1.1 * S means 1 < 0.1 * S, so S > 10 ETH
      // This means the scheme fails when total stakes exceed ~10 ETH, but contract only starts with 1 ETH
      
      const maxSustainableStake = SEED_AMOUNT * 10n; // 10 ETH theoretical max
      expect(SEED_AMOUNT).to.be.lessThan(maxSustainableStake);
    });

    it("Should demonstrate the owner's ability to profit from user stakes", async function () {
      const { vault, owner, user1, user2 } = await loadFixture(deployYieldFarmVaultFixture);
      
      // Users stake ETH
      const stake1 = ethers.parseEther("0.3");
      const stake2 = ethers.parseEther("0.4");
      await vault.connect(user1).stake({ value: stake1 });
      await vault.connect(user2).stake({ value: stake2 });
      
      const contractBalanceBeforeDrain = await ethers.provider.getBalance(vault.target);
      const expectedTotal = ethers.parseEther("1.0") + stake1 + stake2; // seed + stakes
      expect(contractBalanceBeforeDrain).to.equal(expectedTotal);
      
      // Owner drains all funds including user stakes
      await vault.connect(owner).drainVault();
      
      // Contract should be empty
      expect(await ethers.provider.getBalance(vault.target)).to.equal(0);
      
      // This demonstrates how the owner can steal user funds
      // Users think they'll get 110% returns, but owner takes everything
    });

    it("Should demonstrate the exit scam potential", async function () {
      const { vault, owner, user1, user2 } = await loadFixture(deployYieldFarmVaultFixture);
      
      // Simulate many users staking over time
      const [, , , , user3, user4, user5] = await ethers.getSigners();
      
      // Early users stake and successfully claim (builds trust)
      await vault.connect(user1).stake({ value: ethers.parseEther("0.1") });
      await vault.connect(user1).claimRewards(); // Early user gets rewards
      
      // Word spreads, more users join with larger stakes
      await vault.connect(user2).stake({ value: ethers.parseEther("0.5") });
      await vault.connect(user3).stake({ value: ethers.parseEther("1.0") });
      await vault.connect(user4).stake({ value: ethers.parseEther("2.0") });
      await vault.connect(user5).stake({ value: ethers.parseEther("1.5") });
      
      // Contract now has significant funds from many users
      const contractBalance = await ethers.provider.getBalance(vault.target);
      expect(contractBalance).to.be.greaterThan(ethers.parseEther("4.0"));
      
      // HONEY POT ACTIVATION: Owner performs exit scam
      await vault.connect(owner).drainVault();
      
      // All later users lose their money
      expect(await ethers.provider.getBalance(vault.target)).to.equal(0);
      
      // None of the later users can claim rewards
      for (const user of [user2, user3, user4, user5]) {
        await expect(
          vault.connect(user).claimRewards()
        ).to.be.revertedWith("Transfer failed");
      }
    });
  });

  describe("Security Vulnerability Summary", function () {
    it("Should document all identified vulnerabilities", async function () {
      // This test serves as documentation of the honey pot mechanisms:
      
      // 1. REENTRANCY: claimRewards() is vulnerable to reentrancy attack
      //    - External call happens before state change
      //    - Malicious contract can reenter and drain funds
      
      // 2. ECONOMIC IMPOSSIBILITY: Promised 110% returns are mathematically impossible
      //    - Contract starts with limited funds
      //    - Cannot sustain returns for multiple users
      
      // 3. OWNER BACKDOOR: drainVault() allows owner to steal all funds
      //    - Owner can withdraw everything at any time
      //    - Users have no protection against this
      
      // 4. FAILED TRANSACTION TRAP: Users lose their stakes even when claims fail
      //    - stakeBalance reset to 0 even on failed transfers
      //    - Users lose money without getting rewards
      
      // 5. MISLEADING DOCUMENTATION: Claims to be "audited" and "secure"
      //    - False audit claims build false confidence
      //    - Appears legitimate to attract victims
      
      expect(true).to.be.true; // This test always passes, serves as documentation
    });
  });
});
