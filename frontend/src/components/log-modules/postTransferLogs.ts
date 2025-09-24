import { scoringEndpointUrl } from "../../App";

const postTransferLogs = async (contractAddress: string, transferLogs: TransferLog[]) => {
  // 送信するログが空の場合は処理を中止
  if (transferLogs.length === 0) {
    console.error("送信するログがありません");
    return;
  }

  // 送信するログの形式を整形
  let requestTransferLogs = transferLogs.map(log => {
    return {
      from_address: log.fromAddress,
      to_address: log.toAddress,
      token_id: log.tokenId.toString(), // 文字列として送信
      block_number: log.blockNumber,
      contract_address: contractAddress,
      gas_price: log.gasPrice,
      gas_used: log.gasUsed,
      transaction_hash: log.txHash,
      token_uri: log.tokenURI,
    };
  });
  console.log("送信するログの0番目:", requestTransferLogs[0]);

  // ログを送信する
  try {
    const response = await fetch(`${scoringEndpointUrl}/logs`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contract_address: contractAddress,
        transfer_logs: requestTransferLogs,
      }),
    })

    if (!response.ok) {
      console.error("HTTPエラー:", response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log("全てのログを送信しました");
  } catch (error) {
    console.error("ログの送信に失敗しました:", error);
  }
}

export default postTransferLogs;
