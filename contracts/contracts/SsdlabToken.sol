// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./scoring/Scoring.sol";

contract SsdlabToken is ERC721, Scoring {
    // 状態変数の定義
    uint256 private _nextTokenId = 0;
    mapping(uint256 => string) private _tokenNames;
    mapping(uint256 => string) private _tokenURIs;

    constructor(address agent) ERC721("SsdlabToken", "SSDLAB") Scoring(agent) {}

    /// トークンを発行する関数
    /// @param to トークンを受け取るアドレス
    /// @param _tokenName トークン名
    /// @return tokenId ミントされたトークンのID
    function safeMint(address to, string memory _tokenName) public returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _safeMint(to, tokenId);
        setTokenName(tokenId, _tokenName);
        _nextTokenId++;
        return tokenId;
    }

    /// IPFS URI付きでトークンを発行する関数
    /// @param to トークンを受け取るアドレス
    /// @param _tokenName トークン名
    /// @param _tokenURI トークンのIPFS URI
    /// @return tokenId ミントされたトークンのID
    function safeMintIPFS(address to, string memory _tokenName, string memory _tokenURI) public returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _safeMint(to, tokenId);
        setTokenName(tokenId, _tokenName);
        setTokenURI(tokenId, _tokenURI);
        _nextTokenId++;
        return tokenId;
    }
    
    /// トークンを転送する関数
    /// @param from 送信元アドレス
    /// @param to 送信先アドレス
    /// @param tokenId 転送するトークンのID
    function transferFrom(address from, address to, uint256 tokenId) public override {
        // アクセス制御の確認
        bool allowed = accessControl(from, to);
        require(allowed, "Transfer not allowed due to scoring rules");

        // NFTの交換と取引履歴の更新
        super.transferFrom(from, to, tokenId);
        TrustRating.edgeCount[from][to] = true;
        TrustRating.edgeCount[to][from] = true;
    }

    /// 安全にトークンを転送する関数（データ付き）
    /// @param from 送信元アドレス
    /// @param to 送信先アドレス
    /// @param tokenId 転送するトークンのID
    /// @param data 受信先コントラクトへ渡す任意データ
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    /// トークン名を設定する関数
    /// @param tokenId トークンのID
    /// @param tokenName トークン名
    function setTokenName(uint256 tokenId, string memory tokenName) public {
        _tokenNames[tokenId] = tokenName;
    }

    //// トークン名を取得する関数
    /// @param tokenId トークンのID
    /// @return tokenName トークン名
    function getTokenName(uint256 tokenId) public view returns (string memory) {
        return _tokenNames[tokenId];
    }

    /// トークンURLを設定する関数
    /// @param tokenId トークンのID
    /// @param tokenUrl トークンURL
    function setTokenURI(uint256 tokenId, string memory tokenUrl) public {
        _tokenURIs[tokenId] = tokenUrl;
    }

    /// トークンURIを取得する関数
    /// @param tokenId トークンのID
    /// @return tokenUrl トークンURL
    function getTokenURI(uint256 tokenId) public view returns (string memory) {
        return _tokenURIs[tokenId];
    }

    /// @dev See {ERC165-supportsInterface}, {Scoring-supportsInterface}.
    /// @param interfaceId インターフェースのID
    /// @return isSupported インターフェースがサポートされているかどうかを確認する
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, TrustRating)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
