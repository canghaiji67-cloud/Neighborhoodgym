// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AchievementBadge is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    mapping(address => uint256[]) private _ownedTokens;

    event BadgeMinted(
        address indexed to,
        uint256 indexed tokenId,
        string tokenURI
    );

    constructor(
        address initialOwner
    ) ERC721("GymAchievementBadge", "GAB") Ownable(initialOwner) {
        _nextTokenId = 1;
    }

    function mintBadge(
        address to,
        string calldata tokenURI
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _ownedTokens[to].push(tokenId);
        emit BadgeMinted(to, tokenId, tokenURI);
    }

    function getBadgesByOwner(
        address owner
    ) external view returns (uint256[] memory tokenIds) {
        return _ownedTokens[owner];
    }
}
