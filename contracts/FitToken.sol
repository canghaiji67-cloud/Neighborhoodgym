// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FitToken is ERC20, Ownable {
    mapping(address => bool) public minters;

    event Minted(address indexed to, uint256 amount);

    modifier onlyMinter() {
        require(minters[msg.sender], "FitToken: caller is not a minter");
        _;
    }

    constructor(address initialOwner)
        ERC20("FitToken", "FIT")
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
        emit Minted(to, amount);
    }

    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "FitToken: minter is zero address");
        minters[minter] = true;
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
    }
}
