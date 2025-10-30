// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC5192} from "./ERC5192.sol";

/**
 * @title MemberSbtDemo
 * @dev デモ・開発用のSoulbound Token（譲渡不可能NFT）コントラクト
 * 
 * 主な特徴:
 * - 自分自身にのみSBTを発行可能（権限管理なし）
 * - ユーザー名とトークンIDを紐付け
 * - SBT所有権の検証機能を提供
 */
contract MemberSbtDemo is ERC5192, AccessControl {
    // 次に発行するトークンID
    uint256 private _nextTokenId;
    
    // トークンIDとユーザー名のマッピング
    mapping(uint256 => string) private _userNames;
    
    // SBT発行時に発火するイベント
    event SBTMinted(address indexed to, uint256 indexed tokenId, string userName);

    /**
     * @dev コンストラクタ
     * @param _name SBTの名前
     * @param _symbol SBTのシンボル
     * @param _isLocked ロック状態（通常はtrue）
     * @param ownerAdmin 管理者アドレス
     */
    constructor(
        string memory _name,
        string memory _symbol,
        bool _isLocked,
        address ownerAdmin
    ) ERC5192(_name, _symbol, _isLocked) {
        _grantRole(DEFAULT_ADMIN_ROLE, ownerAdmin);
    }

    /**
     * @dev SBTを発行する（自分自身にのみ発行可能）
     * @param to 発行先アドレス（msg.senderと一致する必要がある）
     * @param userName SBTに紐付けるユーザー名
     * @return tokenId 発行されたトークンID
     */
    function safeMint(
        address to,
        string memory userName
    ) external returns (uint256) {
        require(to == msg.sender, "MemberSbtDemo: You can only mint an SBT for yourself.");

        uint256 tokenId = _nextTokenId;
        _safeMint(to, tokenId);
        _nextTokenId++;
        _userNames[tokenId] = userName;
        emit SBTMinted(to, tokenId, userName);
        return tokenId;
    }
    
    /**
     * @dev トークンIDに紐付けられたユーザー名を取得
     * @param tokenId トークンID
     * @return ユーザー名
     */
    function getUserName(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "MemberSBT: Query for nonexistent token");
        return _userNames[tokenId];
    }

    /**
     * @dev 発行済みSBTの総数を取得
     * @return 総発行数
     */
    function getTotalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev 指定されたアドレスが特定のSBTを所有しているか検証
     * @param tokenId 検証するトークンID
     * @param userAddress 検証するユーザーアドレス
     * @return 所有している場合true、そうでない場合false
     */
    function verifyCredential(uint256 tokenId, address userAddress) public view returns (bool) {
        require(_exists(tokenId), "MemberSBT: Query for nonexistent token");
        return ownerOf(tokenId) == userAddress;
    }

    /**
     * @dev インターフェースサポートの確認（ERC165準拠）
     * @param interfaceId 確認するインターフェースID
     * @return サポートしている場合true
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC5192, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}