const { Op } = require('sequelize');
const {
  Achievement,
  UserAchievement,
  CheckIn,
  Booking,
  User,
  sequelize,
} = require('../models');
const blockchainService = require('./blockchainService');

// ==================== Condition Checkers ====================

/**
 * Check if a user meets the condition for a specific achievement
 * @param {number} userId - user ID
 * @param {object} achievement - achievement model instance
 * @returns {boolean}
 */
async function checkCondition(userId, achievement) {
  const { conditionType, conditionValue } = achievement;

  switch (conditionType) {
    case 'checkin_total':
      return await checkCheckinTotal(userId, conditionValue);
    case 'checkin_streak':
      return await checkCheckinStreak(userId, conditionValue);
    case 'course_complete':
      return await checkCourseComplete(userId, conditionValue);
    default:
      console.warn(
        `[achievementService] Unknown condition_type: ${conditionType} for achievement #${achievement.id}`
      );
      return false;
  }
}

/**
 * Check if user has enough total check-ins (from MySQL records)
 * @param {number} userId
 * @param {number} threshold
 * @returns {boolean}
 */
async function checkCheckinTotal(userId, threshold) {
  const count = await CheckIn.count({ where: { user_id: userId } });
  return count >= threshold;
}

/**
 * Check if user has reached the required streak (from on-chain data).
 * We read from the CheckIn contract for authoritative streak data.
 * Falls back to MySQL count if blockchain is unavailable.
 * @param {number} userId
 * @param {number} threshold
 * @returns {boolean}
 */
async function checkCheckinStreak(userId, threshold) {
  // Get user wallet address for on-chain query
  const user = await User.findByPk(userId, { attributes: ['walletAddress'] });
  if (!user || !user.walletAddress) {
    return false;
  }

  try {
    const info = await blockchainService.getCheckInInfo(user.walletAddress);
    return info.currentStreak >= threshold;
  } catch (err) {
    // If blockchain is unavailable, fall back to MySQL-based estimation
    // This counts consecutive check-in records from the most recent backwards
    console.warn(
      `[achievementService] Blockchain unavailable for streak check, falling back to MySQL: ${err.message}`
    );
    return await checkCheckinStreakFromDB(userId, threshold);
  }
}

/**
 * Fallback: estimate current streak from MySQL check-in records
 * @param {number} userId
 * @param {number} threshold
 * @returns {boolean}
 */
async function checkCheckinStreakFromDB(userId, threshold) {
  const records = await CheckIn.findAll({
    where: { user_id: userId },
    attributes: ['checkInDate'],
    order: [['check_in_date', 'DESC']],
    limit: threshold + 1,
    raw: true,
  });

  if (records.length < threshold) {
    return false;
  }

  let streak = 1;
  for (let i = 1; i < records.length; i++) {
    const prev = new Date(records[i - 1].checkInDate || records[i - 1].check_in_date);
    const curr = new Date(records[i].checkInDate || records[i].check_in_date);
    const diffDays = Math.round((prev - curr) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      streak++;
      if (streak >= threshold) return true;
    } else {
      break;
    }
  }

  return streak >= threshold;
}

/**
 * Check if user has completed enough courses (checked_in status in bookings)
 * @param {number} userId
 * @param {number} threshold
 * @returns {boolean}
 */
async function checkCourseComplete(userId, threshold) {
  const count = await Booking.count({
    where: {
      user_id: userId,
      status: 'checked_in',
    },
  });
  return count >= threshold;
}

// ==================== Achievement Listing ====================

/**
 * Get all achievements with user's claim status
 * @param {number} userId
 * @returns {object[]} achievements with additional `claimed` and `canClaim` fields
 */
async function getAchievementsWithStatus(userId) {
  const achievements = await Achievement.findAll({
    order: [['id', 'ASC']],
  });

  // Get user's already-claimed achievements
  const claimed = await UserAchievement.findAll({
    where: { user_id: userId },
    attributes: ['achievement_id', 'nft_token_id', 'mint_tx_hash', 'created_at'],
    raw: true,
  });

  const claimedMap = {};
  for (const c of claimed) {
    claimedMap[c.achievement_id] = {
      nftTokenId: c.nft_token_id,
      mintTxHash: c.mint_tx_hash,
      claimedAt: c.created_at,
    };
  }

  // Check each achievement condition
  const results = [];
  for (const ach of achievements) {
    const isClaimed = !!claimedMap[ach.id];
    let canClaim = false;

    if (!isClaimed) {
      canClaim = await checkCondition(userId, ach);
    }

    results.push({
      id: ach.id,
      name: ach.name,
      description: ach.description,
      conditionType: ach.conditionType,
      conditionValue: ach.conditionValue,
      badgeImageCid: ach.badgeImageCid,
      metadataCid: ach.metadataCid,
      rarity: ach.rarity,
      claimed: isClaimed,
      canClaim,
      claimInfo: isClaimed ? claimedMap[ach.id] : null,
    });
  }

  return results;
}

