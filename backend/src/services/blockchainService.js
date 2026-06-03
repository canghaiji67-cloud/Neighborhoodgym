const { ethers } = require('ethers');
const blockchain = require('../config/blockchain');
const { TokenTransaction } = require('../models');

// ==================== Contract State Readers ====================

/**
 * Get membership info from MembershipManager contract
 * @param {string} walletAddress - user wallet address
 * @returns {{ isRegistered: boolean, expiresAt: number, currentPlan: number }}
 */
async function getMembershipInfo(walletAddress) {
  const { membershipManager } = blockchain.getContracts();
  if (!membershipManager) {
    throw Object.assign(new Error('MembershipManager contract not initialized'), {
      statusCode: 503,
      code: 'CONTRACT_NOT_READY',
    });
  }

  const [isRegistered, expiresAt, currentPlan] = await membershipManager.getMembershipInfo(walletAddress);
  return {
    isRegistered,
    expiresAt: Number(expiresAt),
    currentPlan: Number(currentPlan),
  };
}

/**
 * Get check-in info from CheckIn contract
 * @param {string} walletAddress - user wallet address
 * @returns {{ totalCount: number, currentStreak: number, lastCheckInDay: number }}
 */
async function getCheckInInfo(walletAddress) {
  const { checkIn } = blockchain.getContracts();
  if (!checkIn) {
    throw Object.assign(new Error('CheckIn contract not initialized'), {
      statusCode: 503,
      code: 'CONTRACT_NOT_READY',
    });
  }

  const [totalCount, currentStreak, lastCheckInDay] = await checkIn.getCheckInInfo(walletAddress);
  return {
    totalCount: Number(totalCount),
    currentStreak: Number(currentStreak),
    lastCheckInDay: Number(lastCheckInDay),
  };
}

/**
 * Get FitToken balance for an address
 * @param {string} walletAddress - user wallet address
 * @returns {string} balance in human-readable units (e.g. "100.0")
 */
async function getFitTokenBalance(walletAddress) {
  const { fitToken } = blockchain.getContracts();
  if (!fitToken) {
    throw Object.assign(new Error('FitToken contract not initialized'), {
      statusCode: 503,
      code: 'CONTRACT_NOT_READY',
    });
  }

  const balance = await fitToken.balanceOf(walletAddress);
  return ethers.formatEther(balance);
}

/**
 * Get NFT badges owned by an address
 * @param {string} walletAddress - user wallet address
 * @returns {number[]} array of token IDs
 */
async function getBadgesByOwner(walletAddress) {
  const { achievementBadge } = blockchain.getContracts();
  if (!achievementBadge) {
    throw Object.assign(new Error('AchievementBadge contract not initialized'), {
      statusCode: 503,
      code: 'CONTRACT_NOT_READY',
    });
  }

  const tokenIds = await achievementBadge.getBadgesByOwner(walletAddress);
  return tokenIds.map((id) => Number(id));
}

/**
 * Get token URI for a specific NFT
 * @param {number} tokenId
 * @returns {string} token URI (ipfs:// or https://)
 */
async function getTokenURI(tokenId) {
  const { achievementBadge } = blockchain.getContracts();
  if (!achievementBadge) {
    throw Object.assign(new Error('AchievementBadge contract not initialized'), {
      statusCode: 503,
      code: 'CONTRACT_NOT_READY',
    });
  }

  return await achievementBadge.tokenURI(tokenId);
}

// ==================== Transaction Verification ====================

/**
 * Verify a transaction hash: check it exists, succeeded, and matches expected criteria
 * @param {string} txHash - the transaction hash to verify
 * @param {object} expected - expected values to check against
 * @param {string} [expected.from] - expected sender address (lowercase)
 * @param {string} [expected.to] - expected recipient contract address (lowercase)
 * @param {string} [expected.value] - expected ETH value in wei (as string)
 * @returns {{ receipt: object, tx: object }} - the receipt and transaction objects
 */
async function verifyTransaction(txHash, expected = {}) {
  const provider = blockchain.getProvider();
  if (!provider) {
    throw Object.assign(new Error('Blockchain provider not initialized'), {
      statusCode: 503,
      code: 'PROVIDER_NOT_READY',
    });
  }

  // Fetch transaction and receipt in parallel
  const [tx, receipt] = await Promise.all([
    provider.getTransaction(txHash),
    provider.getTransactionReceipt(txHash),
  ]);

  if (!tx) {
    throw Object.assign(new Error('Transaction not found on chain'), {
      statusCode: 400,
      code: 'TX_NOT_FOUND',
    });
  }

  if (!receipt) {
    throw Object.assign(new Error('Transaction receipt not available, it may still be pending'), {
      statusCode: 400,
      code: 'TX_PENDING',
    });
  }

  if (receipt.status !== 1) {
    throw Object.assign(new Error('Transaction failed on chain'), {
      statusCode: 400,
      code: 'TX_FAILED',
    });
  }

  // Validate sender
  if (expected.from) {
    if (tx.from.toLowerCase() !== expected.from.toLowerCase()) {
      throw Object.assign(
        new Error(`Transaction sender mismatch: expected ${expected.from}, got ${tx.from}`),
        { statusCode: 400, code: 'TX_SENDER_MISMATCH' }
      );
    }
  }

  // Validate recipient
  if (expected.to) {
    if (!tx.to || tx.to.toLowerCase() !== expected.to.toLowerCase()) {
      throw Object.assign(
        new Error(`Transaction recipient mismatch: expected ${expected.to}, got ${tx.to}`),
        { statusCode: 400, code: 'TX_RECIPIENT_MISMATCH' }
      );
    }
  }

  // Validate ETH value
  if (expected.value) {
    if (tx.value.toString() !== expected.value) {
      throw Object.assign(
        new Error(`Transaction value mismatch: expected ${expected.value}, got ${tx.value.toString()}`),
        { statusCode: 400, code: 'TX_VALUE_MISMATCH' }
      );
    }
  }

  return { tx, receipt };
}

