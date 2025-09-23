// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Centrality
 * @dev 次数中心性を計算するスマートコントラクト
 * ユーザーアドレスを頂点として、ユーザー間の接続関係を管理し、次数中心性を算出する
 */
contract Centrality {
    // ユーザーアドレス間の隣接リストを管理
    mapping(address => address[]) public adjacencyList;
    
    // 存在するユーザーアドレスのリスト
    address[] public vertices;
    
    // ユーザーアドレスの存在確認用
    mapping(address => bool) public vertexExists;
    
    // イベント定義
    event UserAdded(address indexed user);
    event ConnectionAdded(address indexed userA, address indexed userB);
    event ConnectionRemoved(address indexed userA, address indexed userB);
    
    /**
     * @dev ユーザーアドレスを頂点として追加
     * @param user 追加するユーザーアドレス
     */
    function addVertex(address user) public {
        require(user != address(0), "Invalid user address");
        require(!vertexExists[user], "User already exists");
        
        vertices.push(user);
        vertexExists[user] = true;
        
        emit UserAdded(user);
    }
    
    /**
     * @dev ユーザー間の辺を追加（無向グラフ）
     * @param userA 接続するユーザーA
     * @param userB 接続するユーザーB
     */
    function addEdge(address userA, address userB) public {
        require(userA != address(0) && userB != address(0), "Invalid user address");
        require(userA != userB, "Self-connection not allowed");
        
        // ユーザーが存在しない場合は自動で追加
        if (!vertexExists[userA]) {
            addVertex(userA);
        }
        if (!vertexExists[userB]) {
            addVertex(userB);
        }
        
        // 重複チェック
        require(!isConnected(userA, userB), "Connection already exists");
        
        // 双方向接続を追加
        adjacencyList[userA].push(userB);
        adjacencyList[userB].push(userA);
        
        emit ConnectionAdded(userA, userB);
    }
    
    /**
     * @dev 指定ユーザーの次数を取得
     * @param user 次数を取得するユーザーアドレス
     * @return ユーザーの次数
     */
    function getDegree(address user) public view returns (uint256) {
        require(vertexExists[user], "User does not exist");
        return adjacencyList[user].length;
    }
    
    /**
     * @dev 指定ユーザーの次数中心性を計算（1000倍したuint256で返す）
     * @param user 次数中心性を計算するユーザーアドレス
     * @return 次数中心性（1000倍した値）
     */
    function calculateDegreeCentrality(address user) public view returns (int8) {
        require(vertexExists[user], "User does not exist");
        require(user != address(0), "Invalid user address");

        int256 userCount = int256(vertices.length);
        if (userCount <= 1) return 0;

        int256 degree = int256(getDegree(user));
        return int8((degree * 100) / (userCount - 1));
    }
    
    /**
     * @dev 全ユーザーの次数中心性を計算
     * @return users ユーザーアドレスの配列
     * @return centralities 対応する次数中心性の配列（1000倍した値）
     */
    function getAllDegreeCentralities() public view returns (address[] memory users, int8[] memory centralities) {
        uint256 userCount = vertices.length;
        users = new address[](userCount);
        centralities = new int8[](userCount);
        
        for (uint256 i = 0; i < userCount; i++) {
            users[i] = vertices[i];
            centralities[i] = calculateDegreeCentrality(vertices[i]);
        }
        
        return (users, centralities);
    }
    
    /**
     * @dev ユーザーの接続相手を取得
     * @param user 接続相手を取得するユーザーアドレス
     * @return 接続相手のアドレス配列
     */
    function getConnections(address user) public view returns (address[] memory) {
        require(vertexExists[user], "User does not exist");
        return adjacencyList[user];
    }
    
    /**
     * @dev 2人のユーザーが接続されているかチェック
     * @param userA ユーザーA
     * @param userB ユーザーB
     * @return 接続されている場合true
     */
    function isConnected(address userA, address userB) public view returns (bool) {
        if (!vertexExists[userA] || !vertexExists[userB]) {
            return false;
        }
        
        address[] memory connections = adjacencyList[userA];
        for (uint256 i = 0; i < connections.length; i++) {
            if (connections[i] == userB) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev 総ユーザー数を取得
     * @return 総ユーザー数
     */
    function getUserCount() public view returns (uint256) {
        return vertices.length;
    }
    
    /**
     * @dev 総接続数を取得
     * @return 総接続数（辺の数）
     */
    function getTotalConnections() public view returns (uint256) {
        uint256 totalDegree = 0;
        for (uint256 i = 0; i < vertices.length; i++) {
            totalDegree += adjacencyList[vertices[i]].length;
        }
        // 無向グラフなので2で割る
        return totalDegree / 2;
    }
    
    /**
     * @dev すべてのユーザーアドレスを取得
     * @return ユーザーアドレスの配列
     */
    function getAllUsers() public view returns (address[] memory) {
        return vertices;
    }
}
