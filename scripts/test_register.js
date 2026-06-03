const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  const membershipAddr = "0xf0912B72D7Bc8ccD38a0c6A52fE0676D550af7c4";
  
  // Get contract instance
  const MembershipManager = await hre.ethers.getContractAt("MembershipManager", membershipAddr);
  
  // Check if already registered
  const info = await MembershipManager.getMembershipInfo(deployer.address);
  console.log("isRegistered:", info[0]);
  console.log("expiresAt:", info[1].toString());
  console.log("currentPlan:", info[2].toString());

  if (!info[0]) {
    console.log("\nCalling register()...");
    try {
      const tx = await MembershipManager.register();
      console.log("TX hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("TX status:", receipt.status === 1 ? "SUCCESS" : "FAILED");
    } catch (err) {
      console.error("register() FAILED:", err.message);
    }
  } else {
    console.log("\nAlready registered on-chain.");
  }
}

main().catch(console.error);