// ==================== Service Wallet Contract Calls ====================

/**
 * Mint FitToken to an address using the service wallet
 * @param {string} toAddress - recipient wallet address
 * @param {number} amountHuman - amount in human-readable units (e.g. 20 for 20 FIT)
 * @returns {{ txHash: string, amount: string }} - transaction hash and formatted amount
 */
async function mintFitToken(toAddress, amountHuman) {
  const { fitToken } = blockchain.getContracts();
  if (!fitToken) {
    throw Object.assign(new Error('FitToken contract not initialized'), {
      statusCode: 503,
      code: 'CONTRACT_NOT_READY',
    });
  }

  const serviceWallet = blockchain.getServiceWallet();
  if (!serviceWallet) {
    throw Object.assign(new Error('Service wallet not configured'), {
      statusCode: 503,
      code: 'SERVICE_WALLET_NOT_READY',
    });
  }

  const amountWei = ethers.parseEther(String(amountHuman));

  try {
    const tx = await fitToken.mint(toAddress, amountWei);
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      throw new Error('FitToken mint transaction failed on chain');
    }

    console.log(
      `[blockchainService] Minted ${amountHuman} FIT to ${toAddress}, txHash: ${receipt.hash}`
    );

    return {
      txHash: receipt.hash,
      amount: ethers.formatEther(amountWei),
    };
  } catch (err) {
    // Re-throw if it's already our custom error
    if (err.statusCode) throw err;
    throw Object.assign(
      new Error(`FitToken mint failed: ${err.reason || err.message}`),
      { statusCode: 500, code: 'MINT_FAILED' }
    );
  }
}

/**
 * Mint an achievement NFT badge to an address using the service wallet
 * @param {string} toAddress - recipient wallet address
 * @param {string} tokenURI - IPFS URI for the NFT metadata (e.g. "ipfs://QmXxx...")
 * @returns {{ txHash: string, tokenId: number }}
 */
async function mintBadge(toAddress, tokenURI) {
  const { achievementBadge } = blockchain.getContracts();
  if (!achievementBadge) {
    throw Object.assign(new Error('AchievementBadge contract not initialized'), {
      statusCode: 503,
      code: 'CONTRACT_NOT_READY',
    });
  }

  const serviceWallet = blockchain.getServiceWallet();
  if (!serviceWallet) {
    throw Object.assign(new Error('Service wallet not configured'), {
      statusCode: 503,
      code: 'SERVICE_WALLET_NOT_READY',
    });
  }

  try {
    const tx = await achievementBadge.mintBadge(toAddress, tokenURI);
    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      throw new Error('NFT mint transaction failed on chain');
    }

    // Parse BadgeMinted event to extract tokenId
    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = achievementBadge.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed && parsed.name === 'BadgeMinted') {
          tokenId = Number(parsed.args.tokenId);
          break;
        }
      } catch (_) {
        // Not our event, skip
      }
    }

    if (tokenId === null) {
      throw new Error('BadgeMinted event not found in receipt');
    }

    console.log(
      `[blockchainService] Minted badge #${tokenId} to ${toAddress}, txHash: ${receipt.hash}`
    );

    return {
      txHash: receipt.hash,
      tokenId,
    };
  } catch (err) {
    if (err.statusCode) throw err;
    throw Object.assign(
      new Error(`NFT badge mint failed: ${err.reason || err.message}`),
      { statusCode: 500, code: 'BADGE_MINT_FAILED' }
    );
  }
}

// ==================== Transaction Log Parsing ====================

/**
 * Parse FitToken Transfer events from a transaction receipt and write them to token_transactions.
 * Used after check-in transactions to record daily rewards and milestone rewards.
 *
 * @param {string} txHash - the transaction hash to parse
 * @param {string} type - transaction type: 'checkin_reward' | 'milestone_reward' | 'course_reward' | 'course_payment'
 * @returns {object[]} - array of created TokenTransaction records
 */
