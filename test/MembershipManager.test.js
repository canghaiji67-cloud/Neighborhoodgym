const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MembershipManager", function () {
  async function deployMembershipManagerFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const MembershipManager = await ethers.getContractFactory("MembershipManager");
    const membershipManager = await MembershipManager.deploy(owner.address);
    await membershipManager.waitForDeployment();
    return { membershipManager, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { membershipManager, owner } = await loadFixture(deployMembershipManagerFixture);
      expect(await membershipManager.owner()).to.equal(owner.address);
    });

    it("Should have correct price constants", async function () {
      const { membershipManager } = await loadFixture(deployMembershipManagerFixture);
      expect(await membershipManager.MONTHLY_PRICE()).to.equal(ethers.parseEther("0.01"));
      expect(await membershipManager.QUARTERLY_PRICE()).to.equal(ethers.parseEther("0.025"));
      expect(await membershipManager.YEARLY_PRICE()).to.equal(ethers.parseEther("0.08"));
    });
  });

  describe("Registration", function () {
    it("Should allow a user to register", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await expect(membershipManager.connect(user1).register())
        .to.emit(membershipManager, "MemberRegistered")
        .withArgs(user1.address);

      const info = await membershipManager.getMembershipInfo(user1.address);
      expect(info.isRegistered).to.be.true;
      expect(info.expiresAt).to.equal(0);
      expect(info.currentPlan).to.equal(0);
    });

    it("Should revert when registering twice", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();
      await expect(
        membershipManager.connect(user1).register()
      ).to.be.revertedWith("MembershipManager: already registered");
    });

    it("Should allow multiple users to register independently", async function () {
      const { membershipManager, user1, user2 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();
      await membershipManager.connect(user2).register();

      const info1 = await membershipManager.getMembershipInfo(user1.address);
      const info2 = await membershipManager.getMembershipInfo(user2.address);
      expect(info1.isRegistered).to.be.true;
      expect(info2.isRegistered).to.be.true;
    });
  });

  describe("Purchase Membership", function () {
    it("Should revert when not registered", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await expect(
        membershipManager.connect(user1).purchaseMembership(1, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("MembershipManager: not registered");
    });

    it("Should revert with invalid plan type 0", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();
      await expect(
        membershipManager.connect(user1).purchaseMembership(0, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("MembershipManager: invalid plan type");
    });

    it("Should revert with invalid plan type 4", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();
      await expect(
        membershipManager.connect(user1).purchaseMembership(4, { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("MembershipManager: invalid plan type");
    });

    it("Should revert with incorrect payment for monthly plan", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();
      await expect(
        membershipManager.connect(user1).purchaseMembership(1, { value: ethers.parseEther("0.02") })
      ).to.be.revertedWith("MembershipManager: incorrect payment amount");
    });

    it("Should revert with zero payment", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();
      await expect(
        membershipManager.connect(user1).purchaseMembership(1, { value: 0 })
      ).to.be.revertedWith("MembershipManager: incorrect payment amount");
    });

    it("Should purchase monthly membership successfully", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();

      const tx = await membershipManager.connect(user1).purchaseMembership(1, {
        value: ethers.parseEther("0.01"),
      });
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const info = await membershipManager.getMembershipInfo(user1.address);
      expect(info.isRegistered).to.be.true;
      expect(info.currentPlan).to.equal(1);
      expect(info.expiresAt).to.equal(BigInt(block.timestamp) + BigInt(30 * 86400));
    });

    it("Should purchase quarterly membership successfully", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();

      const tx = await membershipManager.connect(user1).purchaseMembership(2, {
        value: ethers.parseEther("0.025"),
      });
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const info = await membershipManager.getMembershipInfo(user1.address);
      expect(info.currentPlan).to.equal(2);
      expect(info.expiresAt).to.equal(BigInt(block.timestamp) + BigInt(90 * 86400));
    });

    it("Should purchase yearly membership successfully", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();

      const tx = await membershipManager.connect(user1).purchaseMembership(3, {
        value: ethers.parseEther("0.08"),
      });
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const info = await membershipManager.getMembershipInfo(user1.address);
      expect(info.currentPlan).to.equal(3);
      expect(info.expiresAt).to.equal(BigInt(block.timestamp) + BigInt(365 * 86400));
    });

    it("Should emit MembershipPurchased event with correct args", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();

      const price = ethers.parseEther("0.01");
      await expect(
        membershipManager.connect(user1).purchaseMembership(1, { value: price })
      ).to.emit(membershipManager, "MembershipPurchased");
    });

    it("Should extend membership when renewing before expiry", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();

      // Purchase monthly
      await membershipManager.connect(user1).purchaseMembership(1, {
        value: ethers.parseEther("0.01"),
      });
      const info1 = await membershipManager.getMembershipInfo(user1.address);

      // Renew with quarterly before expiry
      await membershipManager.connect(user1).purchaseMembership(2, {
        value: ethers.parseEther("0.025"),
      });
      const info2 = await membershipManager.getMembershipInfo(user1.address);

      // New expiry should be old expiry + 90 days
      expect(info2.expiresAt).to.equal(info1.expiresAt + BigInt(90 * 86400));
      expect(info2.currentPlan).to.equal(2);
    });

    it("Should start from current time when membership expired", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();

      // Purchase monthly
      await membershipManager.connect(user1).purchaseMembership(1, {
        value: ethers.parseEther("0.01"),
      });

      // Fast forward past expiry (31 days)
      const { time } = require("@nomicfoundation/hardhat-network-helpers");
      await time.increase(31 * 86400);

      // Renew after expiry
      const tx = await membershipManager.connect(user1).purchaseMembership(1, {
        value: ethers.parseEther("0.01"),
      });
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const info = await membershipManager.getMembershipInfo(user1.address);
      // Should start from block.timestamp since old membership is expired
      expect(info.expiresAt).to.equal(BigInt(block.timestamp) + BigInt(30 * 86400));
    });

    it("Should receive ETH in contract", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();
      await membershipManager.connect(user1).purchaseMembership(1, {
        value: ethers.parseEther("0.01"),
      });

      const contractBalance = await ethers.provider.getBalance(
        await membershipManager.getAddress()
      );
      expect(contractBalance).to.equal(ethers.parseEther("0.01"));
    });
  });

  describe("Withdraw", function () {
    it("Should allow owner to withdraw funds", async function () {
      const { membershipManager, owner, user1 } = await loadFixture(deployMembershipManagerFixture);
      await membershipManager.connect(user1).register();
      await membershipManager.connect(user1).purchaseMembership(1, {
        value: ethers.parseEther("0.01"),
      });

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const tx = await membershipManager.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter + gasCost - balanceBefore).to.equal(ethers.parseEther("0.01"));
    });

    it("Should revert when non-owner tries to withdraw", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      await expect(
        membershipManager.connect(user1).withdraw()
      ).to.be.revertedWithCustomError(membershipManager, "OwnableUnauthorizedAccount");
    });

    it("Should revert when no funds to withdraw", async function () {
      const { membershipManager, owner } = await loadFixture(deployMembershipManagerFixture);
      await expect(
        membershipManager.connect(owner).withdraw()
      ).to.be.revertedWith("MembershipManager: no funds");
    });
  });

  describe("getMembershipInfo", function () {
    it("Should return default values for unregistered user", async function () {
      const { membershipManager, user1 } = await loadFixture(deployMembershipManagerFixture);
      const info = await membershipManager.getMembershipInfo(user1.address);
      expect(info.isRegistered).to.be.false;
      expect(info.expiresAt).to.equal(0);
      expect(info.currentPlan).to.equal(0);
    });
  });
});
