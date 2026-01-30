// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TrustRating.sol";

/**
 * @title Scoring
 * @dev 信用スコアを基にアクセス制御するスマートコントラクト
 */
contract Scoring is TrustRating {
    // アクセス制御ポリシー
    // 0: アクセス制御なし
    // 1: 通常ユーザー
    // 2: 適応的ユーザー
    // 3: フリーライダー
    // 4: 孤立ユーザー
    mapping(address => uint8) private policies;

    constructor(address agent) TrustRating(agent) {}

    /// 取引履歴から計算された信用スコアを取得するための関数
    /// @param _user スコアを取得したいユーザーアドレス
    /// @return userScore ユーザーの信用スコア
    function getScore(address _user) public view returns (int8) {
        require(_user != address(0), "Invalid user address");
        int8 userScore = ratingOf(_user);
        return userScore;
    }

    /// 取引履歴から計算された複数の信用スコアを一括で取得するための関数
    /// @param _users スコアを取得したいユーザーアドレスの配列
    /// @return userScores 各ユーザーの信用スコアの配列
    function getScores(address[] memory _users) public view returns (int8[] memory) {
        int8[] memory userScores = new int8[](_users.length);
        for (uint256 i = 0; i < _users.length; i++) {
            userScores[i] = getScore(_users[i]);
        }
        return userScores;
    }

    /// 自身のスコアと取引相手のスコアを比較する関数
    /// @param myAddress 自分のアドレス
    /// @param targetAddress 取引相手のアドレス
    /// @return スコアの比較結果（true: 自分のスコアが高い、false: 取引相手のスコアが高い）
    function compareScore(address myAddress, address targetAddress) public view returns (bool) {
        require(myAddress != address(0), "Invalid myAddress");
        require(targetAddress != address(0), "Invalid targetAddress");
        int8 myScore = getScore(myAddress);
        int8 targetScore = getScore(targetAddress);
        if (myScore >= targetScore) {
            return true;
        } else {
            return false;
        }
    }

    /// ユーザーごとのアクセス制御ポリシーを設定する関数
    /// @param policy アクセス制御ポリシー
    function setPolicy(uint8 policy) public {
        require(policy <= 4, "Invalid policy");
        policies[msg.sender] = policy;
    }

    /// ユーザーごとのアクセス制御ポリシーを取得する関数
    /// @param user ポリシーを取得するユーザーアドレス
    /// @return policy ユーザーのアクセス制御ポリシー
    function getPolicy(address user) public view returns (uint8) {
        require(user != address(0), "Invalid user address");
        return policies[user];
    }
    
    /// NFT取引をする際にユーザーの信用スコアに応じてアクセス制御する関数
    /// @param from 自分のアドレス
    /// @param to 取引相手のアドレス
    /// @return bool 取引成立の場合はtrue、取引キャンセルの場合はfalse
    function accessControl(address from, address to) public view returns(bool) {
        // 入力の検証
        require(to != address(0), "Invalid to address");
        require(from != address(0), "Invalid from address");

        // 取引相手のポリシー取得
        uint8 policy = policies[to];

        // スコア取得
        int8 fromScore = getScore(from);
        int8 toScore = getScore(to);

        // ポリシーに基づくアクセス制御
        if (policy == 0){
            return true;
        } else if (policy == 1) {
            return fromScore >= toScore;
        } else if (policy == 2) {
            bool from_known = edgeCount[to][from];
            bool to_known = edgeCount[from][to];
            return (fromScore >= toScore) || (from_known || to_known);
        } else if (policy == 3) {
            return (fromScore >= toScore) && (fromScore >= averageRating);   
        } else if (policy == 4) {
            return false;
        }
        return false;
    }
}
