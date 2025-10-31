// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Centrality.sol";

/**
 * @title Scoring
 * @dev 次数中心性を計算するスマートコントラクト
 * ユーザーアドレスを頂点として、ユーザー間の接続関係を管理し、次数中心性を算出する
 */
contract Scoring is Centrality {
    mapping(address => int8) private scores;
    mapping(address => bool) private userLevels;

    /// ユーザーレベルを設定する関数
    /// @param _userAddress レベルを設定するユーザーアドレス
    function setUserLevel(address _userAddress) public {
        require(_userAddress != address(0), "Invalid user address");
        userLevels[_userAddress] = userLevels[_userAddress] ? true : false;
    }

    /// ユーザーレベルを取得する関数
    /// @param _userAddress レベルを取得するユーザーアドレス
    /// @return ユーザーレベル（true: 高レベルユーザー, false: 通常ユーザー）
    function getUserLevel(address _userAddress) public view returns (bool) {
        return userLevels[_userAddress];
    }

    /// 取引履歴から計算された信用スコアを取得するための関数
    /// @param _user スコアを取得したいユーザーアドレス
    /// @return userScore ユーザーの信用スコア
    function getScore(address _user) public view returns (int8) {
        require(_user != address(0), "Invalid user address");
        return Centrality.calculateDegreeCentrality(_user);
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

    /// 指定されたアドレスが、指定された信用スコア以上であるかどうかを確認するための関数
    /// @param myAddress 自分のアドレス
    /// @param targetAddress 取引相手のアドレス
    /// @return basicCondition 自分のスコアが相手以上であればtrue
    function verifyScore(address myAddress, address targetAddress) public view returns (bool) {
        require(myAddress != address(0), "Invalid myAddress");
        require(targetAddress != address(0), "Invalid targetAddress");
        
        int8 myScore = getScore(myAddress);
        int8 targetScore = getScore(targetAddress);

        // 基本条件：自分のスコアが相手以上かどうか
        bool basicCondition = myScore >= targetScore;

        return basicCondition;
    }

    /// 配列を選択ソートで降順ソートする内部関数
    /// @param arr ソート対象のint8配列
    function _selectionSort(int8[] memory arr) private pure {
        uint256 n = arr.length;
        
        for (uint256 i = 0; i < n - 1; i++) {
            uint256 maxIndex = i;
            
            // 残りの要素から最大値を見つける
            for (uint256 j = i + 1; j < n; j++) {
                if (arr[j] > arr[maxIndex]) {
                    maxIndex = j;
                }
            }
            
            // 最大値を現在の位置にスワップ
            if (maxIndex != i) {
                (arr[i], arr[maxIndex]) = (arr[maxIndex], arr[i]);
            }
        }
    }
    
    /// NFT取引をする際にユーザーの信用スコアに応じてアクセス制御する関数
    /// @param myAddress 自分のアドレス
    /// @param targetAddress 取引相手のアドレス
    /// @return bool 取引成立の場合はtrue、取引キャンセルの場合はfalse
    function accessControl(address myAddress, address targetAddress) public view returns (bool) {
        require(myAddress != address(0), "Invalid myAddress");
        require(targetAddress != address(0), "Invalid targetAddress");
        
        // スコアを取得
        int8 myScore = getScore(myAddress);
        int8 targetScore = getScore(targetAddress);

        // 全ユーザーのスコア分布を取得する
        address[] memory allUsers = getAllUsers();
        uint256 totalUsers = allUsers.length;
        
        // ユーザーが10人未満の場合はアクセス制御なし
        if (totalUsers < 10) {
            return true;
        }
        
        // 全ユーザーのスコアを取得
        int8[] memory allScores = new int8[](totalUsers);
        for (uint256 i = 0; i < totalUsers; i++) {
            allScores[i] = getScore(allUsers[i]);
        }
        
        // スコアをソート（降順）
        _selectionSort(allScores);
        
        // 相手（targetAddress）のUserLevelに基づいて閾値を設定
        bool targetUserLevel = getUserLevel(targetAddress);
        uint8 topPercent = targetUserLevel ? 30 : 10;    // 相手のレベルに応じた上位閾値
        uint8 bottomPercent = targetUserLevel ? 30 : 10; // 相手のレベルに応じた下位閾値
        
        uint256 topIndex = (totalUsers * topPercent) / 100;
        uint256 bottomIndex = totalUsers - (totalUsers * bottomPercent) / 100;
        
        int8 topThreshold = allScores[topIndex > 0 ? topIndex - 1 : 0];
        int8 bottomThreshold = allScores[bottomIndex < totalUsers ? bottomIndex : totalUsers - 1];

        // targetAddressが上位のユーザーかどうか判定
        bool isTargetTop = targetScore >= topThreshold;
        
        // myAddressが下位のユーザーかどうか判定
        bool isMyAddressBottom = myScore <= bottomThreshold;
        
        // アクセス制御の判定
        // 相手が上位で、自分が下位の場合は取引キャンセル
        if (isTargetTop && isMyAddressBottom) {
            return false; // 取引キャンセル
        } else {
            return true;  // 取引成立
        }
    }
}
