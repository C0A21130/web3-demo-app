// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC5192} from "./IERC5192.sol";
import {ERC5192} from "./ERC5192.sol";

contract SBTTestTokenM3 is ERC5192, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _nextTokenId;
    // 貢献の詳細のマッピング
    mapping(uint256 => string) private _tokenNames;

    bool private isLocked;

    constructor(
        string memory _name,
        string memory _symbol,
        bool _isLocked,
        address ownerAdmin,
        address minter1,
        address minter2
    ) ERC5192(_name, _symbol, _isLocked) {
        isLocked = _isLocked;
        _grantRole(DEFAULT_ADMIN_ROLE, ownerAdmin);
        _grantRole(MINTER_ROLE, minter1);
        _grantRole(MINTER_ROLE, minter2);
    }

    function safeMint(
        address to,
        uint256 tokenId,
        string memory tokenName
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        _safeMint(to, tokenId);
        _tokenNames[tokenId] = tokenName;
        if (isLocked) emit Locked(tokenId);
        return tokenId;
    }

    function getTokenName(uint256 tokenId) public view returns (string memory) {
        return _tokenNames[tokenId];
    }

    // supportsInterfaceをオーバーライドしてERC5192およびAccessControlに対応
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC5192, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}