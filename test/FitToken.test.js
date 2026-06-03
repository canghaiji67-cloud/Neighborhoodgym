const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("FitToken", function () {
  async function deployFitTokenFixture() {
    const [owner, minter, user, other] = await ethers.getSigners();
    const FitToken = await ethers.getContractFactory("FitToken");
    const fitToken = await FitToken.deploy(owner.address);
    await fitToken.waitForDeployment();
    return { fitToken, owner, minter, user, other };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { fitToken } = await loadFixture(deployFitTokenFixture);
      expect(await fitToken.name()).to.equal("FitToken");
      expect(await fitToken.symbol()).to.equal("FIT");
    });

    it("Should set the correct owner", async function () {
      const { fitToken, owner } = await loadFixture(deployFitTokenFixture);
      expect(await fitToken.owner()).to.equal(owner.address);
    });

    it("Should have 18 decimals", async function () {
      const { fitToken } = await loadFixture(deployFitTokenFixture);
      expect(await fitToken.decimals()).to.equal(18);
    });

    it("Should have zero initial supply", async function () {
      const { fitToken } = await loadFixture(deployFitTokenFixture);
      expect(await fitToken.totalSupply()).to.equal(0);
    });
  });

  describe("Minter Management", function () {
    it("Should allow owner to add a minter", async function () {
      const { fitToken, owner, minter } = await loadFixture(deployFitTokenFixture);
      await fitToken.connect(owner).addMinter(minter.address);
      expect(await fitToken.minters(minter.address)).to.be.true;
    });

    it("Should allow owner to remove a minter", async function () {
      const { fitToken, owner, minter } = await loadFixture(deployFitTokenFixture);
      await fitToken.connect(owner).addMinter(minter.address);
      await fitToken.connect(owner).removeMinter(minter.address);
      expect(await fitToken.minters(minter.address)).to.be.false;
    });

    it("Should revert when adding zero address as minter", async function () {
      const { fitToken, owner } = await loadFixture(deployFitTokenFixture);
      await expect(
        fitToken.connect(owner).addMinter(ethers.ZeroAddress)
      ).to.be.revertedWith("FitToken: minter is zero address");
    });

    it("Should revert when non-owner tries to add a minter", async function () {
      const { fitToken, minter, other } = await loadFixture(deployFitTokenFixture);
      await expect(
        fitToken.connect(other).addMinter(minter.address)
      ).to.be.revertedWithCustomError(fitToken, "OwnableUnauthorizedAccount");
    });

    it("Should revert when non-owner tries to remove a minter", async function () {
      const { fitToken, minter, other } = await loadFixture(deployFitTokenFixture);
      await expect(
        fitToken.connect(other).removeMinter(minter.address)
      ).to.be.revertedWithCustomError(fitToken, "OwnableUnauthorizedAccount");
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const { fitToken, owner, minter, user } = await loadFixture(deployFitTokenFixture);
      await fitToken.connect(owner).addMinter(minter.address);
      const amount = ethers.parseEther("100");
      await fitToken.connect(minter).mint(user.address, amount);
      expect(await fitToken.balanceOf(user.address)).to.equal(amount);
    });

    it("Should emit Minted event", async function () {
      const { fitToken, owner, minter, user } = await loadFixture(deployFitTokenFixture);
      await fitToken.connect(owner).addMinter(minter.address);
      const amount = ethers.parseEther("50");
      await expect(fitToken.connect(minter).mint(user.address, amount))
        .to.emit(fitToken, "Minted")
        .withArgs(user.address, amount);
    });

    it("Should revert when non-minter tries to mint", async function () {
      const { fitToken, user, other } = await loadFixture(deployFitTokenFixture);
      const amount = ethers.parseEther("100");
      await expect(
        fitToken.connect(other).mint(user.address, amount)
      ).to.be.revertedWith("FitToken: caller is not a minter");
    });

    it("Should update total supply after minting", async function () {
      const { fitToken, owner, minter, user } = await loadFixture(deployFitTokenFixture);
      await fitToken.connect(owner).addMinter(minter.address);
      const amount = ethers.parseEther("100");
      await fitToken.connect(minter).mint(user.address, amount);
      expect(await fitToken.totalSupply()).to.equal(amount);
    });

    it("Should allow multiple mints to accumulate balance", async function () {
      const { fitToken, owner, minter, user } = await loadFixture(deployFitTokenFixture);
      await fitToken.connect(owner).addMinter(minter.address);
      await fitToken.connect(minter).mint(user.address, ethers.parseEther("50"));
      await fitToken.connect(minter).mint(user.address, ethers.parseEther("30"));
      expect(await fitToken.balanceOf(user.address)).to.equal(ethers.parseEther("80"));
    });
  });

  describe("ERC20 Standard", function () {
    it("Should allow transfer between accounts", async function () {
      const { fitToken, owner, minter, user, other } = await loadFixture(deployFitTokenFixture);
      await fitToken.connect(owner).addMinter(minter.address);
      await fitToken.connect(minter).mint(user.address, ethers.parseEther("100"));

      await fitToken.connect(user).transfer(other.address, ethers.parseEther("30"));
      expect(await fitToken.balanceOf(user.address)).to.equal(ethers.parseEther("70"));
      expect(await fitToken.balanceOf(other.address)).to.equal(ethers.parseEther("30"));
    });

    it("Should allow approve and transferFrom", async function () {
      const { fitToken, owner, minter, user, other } = await loadFixture(deployFitTokenFixture);
      await fitToken.connect(owner).addMinter(minter.address);
      await fitToken.connect(minter).mint(user.address, ethers.parseEther("100"));

      await fitToken.connect(user).approve(other.address, ethers.parseEther("50"));
      await fitToken.connect(other).transferFrom(user.address, other.address, ethers.parseEther("50"));
      expect(await fitToken.balanceOf(other.address)).to.equal(ethers.parseEther("50"));
      expect(await fitToken.balanceOf(user.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should revert transfer when insufficient balance", async function () {
      const { fitToken, user, other } = await loadFixture(deployFitTokenFixture);
      await expect(
        fitToken.connect(user).transfer(other.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(fitToken, "ERC20InsufficientBalance");
    });
  });
});
