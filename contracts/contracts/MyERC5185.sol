// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";

/**
 * @title MyERC5185
 * @dev ERC721 NFTコントラクトにERC5185/ERC4906（Metadata Update Extension）を実装
 * 
 * ERC5185はERC4906としても知られており、以下の目的で使用されます:
 * - NFTメタデータの更新をオンチェーンで通知
 * - マーケットプレイスやインデクサーがメタデータの変更を検知可能にする
 * - オフチェーンストレージ（IPFS等）のメタデータ更新との連携
 * 
 * 機能:
 * - NFTの発行（ミント）
 * - メタデータURIの更新とMetadataUpdateイベントの発行
 * - バッチメタデータ更新とBatchMetadataUpdateイベントの発行
 * - ロイヤリティ設定（ERC2981）
 * - アクセス制御（AccessControl）
 */
contract MyERC5185 is ERC721Enumerable, ERC721URIStorage, AccessControl, ERC2981 {
    /// @dev tokenIdを自動インクリメントするためのカウンター
    uint256 private _tokenIdCounter;

    /// @dev このNFTをミントできる権限を表す定数
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev メタデータを更新できる権限を表す定数
    bytes32 public constant METADATA_UPDATER_ROLE = keccak256("METADATA_UPDATER_ROLE");

    /// @dev ERC4906のインターフェースID (0x49064906)
    bytes4 private constant ERC4906_INTERFACE_ID = bytes4(0x49064906);

    /// @dev メタデータ更新履歴を保存する構造体
    struct MetadataHistory {
        string uri;
        uint256 timestamp;
        address updatedBy;
    }

    /// @dev tokenIdごとのメタデータ更新履歴
    mapping(uint256 => MetadataHistory[]) private _metadataHistories;

    /// @dev メタデータが更新されたときに発行されるカスタムイベント（詳細情報付き）
    event MetadataUpdated(
        uint256 indexed tokenId,
        string oldURI,
        string newURI,
        address indexed updatedBy,
        uint256 timestamp
    );

    /**
     * @dev コンストラクタ
     * @param _name NFTコレクションの名前
     * @param _symbol NFTコレクションのシンボル
     */
    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        // デプロイヤーに各種ロールを付与
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(MINTER_ROLE, _msgSender());
        _grantRole(METADATA_UPDATER_ROLE, _msgSender());
    }

    /**
     * @dev NFTを作成する関数
     * @param to NFTの受取アドレス
     * @param _tokenURI メタデータのURI（IPFS CID等）
     * @return tokenId 作成されたNFTのtokenId
     */
    function safeMint(address to, string memory _tokenURI) public onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter += 1;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);
        _setTokenRoyalty(tokenId, to, 500); // 5%のロイヤリティ

        // 初期メタデータを履歴に記録
        _metadataHistories[tokenId].push(MetadataHistory({
            uri: _tokenURI,
            timestamp: block.timestamp,
            updatedBy: _msgSender()
        }));

        return tokenId;
    }

    /**
     * @dev ERC5185準拠: 単一のNFTのメタデータURIを更新する
     * @param tokenId 更新するNFTのtokenId
     * @param newURI 新しいメタデータURI
     * 
     * 要件:
     * - tokenIdが存在すること
     * - 呼び出し者がトークンの所有者、承認者、またはMETADATA_UPDATER_ROLEを持っていること
     */
    function updateTokenURI(uint256 tokenId, string memory newURI) public {
        require(_exists(tokenId), "ERC5185: URI update for nonexistent token");
        require(
            _isApprovedOrOwner(_msgSender(), tokenId) || hasRole(METADATA_UPDATER_ROLE, _msgSender()),
            "ERC5185: caller is not owner, approved, or metadata updater"
        );

        string memory oldURI = tokenURI(tokenId);
        _setTokenURI(tokenId, newURI);

        // メタデータ履歴を記録
        _metadataHistories[tokenId].push(MetadataHistory({
            uri: newURI,
            timestamp: block.timestamp,
            updatedBy: _msgSender()
        }));

        // ERC5185/ERC4906 MetadataUpdateイベントを発行
        emit MetadataUpdate(tokenId);

        // カスタムの詳細イベントも発行
        emit MetadataUpdated(tokenId, oldURI, newURI, _msgSender(), block.timestamp);
    }

    /**
     * @dev ERC5185準拠: 複数のNFTのメタデータURIをバッチ更新する
     * @param tokenIds 更新するNFTのtokenId配列
     * @param newURIs 新しいメタデータURI配列
     * 
     * 要件:
     * - tokenIds配列とnewURIs配列の長さが同じであること
     * - 各tokenIdが存在すること
     * - 呼び出し者がMETADATA_UPDATER_ROLEを持っていること
     */
    function batchUpdateTokenURIs(uint256[] memory tokenIds, string[] memory newURIs) public onlyRole(METADATA_UPDATER_ROLE) {
        require(tokenIds.length == newURIs.length, "ERC5185: arrays length mismatch");
        require(tokenIds.length > 0, "ERC5185: empty arrays");

        uint256 fromTokenId = type(uint256).max;
        uint256 toTokenId = 0;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(_exists(tokenIds[i]), "ERC5185: URI update for nonexistent token");

            string memory oldURI = tokenURI(tokenIds[i]);
            _setTokenURI(tokenIds[i], newURIs[i]);

            // メタデータ履歴を記録
            _metadataHistories[tokenIds[i]].push(MetadataHistory({
                uri: newURIs[i],
                timestamp: block.timestamp,
                updatedBy: _msgSender()
            }));

            // カスタムの詳細イベントを発行
            emit MetadataUpdated(tokenIds[i], oldURI, newURIs[i], _msgSender(), block.timestamp);

            // 範囲の計算
            if (tokenIds[i] < fromTokenId) fromTokenId = tokenIds[i];
            if (tokenIds[i] > toTokenId) toTokenId = tokenIds[i];
        }

        // ERC5185/ERC4906 BatchMetadataUpdateイベントを発行
        emit BatchMetadataUpdate(fromTokenId, toTokenId);
    }

    /**
     * @dev ERC5185準拠: 連続する範囲のNFTのメタデータ更新を通知する
     * @param fromTokenId 更新範囲の開始tokenId
     * @param toTokenId 更新範囲の終了tokenId
     * 
     * このメソッドは実際のメタデータを変更せず、イベントのみを発行します。
     * オフチェーンでメタデータが更新された場合（例: IPFSの内容が変更された場合）に使用します。
     */
    function emitBatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId) public onlyRole(METADATA_UPDATER_ROLE) {
        require(fromTokenId <= toTokenId, "ERC5185: invalid range");
        emit BatchMetadataUpdate(fromTokenId, toTokenId);
    }

    /**
     * @dev 特定のNFTのメタデータ更新履歴を取得する
     * @param tokenId 履歴を取得するNFTのtokenId
     * @return uris URIの配列
     * @return timestamps タイムスタンプの配列
     * @return updaters 更新者アドレスの配列
     */
    function getMetadataHistory(uint256 tokenId) public view returns (
        string[] memory uris,
        uint256[] memory timestamps,
        address[] memory updaters
    ) {
        require(_exists(tokenId), "ERC5185: query for nonexistent token");

        MetadataHistory[] storage histories = _metadataHistories[tokenId];
        uint256 length = histories.length;

        uris = new string[](length);
        timestamps = new uint256[](length);
        updaters = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            uris[i] = histories[i].uri;
            timestamps[i] = histories[i].timestamp;
            updaters[i] = histories[i].updatedBy;
        }

        return (uris, timestamps, updaters);
    }

    /**
     * @dev 特定のNFTのメタデータ更新回数を取得する
     * @param tokenId カウントを取得するNFTのtokenId
     * @return count 更新回数
     */
    function getMetadataUpdateCount(uint256 tokenId) public view returns (uint256) {
        require(_exists(tokenId), "ERC5185: query for nonexistent token");
        return _metadataHistories[tokenId].length;
    }

    /**
     * @dev ミンター権限を付与する
     * @param account 権限を付与するアドレス
     */
    function grantMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, account);
    }

    /**
     * @dev メタデータ更新権限を付与する
     * @param account 権限を付与するアドレス
     */
    function grantMetadataUpdaterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(METADATA_UPDATER_ROLE, account);
    }

    // ============ オーバーライド関数 ============

    /**
     * @dev tokenURIを返却する
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev NFTの作成やtransfer時に呼び出されるhook
     */
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev balanceOf等で使用されるhook
     */
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    /**
     * @dev ERC-165 supportsInterface
     * ERC4906のインターフェースIDもサポートとして宣言
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, ERC721URIStorage, AccessControl, ERC2981) returns (bool) {
        return interfaceId == ERC4906_INTERFACE_ID || super.supportsInterface(interfaceId);
    }

    /**
     * @dev トークンが存在するかどうかを確認する内部関数
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev 呼び出し者がトークンの所有者または承認者かどうかを確認する内部関数
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }
}
