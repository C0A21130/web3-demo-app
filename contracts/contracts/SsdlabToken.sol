// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SsdlabToken is ERC721, AccessControl {
    bytes32 public constant TEACHER_ROLE = keccak256("TEACHER_ROLE");
    bytes32 public constant STUDENTS_ROLE = keccak256("STUDENTS_ROLE"); 
    uint256 private _nextTokenId = 0;

    // 貢献の詳細のマッピング
    mapping(uint256 => string) private _tokenNames;

    // 交換のトークンIDのマッピング
    mapping(uint256 => uint256) private _exchangeTokenIds;

    // ウォレットアドレスのマッピング
    mapping(string => address) private _userAddresses;

    constructor(address teacher, address student) ERC721("MyToken", "") {
        _grantRole(DEFAULT_ADMIN_ROLE, teacher);
        _grantRole(STUDENTS_ROLE, student);
    }

    function safeMint(address to, string memory _tokenName) public returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _safeMint(to, tokenId);
        setTokenName(tokenId, _tokenName);
        _nextTokenId++;
        return tokenId;
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function sendTransaction(address payable _to) public payable {
        _to.transfer(msg.value);
    }

    // トークン名を設定する関数
    function setTokenName(uint256 tokenId, string memory tokenName) public {
        _tokenNames[tokenId] = tokenName;
    }
    
    // トークン名を取得する関数
    function getTokenName(uint256 tokenId) public view returns (string memory) {
        return _tokenNames[tokenId];
    }

    // 交換のトークンIDを設定する関数
    function setExchangeTokenId(uint256 tokenId, uint256 exchangeTokenId) public {
        _exchangeTokenIds[tokenId] = exchangeTokenId;
    }

    // 交換のトークンIDを取得する関数
    function getExchangeTokenId(uint256 tokenId) public view returns (uint256) {
        return _exchangeTokenIds[tokenId];
    }

    // ユーザーアドレスを設定する関数
    function setUserAddress(string memory userName, address userAddress) public {
        _userAddresses[userName] = userAddress;
    }

    // ユーザーアドレスを取得する関数
    function getUserAddress(string memory userName) public view returns (address) {
        return _userAddresses[userName];
    }

}