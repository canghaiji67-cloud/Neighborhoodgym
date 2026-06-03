// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MembershipManager is Ownable, ReentrancyGuard {
    uint256 public constant MONTHLY_PRICE = 0.01 ether;
    uint256 public constant QUARTERLY_PRICE = 0.025 ether;
    uint256 public constant YEARLY_PRICE = 0.08 ether;

    struct Member {
        bool isRegistered;
        uint256 expiresAt;
        uint8 currentPlan;
    }

    mapping(address => Member) private members;

    event MemberRegistered(address indexed member);
    event MembershipPurchased(
        address indexed member,
        uint8 planType,
        uint256 expiresAt,
        uint256 amount
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    function register() external {
        require(
            !members[msg.sender].isRegistered,
            "MembershipManager: already registered"
        );
        members[msg.sender].isRegistered = true;
        emit MemberRegistered(msg.sender);
    }

    function purchaseMembership(uint8 planType) external payable nonReentrant {
        require(
            members[msg.sender].isRegistered,
            "MembershipManager: not registered"
        );
        require(
            planType >= 1 && planType <= 3,
            "MembershipManager: invalid plan type"
        );

        uint256 price;
        uint256 duration;

        if (planType == 1) {
            price = MONTHLY_PRICE;
            duration = 30 days;
        } else if (planType == 2) {
            price = QUARTERLY_PRICE;
            duration = 90 days;
        } else {
            price = YEARLY_PRICE;
            duration = 365 days;
        }

        require(
            msg.value == price,
            "MembershipManager: incorrect payment amount"
        );

        uint256 currentExpiry = members[msg.sender].expiresAt;
        uint256 startTime = currentExpiry > block.timestamp
            ? currentExpiry
            : block.timestamp;
        uint256 newExpiry = startTime + duration;

        members[msg.sender].expiresAt = newExpiry;
        members[msg.sender].currentPlan = planType;

        emit MembershipPurchased(msg.sender, planType, newExpiry, msg.value);
    }

    function getMembershipInfo(
        address user
    )
        external
        view
        returns (bool isRegistered, uint256 expiresAt, uint8 currentPlan)
    {
        Member storage m = members[user];
        return (m.isRegistered, m.expiresAt, m.currentPlan);
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "MembershipManager: no funds");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "MembershipManager: withdrawal failed");
    }
}
