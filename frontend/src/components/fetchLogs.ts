import { Contract, JsonRpcSigner, formatUnits, TransactionReceipt, Log, EventLog } from "ethers";
import SsdlabAbi from "../../abi/SsdlabToken.json";

const fetchLogs = async (contractAddress: string, signer: JsonRpcSigner): Promise<TransferLog[]> => {
  const contract = new Contract(contractAddress, SsdlabAbi.abi, signer);
  let transferLog: TransferLog;
  let txReceipt: TransactionReceipt | null = null;
  let gasPrice: number;
  let gasUsed: number;

  // アドレスを指定しない場合は全てのログを取得する
  let logs: (Log | EventLog)[] = [];
  const latest = await signer.provider?.getBlockNumber();
  const network = await signer.provider?.getNetwork();
  const rate = network?.chainId == 1n ? Math.floor(latest / 500) : Math.floor(latest / 50);
  
  // 一度に取得するブロック数を指定して取得する
  for (let i = 0; i < latest; i += rate) {
    const fromBlock = i;
    const toBlock = Math.min(i + rate, latest);
    try {
      const batchLogs = await contract.queryFilter("Transfer", fromBlock, toBlock);
      logs = logs ? [...logs, ...batchLogs] : batchLogs;
    } catch (error) { // もしエラーが発生した場合は、一度に取得するブロックを小さくして再試行
      const miniSize = Math.floor((toBlock - fromBlock) / 100);
      for (let j = fromBlock; j < toBlock; j += miniSize) {
        const batchLogs = await contract.queryFilter("Transfer", j, j + miniSize);
        logs = logs ? [...logs, ...batchLogs] : batchLogs;
      }
    }
  }

  // もしログが取得できなかった場合は空の配列を返す
  if (logs.length === 0) {
    console.log("No logs found");
    return [];
  }

  // fromが0x0000000000000000000000000000000000000000ではないものを取得する
  logs = logs.filter((log) => {
    const eventlog = log as EventLog;
    if (!eventlog.args || eventlog.args == null) {
      return eventlog.topics?.[0] !== "0x0000000000000000000000000000000000000000";
    }
    return eventlog.args?.from !== "0x0000000000000000000000000000000000000000";
  });

  // ログからTransferLog型に変換する
  const transeferLogs = Promise.all(
    logs.map(async (log) => {
      const eventlog = log as EventLog;

      // ログからgas価格とガス量を取得する
      txReceipt = await signer.provider?.getTransactionReceipt(log.transactionHash);
      if (txReceipt == null) {
        console.error("Transaction receipt not found for:", log.transactionHash);
      } else {
        gasPrice = Number(formatUnits(txReceipt.gasPrice, 'gwei'));
        gasUsed = Number(formatUnits(txReceipt.gasUsed, 'gwei'));
      }

      // TransferLog型に変換する
      if (!eventlog.args || eventlog.args == null) {
        // TokenURIを取得する
        let tokenURI = "";
        try {
          tokenURI = await contract.tokenURI(Number(eventlog?.topics[2]));
        } catch (error) {
          console.error("Error fetching tokenURI:", error);
        }

        transferLog = {
          fromAddress: eventlog.topics[0] || "0x0000000000000000000000000000000000000000",
          toAddress: eventlog.topics[1] || "0x0000000000000000000000000000",
          tokenId: Number(eventlog.topics[2]) || -1,
          blockNumber: eventlog.blockNumber,
          gasPrice: gasPrice || 0.0,
          gasUsed: gasUsed || 0.0,
          txHash: eventlog.transactionHash,
          tokenURI: tokenURI || "",
        };
      } else {
        // TokenURIを取得する
        let tokenURI = "";
        try {
          tokenURI = await contract.tokenURI(Number(eventlog.args?.tokenId));
        } catch (error) {
          console.error("Error fetching tokenURI:", error);
        }

        transferLog = {
          fromAddress: eventlog.args?.from || "0x0000000000000000000000000000000000000000",
          toAddress: eventlog.args?.to || "0x0000000000000000000000000000",
          tokenId: Number(eventlog.args?.tokenId) || -1,
          blockNumber: eventlog.blockNumber,
          gasPrice: gasPrice || 0.0,
          gasUsed: gasUsed || 0.0,
          txHash: eventlog.transactionHash,
          tokenURI: tokenURI || "",
        };
      }
      return transferLog;
    })
  );
  return transeferLogs;
}

export default fetchLogs;
