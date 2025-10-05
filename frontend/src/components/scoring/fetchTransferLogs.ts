import { Contract, JsonRpcSigner, formatUnits, TransactionReceipt, Log, EventLog } from "ethers";
import SsdlabAbi from "../../../abi/SsdlabToken.json";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchTransferLogs = async (contractAddress: string, signer: JsonRpcSigner): Promise<TransferLog[]> => {
  const contract = new Contract(contractAddress, SsdlabAbi.abi, signer);
  let transferLog: TransferLog;
  let txReceipt: TransactionReceipt | null = null;
  let gasPrice: number = 0.0;
  let gasUsed: number = 0.0;

  // アドレスを指定しない場合は全てのログを取得する
  let logs: (Log | EventLog)[] = [];
  const latest = await signer.provider?.getBlockNumber();
  const network = await signer.provider?.getNetwork();
  const rate = network?.chainId == 1n ? Math.floor(latest / 500) : Math.floor(latest / 100);
  
  // 一度に取得するブロック数を指定して取得する
  for (let i = 0; i < latest; i += rate) {
    const fromBlock = i;
    const toBlock = Math.min(i + rate, latest);
    try {
      const batchLogs = await contract.queryFilter("Transfer", fromBlock, toBlock);
      logs = logs ? [...logs, ...batchLogs] : batchLogs;
    } catch (error) { // もしエラーが発生した場合は、一度に取得するブロックを小さくして再試行
      const miniSize = Math.floor((toBlock - fromBlock) / 10);
      for (let j = fromBlock; j < toBlock; j += miniSize) {
        const batchLogs = await contract.queryFilter("Transfer", j, j + miniSize);
        logs = logs ? [...logs, ...batchLogs] : batchLogs;
      }
    }
  }

  // もしログが取得できなかった場合は空の配列を返す
  if (logs.length === 0) {
    return [];
  }

  // fromが0x0000000000000000000000000000000000000000ではないものを取得する
  logs = logs.filter((log) => {
    const eventlog = log as EventLog;
    if (!eventlog.args || eventlog.args == null) {
      return eventlog.topics[0] !== "0x0000000000000000000000000000000000000000";
    }
    return eventlog.args?.from !== "0x0000000000000000000000000000000000000000";
  });

  // ログからガス代とTokenURIを取得してTransferLog型に変換する
  console.log("Transforming logs...");
  const transferLogs = Promise.all(
    logs.map(async (log) => {
      const eventlog = log as EventLog;

      // ログからトランザクションにおけるガス代を取得する
      txReceipt = await signer.provider?.getTransactionReceipt(log.transactionHash);
      await delay(50); // 通信待機
      if (txReceipt == null) {
        console.error("Transaction receipt not found for:", log.transactionHash);
      } else {
        gasPrice = Number(formatUnits(txReceipt.gasPrice, 'gwei'));
        gasUsed = Number(formatUnits(txReceipt.gasUsed, 'gwei'));
      }

      if (!eventlog.args || eventlog.args == null) {
        // TokenURIを取得する
        let tokenURI = "";
        try {
          const tokenId = BigInt(eventlog.topics[2]);
          if (tokenId >= 0n) {
            tokenURI = await contract.tokenURI(tokenId);
          }
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
          const tokenId = BigInt(eventlog.args?.tokenId);
          if (tokenId >= 0n) {
            tokenURI = await contract.tokenURI(tokenId);
          }
        } catch (error) {
          console.error("Error fetching tokenURI:", error);
          tokenURI = "";
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
      await delay(50); // 通信待機
      return transferLog;
    })
  );
  return transferLogs;
}

export default fetchTransferLogs;
