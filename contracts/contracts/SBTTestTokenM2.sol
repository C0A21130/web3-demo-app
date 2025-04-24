// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC5192} from "./IERC5192.sol";
import {ERC5192} from "./ERC5192.sol";

contract SBT is ERC5192 {
  bool private isLocked;
  constructor(string memory _name, string memory _symbol, bool _isLocked)
    ERC5192(_name, _symbol, _isLocked)
  {
    isLocked = _isLocked;
  }
  function safeMint(address to, uint256 tokenId) external {
    _safeMint(to, tokenId);
    if (isLocked) emit Locked(tokenId);
  }
}