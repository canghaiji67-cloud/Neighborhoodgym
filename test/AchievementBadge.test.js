const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("AchievementBadge", function () {
  async function deployAchievementBadgeFixture() {
    const [owner, user1, user2, other] = await ethers.getSigners();
    const AchievementBadge =
      await ethers.getContractFactory("AchievementBadge");
    const badge = await AchievementBadge.deploy(owner.address);
    await badge.waitForDeployment();
    return { badge, owner, user1, user2, other };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { badge } = await loadFixture(deployAchievementBadgeFixture);
      expect(await badge.name()).to.equal("GymAchievementBadge");
      expect(await badge.symbol()).to.equal("GAB");
    });

    it("Should set the correct owner", async function () {
      const { badge, owner } = await loadFixture(
        deployAchievementBadgeFixture
      );
      expect(await badge.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint a badge", async function () {
      const { badge, owner, user1 } = await loadFixture(
        deployAchievementBadgeFixture
      );
      const tokenURI = "ipfs://QmTest123";

      await badge.connect(owner).mintBadge(user1.address, tokenURI);

      expect(await badge.ownerOf(1)).to.equal(user1.address);
      expect(await badge.tokenURI(1)).to.equal(tokenURI);
    });

    it("Should increment token IDs starting from 1", async function () {
      const { badge, owner, user1, user2 } = await loadFixture(
        deployAchievementBadgeFixture
      );

      await badge.connect(owner).mintBadge(user1.address, "ipfs://uri1");
      await badge.connect(owner).mintBadge(user2.address, "ipfs://uri2");
      await badge.connect(owner).mintBadge(user1.address, "ipfs://uri3");

      expect(await badge.ownerOf(1)).to.equal(user1.address);
      expect(await badge.ownerOf(2)).to.equal(user2.address);
      expect(await badge.ownerOf(3)).to.equal(user1.address);
    });

    it("Should set correct tokenURI for each badge", async function () {
      const { badge, owner, user1 } = await loadFixture(
        deployAchievementBadgeFixture
      );

      await badge
        .connect(owner)
        .mintBadge(user1.address, "ipfs://QmMetadata1");
      await badge
        .connect(owner)
        .mintBadge(user1.address, "ipfs://QmMetadata2");

      expect(await badge.tokenURI(1)).to.equal("ipfs://QmMetadata1");
      expect(await badge.tokenURI(2)).to.equal("ipfs://QmMetadata2");
    });

    it("Should emit BadgeMinted event with correct args", async function () {
      const { badge, owner, user1 } = await loadFixture(
        deployAchievementBadgeFixture
      );
      const tokenURI = "ipfs://QmTestEvent";

      await expect(
        badge.connect(owner).mintBadge(user1.address, tokenURI)
      )
        .to.emit(badge, "BadgeMinted")
        .withArgs(user1.address, 1, tokenURI);
    });

    it("Should emit BadgeMinted event with incremented tokenId", async function () {
      const { badge, owner, user1 } = await loadFixture(
        deployAchievementBadgeFixture
      );

      await badge
        .connect(owner)
        .mintBadge(user1.address, "ipfs://first");

      await expect(
        badge.connect(owner).mintBadge(user1.address, "ipfs://second")
      )
        .to.emit(badge, "BadgeMinted")
        .withArgs(user1.address, 2, "ipfs://second");
    });

    it("Should revert when non-owner tries to mint", async function () {
      const { badge, user1, other } = await loadFixture(
        deployAchievementBadgeFixture
      );
      await expect(
        badge.connect(other).mintBadge(user1.address, "ipfs://test")
      ).to.be.revertedWithCustomError(badge, "OwnableUnauthorizedAccount");
    });

    it("Should revert when minting to zero address", async function () {
      const { badge, owner } = await loadFixture(
        deployAchievementBadgeFixture
      );
      await expect(
        badge.connect(owner).mintBadge(ethers.ZeroAddress, "ipfs://test")
      ).to.be.revertedWithCustomError(badge, "ERC721InvalidReceiver");
    });
  });

  describe("getBadgesByOwner", function () {
    it("Should return empty array for user with no badges", async function () {
      const { badge, user1 } = await loadFixture(
        deployAchievementBadgeFixture
      );
      const badges = await badge.getBadgesByOwner(user1.address);
      expect(badges.length).to.equal(0);
    });

    it("Should return single badge for user with one badge", async function () {
      const { badge, owner, user1 } = await loadFixture(
        deployAchievementBadgeFixture
      );

      await badge.connect(owner).mintBadge(user1.address, "ipfs://uri1");

      const badges = await badge.getBadgesByOwner(user1.address);
      expect(badges.length).to.equal(1);
      expect(badges[0]).to.equal(1);
    });

    it("Should return all badges owned by a user", async function () {
      const { badge, owner, user1 } = await loadFixture(
        deployAchievementBadgeFixture
      );

      await badge.connect(owner).mintBadge(user1.address, "ipfs://uri1");
      await badge.connect(owner).mintBadge(user1.address, "ipfs://uri2");
      await badge.connect(owner).mintBadge(user1.address, "ipfs://uri3");

      const badges = await badge.getBadgesByOwner(user1.address);
      expect(badges.length).to.equal(3);
      expect(badges[0]).to.equal(1);
      expect(badges[1]).to.equal(2);
      expect(badges[2]).to.equal(3);
    });

    it("Should track badges independently per user", async function () {
      const { badge, owner, user1, user2 } = await loadFixture(
        deployAchievementBadgeFixture
      );

      await badge.connect(owner).mintBadge(user1.address, "ipfs://u1b1");
      await badge.connect(owner).mintBadge(user2.address, "ipfs://u2b1");
      await badge.connect(owner).mintBadge(user1.address, "ipfs://u1b2");

      const user1Badges = await badge.getBadgesByOwner(user1.address);
      const user2Badges = await badge.getBadgesByOwner(user2.address);

      expect(user1Badges.length).to.equal(2);
      expect(user2Badges.length).to.equal(1);
      expect(user1Badges[0]).to.equal(1);
      expect(user1Badges[1]).to.equal(3);
      expect(user2Badges[0]).to.equal(2);
    });
  });

  describe("ERC721 Standard", function () {
    it("Should support ERC721 interface", async function () {
      const { badge } = await loadFixture(deployAchievementBadgeFixture);
      // ERC721 interface ID: 0x80ac58cd
      expect(await badge.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("Should support ERC721Metadata interface", async function () {
      const { badge } = await loadFixture(deployAchievementBadgeFixture);
      // ERC721Metadata interface ID: 0x5b5e139f
      expect(await badge.supportsInterface("0x5b5e139f")).to.be.true;
    });

    it("Should return correct balanceOf", async function () {
      const { badge, owner, user1 } = await loadFixture(
        deployAchievementBadgeFixture
      );

      expect(await badge.balanceOf(user1.address)).to.equal(0);

      await badge.connect(owner).mintBadge(user1.address, "ipfs://uri1");
      expect(await badge.balanceOf(user1.address)).to.equal(1);

      await badge.connect(owner).mintBadge(user1.address, "ipfs://uri2");
      expect(await badge.balanceOf(user1.address)).to.equal(2);
    });

    it("Should allow owner of token to transfer", async function () {
      const { badge, owner, user1, user2 } = await loadFixture(
        deployAchievementBadgeFixture
      );

      await badge.connect(owner).mintBadge(user1.address, "ipfs://uri1");
      await badge
        .connect(user1)
        .transferFrom(user1.address, user2.address, 1);

      expect(await badge.ownerOf(1)).to.equal(user2.address);
      expect(await badge.balanceOf(user1.address)).to.equal(0);
      expect(await badge.balanceOf(user2.address)).to.equal(1);
    });
  });
});
