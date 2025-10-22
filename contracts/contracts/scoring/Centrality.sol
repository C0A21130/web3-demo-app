// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Centrality
 * @dev 次数中心性を計算するスマートコントラクト
 * ユーザーアドレスを頂点として、ユーザー間の接続関係を管理し、次数中心性を算出する
 * 自己ループは許容しないが、同一ユーザー間の複数の辺（多重辺）を許容する
 */
contract Centrality {
    // ユーザーアドレス間の隣接リストを管理（多重辺対応）
    mapping(address => address[]) public adjacencyList;
    
    // 同一ユーザー間の辺の数を管理
    mapping(address => mapping(address => uint256)) public edgeCount;
    
    // 存在するユーザーアドレスのリスト
    address[] public vertices;
    
    // ユーザーアドレスの存在確認用
    mapping(address => bool) public vertexExists;
    
    // イベント定義
    event UserAdded(address indexed user);
    event ConnectionAdded(address indexed userA, address indexed userB, uint256 edgeNumber);
    
    /**
     * @dev ユーザーアドレスを頂点として追加
     * @param user 追加するユーザーアドレス
     */
    function addVertex(address user) public {
        require(user != address(0), "Invalid user address");
        if (vertexExists[user]) {
            return;
        }
        
        vertices.push(user);
        vertexExists[user] = true;
        
        emit UserAdded(user);
    }
    
    /**
     * @dev ユーザー間の辺を追加（無向多重グラフ）
     * @param userA 接続するユーザーA
     * @param userB 接続するユーザーB
     * @return edgeNumber 追加された辺の番号（何本目の辺か）
     */
    function addEdge(address userA, address userB) public returns (uint256 edgeNumber) {
        require(userA != address(0) && userB != address(0), "Invalid user address");
        require(userA != userB, "Self-connection not allowed");
        
        // ユーザーが存在しない場合は自動で追加
        if (!vertexExists[userA]) {
            addVertex(userA);
        }
        if (!vertexExists[userB]) {
            addVertex(userB);
        }
        
        // 多重辺として追加
        adjacencyList[userA].push(userB);
        adjacencyList[userB].push(userA);
        
        // 辺の数をカウント
        edgeCount[userA][userB]++;
        edgeCount[userB][userA]++;
        
        edgeNumber = edgeCount[userA][userB];
        
        emit ConnectionAdded(userA, userB, edgeNumber);
        return edgeNumber;
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
     * @dev 2人のユーザー間の辺の数を取得
     * @param userA ユーザーA
     * @param userB ユーザーB
     * @return 辺の数
     */
    function getEdgeCount(address userA, address userB) public view returns (uint256) {
        return edgeCount[userA][userB];
    }
    
    /**
     * @dev 指定ユーザーの次数中心性を計算（100倍したint8で返す）
     * @param user 次数中心性を計算するユーザーアドレス
     * @return 次数中心性（100倍した値）
     */
    function calculateDegreeCentrality(address user) public view returns (int8) {
        require(user != address(0), "Invalid user address");
        if (!vertexExists[user]) {
            return 0;
        }

        int256 userCount = int256(vertices.length);
        if (userCount <= 1) return 0;

        int256 degree = int256(getDegree(user));
        return int8((degree * 100) / (userCount - 1));
    }
    
    /**
     * @dev 全ユーザーの次数中心性を計算
     * @return users ユーザーアドレスの配列
     * @return centralities 対応する次数中心性の配列（100倍した値）
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
        return edgeCount[userA][userB] > 0;
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
