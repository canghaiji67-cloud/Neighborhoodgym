const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("CheckIn", function () {
  async function deployCheckInFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Deploy FitToken
    const FitToken = await ethers.getContractFactory("FitToken");
    const fitToken = await FitToken.deploy(owner.address);
    await fitToken.waitForDeployment();

    // Deploy CheckIn
    const CheckIn = await ethers.getContractFactory("CheckIn");
    const checkIn = await CheckIn.deploy(
      await fitToken.getAddress(),
      owner.address
    );
    await checkIn.waitForDeployment();

    // Authorize CheckIn contract as FitToken minter
    await fitToken.connect(owner).addMinter(await checkIn.getAddress());

    return { fitToken, checkIn, owner, user1, user2 };
  }

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const { checkIn, owner } = await loadFixture(deployCheckInFixture);
      expect(await checkIn.owner()).to.equal(owner.address);
    });

    it("Should set the correct FitToken address", async function () {
      const { checkIn, fitToken } = await loadFixture(deployCheckInFixture);
      expect(await checkIn.fitToken()).to.equal(await fitToken.getAddress());
    });

    it("Should revert when deployed with zero FitToken address", async function () {
      const [owner] = await ethers.getSigners();
      const CheckIn = await ethers.getContractFactory("CheckIn");
      await expect(
        CheckIn.deploy(ethers.ZeroAddress, owner.address)
      ).to.be.revertedWith("CheckIn: fitToken is zero address");
    });

    it("Should have correct reward constants", async function () {
      const { checkIn } = await loadFixture(deployCheckInFixture);
      expect(await checkIn.DAILY_REWARD()).to.equal(ethers.parseEther("10"));
      expect(await checkIn.STREAK_7_REWARD()).to.equal(
        ethers.parseEther("50")
      );
      expect(await checkIn.STREAK_30_REWARD()).to.equal(
        ethers.parseEther("300")
      );
      expect(await checkIn.STREAK_100_REWARD()).to.equal(
        ethers.parseEther("1000")
      );
    });
  });

  describe("Daily Check In", function () {
    it("Should allow a user to check in", async function () {
      const { checkIn, fitToken, user1 } = await loadFixture(
        deployCheckInFixture
      );
      await checkIn.connect(user1).checkIn();

      const info = await checkIn.getCheckInInfo(user1.address);
      expect(info.totalCount).to.equal(1);
      expect(info.currentStreak).to.equal(1);

      // Should receive daily reward: 10 FIT
      expect(await fitToken.balanceOf(user1.address)).to.equal(
        ethers.parseEther("10")
      );
    });

    it("Should emit CheckedIn event", async function () {
      const { checkIn, user1 } = await loadFixture(deployCheckInFixture);
      await expect(checkIn.connect(user1).checkIn()).to.emit(
        checkIn,
        "CheckedIn"
      );
    });

    it("Should revert when checking in twice on the same day", async function () {
      const { checkIn, user1 } = await loadFixture(deployCheckInFixture);
      await checkIn.connect(user1).checkIn();
      await expect(
        checkIn.connect(user1).checkIn()
      ).to.be.revertedWith("CheckIn: already checked in today");
    });

    it("Should allow check in on the next day", async function () {
      const { checkIn, user1 } = await loadFixture(deployCheckInFixture);
      await checkIn.connect(user1).checkIn();

      await time.increase(86400);
      await checkIn.connect(user1).checkIn();

      const info = await checkIn.getCheckInInfo(user1.address);
      expect(info.totalCount).to.equal(2);
    });
  });

  describe("Streak Tracking", function () {
    it("Should increment streak on consecutive days", async function () {
      const { checkIn, user1 } = await loadFixture(deployCheckInFixture);

      await checkIn.connect(user1).checkIn();
      await time.increase(86400);
      await checkIn.connect(user1).checkIn();

      const info = await checkIn.getCheckInInfo(user1.address);
      expect(info.totalCount).to.equal(2);
      expect(info.currentStreak).to.equal(2);
    });

    it("Should build streak over multiple consecutive days", async function () {
      const { checkIn, user1 } = await loadFixture(deployCheckInFixture);

      for (let i = 0; i < 5; i++) {
        if (i > 0) await time.increase(86400);
        await checkIn.connect(user1).checkIn();
      }

      const info = await checkIn.getCheckInInfo(user1.address);
      expect(info.totalCount).to.equal(5);
      expect(info.currentStreak).to.equal(5);
    });

    it("Should reset streak after missing a day", async function () {
      const { checkIn, user1 } = await loadFixture(deployCheckInFixture);

      // Check in for 3 consecutive days
      await checkIn.connect(user1).checkIn();
      await time.increase(86400);
      await checkIn.connect(user1).checkIn();
      await time.increase(86400);
      await checkIn.connect(user1).checkIn();

      const info1 = await checkIn.getCheckInInfo(user1.address);
      expect(info1.currentStreak).to.equal(3);

      // Skip 2 days (miss one day)
      await time.increase(86400 * 2);
      await checkIn.connect(user1).checkIn();

      const info2 = await checkIn.getCheckInInfo(user1.address);
      expect(info2.totalCount).to.equal(4);
      expect(info2.currentStreak).to.equal(1);
    });

    it("Should reset streak after missing multiple days", async function () {
      const { checkIn, user1 } = await loadFixture(deployCheckInFixture);

      await checkIn.connect(user1).checkIn();
      // Skip 10 days
      await time.increase(86400 * 10);
      await checkIn.connect(user1).checkIn();

      const info = await checkIn.getCheckInInfo(user1.address);
      expect(info.totalCount).to.equal(2);
      expect(info.currentStreak).to.equal(1);
    });
  });

  describe("Milestone Rewards", function () {
    it("Should award 7-day streak bonus", async function () {
      const { checkIn, fitToken, user1 } = await loadFixture(
        deployCheckInFixture
      );

      for (let i = 0; i < 7; i++) {
        if (i > 0) await time.increase(86400);
        await checkIn.connect(user1).checkIn();
      }

      const info = await checkIn.getCheckInInfo(user1.address);
      expect(info.currentStreak).to.equal(7);
      expect(info.totalCount).to.equal(7);

      // 7 * 10 (daily) + 50 (7-day milestone) = 120 FIT
      expect(await fitToken.balanceOf(user1.address)).to.equal(
        ethers.parseEther("120")
      );
    });

    it("Should emit MilestoneReward event at 7-day streak", async function () {
      const { checkIn, user1 } = await loadFixture(deployCheckInFixture);

      for (let i = 0; i < 6; i++) {
        if (i > 0) await time.increase(86400);
        await checkIn.connect(user1).checkIn();
      }

      await time.increase(86400);
      await expect(checkIn.connect(user1).checkIn())
        .to.emit(checkIn, "MilestoneReward")
        .withArgs(user1.address, 7, ethers.parseEther("50"));
    });

    it("Should award 30-day streak bonus", async function () {
      const { checkIn, fitToken, user1 } = await loadFixture(
        deployCheckInFixture
      );

      for (let i = 0; i < 30; i++) {
        if (i > 0) await time.increase(86400);
        await checkIn.connect(user1).checkIn();
      }

      const info = await checkIn.getCheckInInfo(user1.address);
      expect(info.currentStreak).to.equal(30);

      // 30 * 10 (daily) + 50 (7-day) + 300 (30-day) = 650 FIT
      expect(await fitToken.balanceOf(user1.address)).to.equal(
        ethers.parseEther("650")
      );
    });

    it("Should emit MilestoneReward event at 30-day streak", async function () {
      const { checkIn, user1 } = await loadFixture(deployCheckInFixture);

      for (let i = 0; i < 29; i++) {
        if (i > 0) await time.increase(86400);
        await checkIn.connect(user1).checkIn();
      }

      await time.increase(86400);
      await expect(checkIn.connect(user1).checkIn())
        .to.emit(checkIn, "MilestoneReward")
        .withArgs(user1.address, 30, ethers.parseEther("300"));
    });

    it("Should award 100-day streak bonus", async function () {
      const { checkIn, fitToken, user1 } = await loadFixture(
        deployCheckInFixture
      );

      for (let i = 0; i < 100; i++) {
        if (i > 0) await time.increase(86400);
        await checkIn.connect(user1).checkIn();
      }

      const info = await checkIn.getCheckInInfo(user1.address);
      expect(info.currentStreak).to.equal(100);

      // 100 * 10 (daily) + 50 (7-day) + 300 (30-day) + 1000 (100-day) = 2350 FIT
      expect(await fitToken.balanceOf(user1.address)).to.equal(
        ethers.parseEther("2350")
      );
    });

    it("Should not give duplicate milestone rewards after streak reset and rebuild", async function () {
      const { checkIn, fitToken, user1 } = await loadFixture(
        deployCheckInFixture
      );

      // Build 7-day streak
      for (let i = 0; i < 7; i++) {
        if (i > 0) await time.increase(86400);
        await checkIn.connect(user1).checkIn();
      }
      // Balance: 7 * 10 + 50 = 120 FIT
      expect(await fitToken.balanceOf(user1.address)).to.equal(
        ethers.parseEther("120")
      );

      // Break streak
      await time.increase(86400 * 2);
      await checkIn.connect(user1).checkIn();

      // Rebuild to 7-day streak again
      for (let i = 0; i < 6; i++) {
        await time.increase(86400);
        await checkIn.connect(user1).checkIn();
      }
      // Additional: 7 * 10 (daily for days 9-15) + 50 (second 7-day milestone) = 120 FIT more
      // But day 8 (the break day) also got 10 FIT
      // Total: 120 + 10 + 120 = 250 FIT? No wait...
      // Day 8: streak reset to 1, +10 FIT. Days 9-14: +10 each, streak 2->7. Day 14: +50 milestone.
      // Total: 120 (first 7 days) + 10 (day 8) + 60 (days 9-14) + 50 (2nd milestone) = 240 FIT

      // Total check-ins: 7 + 1 + 6 = 14, each gives 10 = 140
      // Milestones: 50 + 50 = 100
      // Total: 240
      expect(await fitToken.balanceOf(user1.address)).to.equal(
        ethers.parseEther("240")
      );
    });
  });

  describe("getCheckInInfo", function () {
    it("Should return default values for user who never checked in", async function () {
      const { checkIn, user1 } = await loadFixture(deployCheckInFixture);
      const info = await checkIn.getCheckInInfo(user1.address);
      expect(info.totalCount).to.equal(0);
      expect(info.currentStreak).to.equal(0);
      expect(info.lastCheckInDay).to.equal(0);
    });

    it("Should return correct lastCheckInDay", async function () {
      const { checkIn, user1 } = await loadFixture(deployCheckInFixture);
      await checkIn.connect(user1).checkIn();

      const info = await checkIn.getCheckInInfo(user1.address);
      const latestBlock = await ethers.provider.getBlock("latest");
      const expectedDay = BigInt(latestBlock.timestamp) / 86400n;
      expect(info.lastCheckInDay).to.equal(expectedDay);
    });
  });

  describe("Multiple Users", function () {
    it("Should track check-ins independently for different users", async function () {
      const { checkIn, fitToken, user1, user2 } = await loadFixture(
        deployCheckInFixture
      );

      await checkIn.connect(user1).checkIn();
      await checkIn.connect(user2).checkIn();

      const info1 = await checkIn.getCheckInInfo(user1.address);
      const info2 = await checkIn.getCheckInInfo(user2.address);

      expect(info1.totalCount).to.equal(1);
      expect(info1.currentStreak).to.equal(1);
      expect(info2.totalCount).to.equal(1);
      expect(info2.currentStreak).to.equal(1);

      // Both should have 10 FIT
      expect(await fitToken.balanceOf(user1.address)).to.equal(
        ethers.parseEther("10")
      );
      expect(await fitToken.balanceOf(user2.address)).to.equal(
        ethers.parseEther("10")
      );
    });

    it("Should allow different users to check in same day", async function () {
      const { checkIn, user1, user2 } = await loadFixture(
        deployCheckInFixture
      );

      await checkIn.connect(user1).checkIn();
      await checkIn.connect(user2).checkIn();

      // Both succeed, no conflict
      const info1 = await checkIn.getCheckInInfo(user1.address);
      const info2 = await checkIn.getCheckInInfo(user2.address);
      expect(info1.totalCount).to.equal(1);
      expect(info2.totalCount).to.equal(1);
    });
  });
});
