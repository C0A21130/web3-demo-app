// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.13;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import {IERC5192} from "./IERC5192.sol";

abstract contract ERC5192 is ERC721, IERC5192 {
  bool private isLocked;

  error ErrLocked();
  error ErrNotFound();

  constructor(string memory _name, string memory _symbol, bool _isLocked)
    ERC721(_name, _symbol)
  {
    isLocked = _isLocked;
  }

  modifier checkLock() {
    if (isLocked) revert ErrLocked();
    _;
  }

      //to add _exists.
  //mapping(uint256 => address) private _owners;

  function _exists(uint256 tokenId) internal view returns (bool) {
      return _ownerOf(tokenId) != address(0);
  }


  function locked(uint256 tokenId) external view returns (bool) {
    if (!_exists(tokenId)) revert ErrNotFound();
    return isLocked;
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes memory data
  ) public override checkLock {
    super.safeTransferFrom(from, to, tokenId, data);
  }

  // This function is unsupported by the ERC721 standard
  // function safeTransferFrom(address from, address to, uint256 tokenId)
  //   public
  //   override
  //   checkLock
  // {
  //   super.safeTransferFrom(from, to, tokenId);
  // }

  function transferFrom(address from, address to, uint256 tokenId)
    public
    override
    checkLock
  {
    super.transferFrom(from, to, tokenId);
  }

  function approve(address approved, uint256 tokenId) public override checkLock {
    super.approve(approved, tokenId);
  }

  function setApprovalForAll(address operator, bool approved)
    public
    override
    checkLock
  {
    super.setApprovalForAll(operator, approved);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override
    returns (bool)
  {
    return interfaceId == type(IERC5192).interfaceId
      || super.supportsInterface(interfaceId);
  }
}
