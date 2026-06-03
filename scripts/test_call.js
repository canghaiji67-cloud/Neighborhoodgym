const hre = require("hardhat");

async function main() {
  const membershipAddr = "0xf0912B72D7Bc8ccD38a0c6A52fE0676D550af7c4";
  const userAddr = "0x7aa3b88cd7486d2e845f7953d4d139f62cf167f1";

  const iface = new hre.ethers.Interface([
    "function register() external",
    "function getMembershipInfo(address user) external view returns (bool, uint256, uint8)"
  ]);

  // 1. Check user's on-chain nonce
  const nonce = await hre.ethers.provider.getTransactionCount(userAddr);
  console.log("User on-chain nonce:", nonce);

  // 2. Check user's ETH balance
  const balance = await hre.ethers.provider.getBalance(userAddr);
  console.log("User balance:", hre.ethers.formatEther(balance), "ETH");

  // 3. Check if user is already registered on MembershipManager
  const infoData = iface.encodeFunctionData("getMembershipInfo", [userAddr]);
  const infoResult = await hre.ethers.provider.call({ to: membershipAddr, data: infoData });
  const decoded = iface.decodeFunctionResult("getMembershipInfo", infoResult);
  console.log("User isRegistered:", decoded[0]);
  console.log("User expiresAt:", decoded[1].toString());
  console.log("User currentPlan:", decoded[2].toString());

  // 4. Simulate register() eth_call from user address
  const calldata = iface.encodeFunctionData("register", []);
  console.log("\nSimulating register() from user address...");
  try {
    const result = await hre.ethers.provider.call({
      to: membershipAddr,
      data: calldata,
      from: userAddr,
    });
    console.log("Simulation SUCCESS (result:", result, ")");
  } catch (err) {
    console.error("Simulation FAILED:", err.message);
  }
}

main().catch(console.error);
