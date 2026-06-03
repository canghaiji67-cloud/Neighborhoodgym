// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IFitToken {
    function mint(address to, uint256 amount) external;
}

contract CheckIn is Ownable {
    IFitToken public fitToken;

    uint256 public constant DAILY_REWARD = 10 * 1e18;
    uint256 public constant STREAK_7_REWARD = 50 * 1e18;
    uint256 public constant STREAK_30_REWARD = 300 * 1e18;
    uint256 public constant STREAK_100_REWARD = 1000 * 1e18;

    struct CheckInInfo {
        uint256 totalCount;
        uint256 currentStreak;
        uint256 lastCheckInDay;
    }

    mapping(address => CheckInInfo) private checkInInfos;

    event CheckedIn(
        address indexed user,
        uint256 timestamp,
        uint256 streak,
        uint256 totalCount
    );
    event MilestoneReward(
        address indexed user,
        uint256 streak,
        uint256 reward
    );

    constructor(
        address fitTokenAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        require(
            fitTokenAddress != address(0),
            "CheckIn: fitToken is zero address"
        );
        fitToken = IFitToken(fitTokenAddress);
    }

    function checkIn() external {
        uint256 today = block.timestamp / 86400;
        CheckInInfo storage info = checkInInfos[msg.sender];

        require(
            info.lastCheckInDay != today,
            "CheckIn: already checked in today"
        );

        if (info.lastCheckInDay == today - 1) {
            info.currentStreak += 1;
        } else {
            info.currentStreak = 1;
        }

        info.totalCount += 1;
        info.lastCheckInDay = today;

        // Daily reward
        fitToken.mint(msg.sender, DAILY_REWARD);

        // Milestone rewards
        if (info.currentStreak == 7) {
            fitToken.mint(msg.sender, STREAK_7_REWARD);
            emit MilestoneReward(msg.sender, 7, STREAK_7_REWARD);
        } else if (info.currentStreak == 30) {
            fitToken.mint(msg.sender, STREAK_30_REWARD);
            emit MilestoneReward(msg.sender, 30, STREAK_30_REWARD);
        } else if (info.currentStreak == 100) {
            fitToken.mint(msg.sender, STREAK_100_REWARD);
            emit MilestoneReward(msg.sender, 100, STREAK_100_REWARD);
        }

        emit CheckedIn(
            msg.sender,
            block.timestamp,
            info.currentStreak,
            info.totalCount
        );
    }

    function getCheckInInfo(
        address user
    )
        external
        view
        returns (
            uint256 totalCount,
            uint256 currentStreak,
            uint256 lastCheckInDay
        )
    {
        CheckInInfo storage info = checkInInfos[user];
        return (info.totalCount, info.currentStreak, info.lastCheckInDay);
    }
}
