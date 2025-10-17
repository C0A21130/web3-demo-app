// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC5192} from "./ERC5192.sol";

contract MemberSBT_Demo is ERC5192, AccessControl {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _userNames;
    event SBTMinted(address indexed to, uint256 indexed tokenId, string userName);

    constructor(
        string memory _name,
        string memory _symbol,
        bool _isLocked,
        address ownerAdmin
    ) ERC5192(_name, _symbol, _isLocked) {
        _grantRole(DEFAULT_ADMIN_ROLE, ownerAdmin);
    }

    function safeMint(
        address to,
        string memory userName
    ) external returns (uint256) {
        require(to == msg.sender, "MemberSBT_Demo: You can only mint an SBT for yourself.");

        uint256 tokenId = _nextTokenId;
        _safeMint(to, tokenId);
        _nextTokenId++;
        _userNames[tokenId] = userName;
        emit SBTMinted(to, tokenId, userName);
        return tokenId;
    }
    
    function getUserName(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "MemberSBT: Query for nonexistent token");
        return _userNames[tokenId];
    }

    function getTotalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    // 既に発行されたSBTの所有者かどうかを検証する関数
    function verifyCredential(uint256 tokenId, address userAddress) public view returns (bool) {
        require(_exists(tokenId), "MemberSBT: Query for nonexistent token");
        return ownerOf(tokenId) == userAddress;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC5192, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}