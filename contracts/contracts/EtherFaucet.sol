// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title EtherFaucet
 * @dev Etherの送金と受信を管理するスマートコントラクト
 */
contract EtherFaucet {
    mapping(address => uint8) private _receiveCount;

    // イベントの定義
    event Receive(string);
    event Fallback(string);

    /// 指定したアドレスに0.1 Etherを送信する関数
    /// @param _to Etherを受け取るアドレス
    function faucet(address _to) public payable {
        // check: パラメータや残高の確認
        require(_to != address(0), "Invalid address");
        require(_to.balance < 0.1 ether, "Recipient has sufficient balance");

        // calculate: 受信者を0.1 ETHにするための送金額を算出
        uint256 amount = 0.1 ether - _to.balance;
        require(address(this).balance >= amount, "Insufficient balance");

        // effects: 状態変数である受信カウントの更新
        _receiveCount[_to] += 1;

        // interactions: _toへEtherの送信（算出したamountを送る）
        (bool success, ) = _to.call{value: amount}("");
        require(success, "Transfer failed");
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