const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // 1. Deploy FitToken
  console.log("\n--- Deploying FitToken ---");
  const FitToken = await hre.ethers.getContractFactory("FitToken");
  const fitToken = await FitToken.deploy(deployer.address);
  await fitToken.waitForDeployment();
  const fitTokenAddress = await fitToken.getAddress();
  console.log("FitToken deployed to:", fitTokenAddress);

  // 2. Deploy MembershipManager
  console.log("\n--- Deploying MembershipManager ---");
  const MembershipManager = await hre.ethers.getContractFactory("MembershipManager");
  const membershipManager = await MembershipManager.deploy(deployer.address);
  await membershipManager.waitForDeployment();
  const membershipManagerAddress = await membershipManager.getAddress();
  console.log("MembershipManager deployed to:", membershipManagerAddress);

  // 3. Deploy CheckIn(fitTokenAddress)
  console.log("\n--- Deploying CheckIn ---");
  const CheckIn = await hre.ethers.getContractFactory("CheckIn");
  const checkIn = await CheckIn.deploy(fitTokenAddress, deployer.address);
  await checkIn.waitForDeployment();
  const checkInAddress = await checkIn.getAddress();
  console.log("CheckIn deployed to:", checkInAddress);

  // 4. Deploy AchievementBadge
  console.log("\n--- Deploying AchievementBadge ---");
  const AchievementBadge = await hre.ethers.getContractFactory("AchievementBadge");
  const achievementBadge = await AchievementBadge.deploy(deployer.address);
  await achievementBadge.waitForDeployment();
  const achievementBadgeAddress = await achievementBadge.getAddress();
  console.log("AchievementBadge deployed to:", achievementBadgeAddress);

  // 5. Authorize CheckIn contract as FitToken minter
  console.log("\n--- Configuring Minter Permissions ---");
  const tx1 = await fitToken.addMinter(checkInAddress);
  await tx1.wait();
  console.log("CheckIn contract authorized as FitToken minter");

  // 6. Authorize deployer (service wallet) as FitToken minter
  const tx2 = await fitToken.addMinter(deployer.address);
  await tx2.wait();
  console.log("Service wallet (deployer) authorized as FitToken minter");

  // 7. Output summary for .env configuration
  console.log("\n========================================");
  console.log("  Deployment Complete! Copy to .env:");
  console.log("========================================");
  console.log(`FITTOKEN_CONTRACT_ADDRESS=${fitTokenAddress}`);
  console.log(`MEMBERSHIP_CONTRACT_ADDRESS=${membershipManagerAddress}`);
  console.log(`CHECKIN_CONTRACT_ADDRESS=${checkInAddress}`);
  console.log(`ACHIEVEMENT_CONTRACT_ADDRESS=${achievementBadgeAddress}`);
  console.log("========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
