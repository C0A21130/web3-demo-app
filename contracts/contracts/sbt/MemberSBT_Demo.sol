// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC5192} from "./ERC5192.sol";

contract MemberSBT_Demo is ERC5192, AccessControl {
    uint256 private _nextTokenId;
    mapping(uint256 => string) private _userNames;
    event SBTMinted(address indexed to, uint256 indexed tokenId, string userName);

    // ★ 変更点: デモ用なので、コンストラクタをシンプルにしました
    constructor(
        string memory _name,
        string memory _symbol,
        bool _isLocked,
        address ownerAdmin
    ) ERC5192(_name, _symbol, _isLocked) {
        // 管理者ロールは念のため設定しておきます
        _grantRole(DEFAULT_ADMIN_ROLE, ownerAdmin);
    }

    // ----------------------------------------------------------------
    // ■ safeMint (SBT発行関数) - デモ版
    // ----------------------------------------------------------------
    // ★ 変更点: `onlyRole(MINTER_ROLE)`を削除し、誰でも実行できるようにしました。
    // 代わりに、自分自身にしか発行できないように`require`文を追加しています。
    // ----------------------------------------------------------------
    function safeMint(
        address to,
        string memory userName
    ) external /* onlyRole(MINTER_ROLE) */ returns (uint256) {
        require(to == msg.sender, "MemberSBT_Demo: You can only mint an SBT for yourself.");

        uint256 tokenId = _nextTokenId;
        _safeMint(to, tokenId);
        _nextTokenId++;
        _userNames[tokenId] = userName;
        emit SBTMinted(to, tokenId, userName);
        return tokenId;
    }
    
    // --- (以下、変更なし) ---

    function getUserName(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "MemberSBT: Query for nonexistent token");
        return _userNames[tokenId];
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