async function parseAndRecordTransferEvents(txHash, type) {
  const provider = blockchain.getProvider();
  const { fitToken } = blockchain.getContracts();
  if (!provider || !fitToken) {
    throw Object.assign(new Error('Blockchain provider or FitToken contract not initialized'), {
      statusCode: 503,
      code: 'CONTRACT_NOT_READY',
    });
  }

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) {
    throw Object.assign(new Error('Transaction receipt not found'), {
      statusCode: 400,
      code: 'TX_NOT_FOUND',
    });
  }

  if (receipt.status !== 1) {
    throw Object.assign(new Error('Transaction failed on chain'), {
      statusCode: 400,
      code: 'TX_FAILED',
    });
  }

  // Parse all Transfer events from the FitToken contract in this receipt
  const transferEvents = [];
  for (const log of receipt.logs) {
    // Only parse logs from the FitToken contract address
    if (log.address.toLowerCase() !== (await fitToken.getAddress()).toLowerCase()) {
      continue;
    }
    try {
      const parsed = fitToken.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });
      if (parsed && parsed.name === 'Transfer') {
        transferEvents.push({
          from: parsed.args.from,
          to: parsed.args.to,
          value: parsed.args.value,
        });
      }
    } catch (_) {
      // Not a Transfer event from FitToken, skip
    }
  }

  if (transferEvents.length === 0) {
    console.warn(`[blockchainService] No FitToken Transfer events found in tx: ${txHash}`);
    return [];
  }

  // Determine types for each transfer:
  // - Mint events (from = 0x0) during check-in can be daily reward or milestone reward
  //   Daily reward: 10 FIT (10e18 wei), milestone: 50/300/1000 FIT
  const DAILY_REWARD = ethers.parseEther('10');
  const MILESTONE_REWARDS = [
    ethers.parseEther('50'),
    ethers.parseEther('300'),
    ethers.parseEther('1000'),
  ];
  const COURSE_REWARD_AMOUNT = ethers.parseEther('20');

  const records = [];
  for (const event of transferEvents) {
    // Determine specific type based on amount for checkin scenario
    let eventType = type;
    if (type === 'checkin_reward') {
      if (event.value === DAILY_REWARD) {
        eventType = 'checkin_reward';
      } else if (MILESTONE_REWARDS.some((m) => event.value === m)) {
        eventType = 'milestone_reward';
      }
    }

    // Check for duplicate txHash + from + to + amount combo
    // Since one tx can have multiple Transfer events, we use txHash uniqueness per type
    // But token_transactions has unique txHash constraint, so we append an index for multi-event txs
    const recordTxHash =
      transferEvents.length === 1 ? txHash : `${txHash}-${records.length}`;

    // Skip if this txHash variant already exists
    const existing = await TokenTransaction.findOne({ where: { txHash: recordTxHash } });
    if (existing) {
      console.log(`[blockchainService] Token transaction already recorded: ${recordTxHash}`);
      continue;
    }

    const record = await TokenTransaction.create({
      fromAddress: event.from,
      toAddress: event.to,
      amount: ethers.formatEther(event.value),
      type: eventType,
      txHash: recordTxHash,
    });
    records.push(record);
  }

  console.log(
    `[blockchainService] Recorded ${records.length} token transactions from tx: ${txHash}`
  );
  return records;
}

/**
 * Record a single token transaction entry (for service wallet minted tokens)
 * @param {object} params
 * @param {string} params.fromAddress
 * @param {string} params.toAddress
 * @param {string|number} params.amount - human-readable amount
 * @param {string} params.type
 * @param {string} params.txHash
 * @returns {object} created TokenTransaction record
 */
async function recordTokenTransaction({ fromAddress, toAddress, amount, type, txHash }) {
  const existing = await TokenTransaction.findOne({ where: { txHash } });
  if (existing) {
    console.log(`[blockchainService] Token transaction already recorded: ${txHash}`);
    return existing;
  }

  const record = await TokenTransaction.create({
    fromAddress: fromAddress || ethers.ZeroAddress,
    toAddress,
    amount: String(amount),
    type,
    txHash,
  });

  return record;
}

// ==================== Utility ====================

/**
 * Get the service wallet address
 * @returns {string|null}
 */
function getServiceWalletAddress() {
  const wallet = blockchain.getServiceWallet();
  return wallet ? wallet.address : null;
}

/**
 * Get contract addresses from env
 * @returns {object}
 */
function getContractAddresses() {
  return {
    fitToken: process.env.FITTOKEN_CONTRACT_ADDRESS || null,
    membershipManager: process.env.MEMBERSHIP_CONTRACT_ADDRESS || null,
    checkIn: process.env.CHECKIN_CONTRACT_ADDRESS || null,
    achievementBadge: process.env.ACHIEVEMENT_CONTRACT_ADDRESS || null,
  };
}

module.exports = {
  // Contract state readers
  getMembershipInfo,
  getCheckInInfo,
  getFitTokenBalance,
  getBadgesByOwner,
  getTokenURI,
  // Transaction verification
  verifyTransaction,
  // Service wallet calls
  mintFitToken,
  mintBadge,
  // Log parsing & recording
  parseAndRecordTransferEvents,
  recordTokenTransaction,
  // Utility
  getServiceWalletAddress,
  getContractAddresses,
};
