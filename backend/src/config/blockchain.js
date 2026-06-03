const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

let provider = null;
let serviceWallet = null;
const contracts = {};

function loadABI(contractName) {
  const artifactPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'artifacts',
    'contracts',
    `${contractName}.sol`,
    `${contractName}.json`
  );
  if (!fs.existsSync(artifactPath)) {
    console.warn(
      `[blockchain] ABI not found for ${contractName}. Run 'npx hardhat compile' in project root first.`
    );
    return null;
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  return artifact.abi;
}

function init() {
  if (!process.env.BLOCKCHAIN_RPC_URL) {
    console.warn('[blockchain] BLOCKCHAIN_RPC_URL not configured, skipping blockchain init');
    return;
  }

  try {
    provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    console.log('[blockchain] Provider connected to', process.env.BLOCKCHAIN_RPC_URL);
  } catch (err) {
    console.error('[blockchain] Failed to create provider:', err.message);
    return;
  }

  if (process.env.SERVICE_WALLET_PRIVATE_KEY) {
    try {
      serviceWallet = new ethers.Wallet(
        process.env.SERVICE_WALLET_PRIVATE_KEY,
        provider
      );
      console.log('[blockchain] Service wallet loaded:', serviceWallet.address);
    } catch (err) {
      console.error('[blockchain] Failed to load service wallet:', err.message);
    }
  } else {
    console.warn('[blockchain] SERVICE_WALLET_PRIVATE_KEY not configured');
  }

  const signer = serviceWallet || provider;

  // FitToken
  const fitTokenABI = loadABI('FitToken');
  if (fitTokenABI && process.env.FITTOKEN_CONTRACT_ADDRESS) {
    contracts.fitToken = new ethers.Contract(
      process.env.FITTOKEN_CONTRACT_ADDRESS,
      fitTokenABI,
      signer
    );
    console.log('[blockchain] FitToken contract loaded at', process.env.FITTOKEN_CONTRACT_ADDRESS);
  }

  // MembershipManager
  const membershipABI = loadABI('MembershipManager');
  if (membershipABI && process.env.MEMBERSHIP_CONTRACT_ADDRESS) {
    contracts.membershipManager = new ethers.Contract(
      process.env.MEMBERSHIP_CONTRACT_ADDRESS,
      membershipABI,
      signer
    );
    console.log('[blockchain] MembershipManager contract loaded at', process.env.MEMBERSHIP_CONTRACT_ADDRESS);
  }

  // CheckIn
  const checkInABI = loadABI('CheckIn');
  if (checkInABI && process.env.CHECKIN_CONTRACT_ADDRESS) {
    contracts.checkIn = new ethers.Contract(
      process.env.CHECKIN_CONTRACT_ADDRESS,
      checkInABI,
      signer
    );
    console.log('[blockchain] CheckIn contract loaded at', process.env.CHECKIN_CONTRACT_ADDRESS);
  }

  // AchievementBadge
  const badgeABI = loadABI('AchievementBadge');
  if (badgeABI && process.env.ACHIEVEMENT_CONTRACT_ADDRESS) {
    contracts.achievementBadge = new ethers.Contract(
      process.env.ACHIEVEMENT_CONTRACT_ADDRESS,
      badgeABI,
      signer
    );
    console.log('[blockchain] AchievementBadge contract loaded at', process.env.ACHIEVEMENT_CONTRACT_ADDRESS);
  }
}

function getProvider() {
  return provider;
}

function getServiceWallet() {
  return serviceWallet;
}

function getContracts() {
  return contracts;
}

module.exports = {
  init,
  getProvider,
  getServiceWallet,
  getContracts,
};
