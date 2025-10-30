// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Centrality.sol";
import "./IERC4974.sol";

/**
 * @title Scoring
 * @dev 次数中心性を計算するスマートコントラクト
 * ユーザーアドレスを頂点として、ユーザー間の接続関係を管理し、次数中心性を算出する
 */
contract Scoring is Centrality, IERC4974 {
    mapping(address => bool) private operators;
    mapping(address => int8) private ratings;
    mapping(address => int8) private scores;

    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(IERC165).interfaceId || interfaceID == type(IERC4974).interfaceId;
    }

    constructor(address _operator) {
        operators[_operator] = true;
        emit NewOperator(_operator);
    }

    modifier onlyOperator() {
        require(operators[msg.sender], "Caller is not the operator");
        _;
    }

    /// @dev See {IERC4974-setOperator}.
    /// 新しいTrust Score Agentのアドレスを設定するための関数
    function setOperator(address _operator) public onlyOperator {
        require(_operator != address(0), "Invalid operator address");
        require(!operators[_operator], "Operator already set");
        operators[_operator] = true;
        emit NewOperator(_operator);
    }

    /// @dev See {IERC4974-rate}.
    /// Trust Score Agentが信用スコアを登録するための関数
    function rate(address _rated, int8 _rating) public onlyOperator {
        // 既存のスコアを削除
        require(_rated != address(0), "Rated address cannot be zero");
        require(_rating >= -127 && _rating <= 127, "Rating must be between -127 and 127");
        
        // 新しいスコアを登録
        ratings[_rated] = _rating;
        emit Rating(_rated, _rating);
    }

    /// @dev See {IERC4974-removeRating}.
    /// Trust Score Agentが登録した信用スコアを削除するための関数
    function removeRating(address _removed) public onlyOperator {
        require(_removed != address(0), "Removed address cannot be zero");
        delete ratings[_removed];
        emit Removal(_removed);
    }

    /// @dev See {IERC4974-ratingOf}.
    /// Trust Score Agentが登録した信用スコアを取得するための関数
    function ratingOf(address _rated) public view returns (int8) {
        return ratings[_rated];
    }

    // 取引履歴から計算された信用スコアを取得するための関数
    function getScore(address _user) public view returns (int8) {
        require(_user != address(0), "Invalid user address");
        return Centrality.calculateDegreeCentrality(_user);
    }

    /// 指定されたアドレスが、指定された信用スコア以上であるかどうかを確認するための関数
    function verifyScore(address myAddress, address targetAddress) public view returns (bool) {
        require(myAddress != address(0), "Invalid myAddress");
        require(targetAddress != address(0), "Invalid targetAddress");
        int8 myScore = getScore(myAddress);
        int8 targetScore = getScore(targetAddress);
        return myScore >= targetScore;
    }
}
