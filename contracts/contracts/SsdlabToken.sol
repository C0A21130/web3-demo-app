// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./scoring/Scoring.sol";

contract SsdlabToken is ERC721, AccessControl, Scoring {
    // 状態変数の定義
    uint256 private _nextTokenId = 0;
    mapping(uint256 => string) private _tokenNames;
    mapping(address => uint8) private _receiveCount;

    // イベントの定義
    event Receive(string);
    event Fallback(string);

    constructor(address agent) ERC721("MyToken", "") Scoring(agent) {
        _grantRole(DEFAULT_ADMIN_ROLE, agent);
    }

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
        _setTokenURI(tokenId, _tokenURI);
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
        addEdge(from, to);
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

    /// 指定したアドレスに0.1 Etherを送信する関数
    /// @param _to Etherを受け取るアドレス
    function faucet(address _to) public payable {
        // check: パラメータや残高の確認
        require(_to != address(0), "Invalid address");
        require(address(this).balance > 0.3 ether, "Insufficient balance");
        require(_to.balance < 0.1 ether, "Recipient has sufficient balance");

        // effects: 状態変数である受信カウントの更新
        _receiveCount[_to] += 1;

        // interactions: _toへEtherの送信
        (bool success, ) = _to.call{value: 0.1 ether}("");
        require(success, "Transfer failed");
    }

    /// @dev See {ERC165-supportsInterface}, {AccessControl-supportsInterface}, {Scoring-supportsInterface}.
    /// @param interfaceId インターフェースのID
    /// @return isSupported インターフェースがサポートされているかどうかを確認する
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl, Scoring)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Ether受信時の処理
    receive() external payable {
        emit Receive("Received called");
    }

    // フォールバック関数
    fallback() external payable {
        emit Fallback("Fallback called");
    }
}