// ==================== Achievement Claim ====================

/**
 * Claim an achievement: verify conditions, mint NFT on-chain, record in MySQL
 * @param {number} userId - the claiming user's ID
 * @param {number} achievementId - the achievement to claim
 * @returns {object} - { userAchievement, txHash, tokenId }
 */
async function claimAchievement(userId, achievementId) {
  // 1. Fetch achievement definition
  const achievement = await Achievement.findByPk(achievementId);
  if (!achievement) {
    throw Object.assign(new Error('Achievement not found'), {
      statusCode: 404,
      code: 'ACHIEVEMENT_NOT_FOUND',
    });
  }

  // 2. Check if already claimed
  const existingClaim = await UserAchievement.findOne({
    where: { user_id: userId, achievement_id: achievementId },
  });
  if (existingClaim) {
    throw Object.assign(new Error('Achievement already claimed'), {
      statusCode: 409,
      code: 'ACHIEVEMENT_ALREADY_CLAIMED',
    });
  }

  // 3. Verify user meets the condition
  const conditionMet = await checkCondition(userId, achievement);
  if (!conditionMet) {
    throw Object.assign(new Error('Achievement condition not met'), {
      statusCode: 400,
      code: 'CONDITION_NOT_MET',
    });
  }

  // 4. Get user wallet address
  const user = await User.findByPk(userId, { attributes: ['id', 'walletAddress'] });
  if (!user || !user.walletAddress) {
    throw Object.assign(new Error('User wallet address not found'), {
      statusCode: 400,
      code: 'WALLET_NOT_FOUND',
    });
  }

  // 5. Build tokenURI from metadata CID
  let tokenURI = '';
  if (achievement.metadataCid) {
    tokenURI = `ipfs://${achievement.metadataCid}`;
  } else {
    // Fallback: use a basic JSON data URI with achievement info
    const metadata = {
      name: achievement.name,
      description: achievement.description,
      image: achievement.badgeImageCid ? `ipfs://${achievement.badgeImageCid}` : '',
      attributes: [
        { trait_type: 'Rarity', value: achievement.rarity },
        { trait_type: 'Condition', value: `${achievement.conditionType}:${achievement.conditionValue}` },
      ],
    };
    tokenURI = `data:application/json;base64,${Buffer.from(JSON.stringify(metadata)).toString('base64')}`;
  }

  // 6. Mint NFT on-chain via service wallet
  let txHash, tokenId;
  try {
    const result = await blockchainService.mintBadge(user.walletAddress, tokenURI);
    txHash = result.txHash;
    tokenId = result.tokenId;
  } catch (err) {
    console.error(`[achievementService] NFT mint failed for user ${userId}, achievement ${achievementId}:`, err.message);
    throw Object.assign(
      new Error(`NFT minting failed: ${err.message}`),
      { statusCode: 500, code: 'NFT_MINT_FAILED' }
    );
  }

  // 7. Record in MySQL (use transaction for safety)
  const userAchievement = await sequelize.transaction(async (t) => {
    // Double-check no race condition
    const doubleCheck = await UserAchievement.findOne({
      where: { user_id: userId, achievement_id: achievementId },
      transaction: t,
    });
    if (doubleCheck) {
      throw Object.assign(new Error('Achievement already claimed (race condition)'), {
        statusCode: 409,
        code: 'ACHIEVEMENT_ALREADY_CLAIMED',
      });
    }

    return await UserAchievement.create(
      {
        userId,
        achievementId,
        nftTokenId: tokenId,
        mintTxHash: txHash,
      },
      { transaction: t }
    );
  });

  console.log(
    `[achievementService] Achievement #${achievementId} claimed by user #${userId}, tokenId: ${tokenId}, txHash: ${txHash}`
  );

  return {
    userAchievement,
    txHash,
    tokenId,
  };
}

// ==================== User Badges ====================

/**
 * Get all badges (claimed achievements) for a user
 * @param {number} userId
 * @returns {object[]}
 */
async function getUserBadges(userId) {
  const badges = await UserAchievement.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Achievement,
        as: 'achievement',
        attributes: ['id', 'name', 'description', 'badgeImageCid', 'metadataCid', 'rarity'],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  return badges.map((b) => ({
    id: b.id,
    achievementId: b.achievementId,
    nftTokenId: b.nftTokenId,
    mintTxHash: b.mintTxHash,
    claimedAt: b.createdAt,
    achievement: b.achievement
      ? {
          id: b.achievement.id,
          name: b.achievement.name,
          description: b.achievement.description,
          badgeImageCid: b.achievement.badgeImageCid,
          metadataCid: b.achievement.metadataCid,
          rarity: b.achievement.rarity,
        }
      : null,
  }));
}

module.exports = {
  checkCondition,
  getAchievementsWithStatus,
  claimAchievement,
  getUserBadges,
};
