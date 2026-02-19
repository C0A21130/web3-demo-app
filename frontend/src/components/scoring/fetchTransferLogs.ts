import { Contract, JsonRpcSigner, formatUnits, TransactionReceipt, Log, EventLog } from "ethers";
import SsdlabAbi from "../../../abi/SsdlabToken.json";

type txReceiptLog = {
  tokenId: bigint;
  gasPrice: string;
  gasUsed: string;
  tokenURI: string;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// イベントログ取得
const fetchEventLogs = async (contract: Contract, signer: JsonRpcSigner, setLogStatus?: (status: string) => void): Promise<(Log | EventLog)[]> => {
  let logs: (Log | EventLog)[] = [];
  const latest = await signer.provider?.getBlockNumber();
  const rate = latest > 100000 ? 100000 : 1000; // 一度に取得するブロック数の上限を設定

  // 一度に取得するブロック数を指定して取得する
  for (let i = 0; i < latest; i += rate) {
    const fromBlock = i;
    const toBlock = Math.min(i + rate, latest);
    setLogStatus && setLogStatus(`(作業1/3)イベントログの取得中: (${fromBlock} / ${latest})`);
    const batchLogs = await contract.queryFilter("Transfer", fromBlock, toBlock);
    await delay(300);
    logs = logs ? [...logs, ...batchLogs] : batchLogs;
  }

  // もしログが取得できなかった場合は空の配列を返す
  return logs.length === 0 ? [] : logs;
}

const fetchReceiptLogs = async (contract: Contract, signer: JsonRpcSigner, logs: (Log | EventLog)[], setLogStatus?: (status: string) => void): Promise<txReceiptLog[]> => {
  let txReceipt: TransactionReceipt | null;
  let gasPrice: string = "";
  let gasUsed: string = "";
  let tokenId: bigint = 0n;
  let tokenURI: string = "";

  // ログからガス代とTokenURIを取得する
  const transferLogs = await Promise.all(
    logs.map(async (log, index) => {
      // ログからトランザクションにおけるガス代を取得する
      const eventlog = log as EventLog;
      txReceipt = await signer.provider?.getTransactionReceipt(log.transactionHash);
      await delay(300);
      setLogStatus && setLogStatus(`(作業2/3)ガス代とTokenURIの取得中: (${index + 1} / ${logs.length})`);
      if (txReceipt == null) {
        console.error("Transaction receipt not found for:", log.transactionHash);
      } else {
        gasPrice = formatUnits(txReceipt.gasPrice, 'gwei');
        gasUsed = formatUnits(txReceipt.gasUsed, 'gwei');
      }

      // TokenURIを取得する
      try {
        tokenId = BigInt(
          !eventlog.args || eventlog.args == null
            ? eventlog.topics[2]
            : eventlog.args?.tokenId
        );
        if (tokenId >= 0n) {
          tokenURI = await contract.tokenURI(tokenId);
          await delay(300);
        }
      } catch (error) {
        console.error("Error fetching tokenURI:", error);
      }
      return {
        tokenId: tokenId,
        gasPrice: gasPrice,
        gasUsed: gasUsed,
        tokenURI: tokenURI
      };
    })
  );
  
  return transferLogs;
}

const fetchTransferLogs = async (contractAddress: string, signer: JsonRpcSigner, setLogStatus?: (status: string) => void): Promise<TransferLog[]> => {
  let transferLogs: TransferLog[] = [];
  let eventLogs: (Log | EventLog)[] = [];
  let txReceiptLogs: txReceiptLog[] = [];

  // コントラクトを初期化する
  const contract = new Contract(contractAddress, SsdlabAbi.abi, signer);
  // イベントログを取得する
  eventLogs = await fetchEventLogs(contract, signer, setLogStatus);
  await delay(1000);
  // イベントログからレシートログを取得する
  txReceiptLogs = await fetchReceiptLogs(contract, signer, eventLogs, setLogStatus);
  // イベントログとレシートログを組み合わせ、条件に合うものだけTransferLog型に変換する
  setLogStatus && setLogStatus(`(作業3/3)変換中...`);
  transferLogs = eventLogs.reduce<TransferLog[]>((acc, log, index) => {
    const eventlog = log as EventLog;
    const receiptlog = txReceiptLogs[index];
    const hasArgs = !!eventlog.args;
    const fromAddress = hasArgs ? eventlog.args?.from : "0x" + eventlog.topics[1].slice(26);
    const toAddress = hasArgs ? eventlog.args?.to : "0x" + eventlog.topics[2].slice(26);

    // fromが0x0000000000000000000000000000000000000000ではないものだけ追加
    const isMint = fromAddress === "0x0000000000000000000000000000000000000000";
    if (isMint) {
      return acc;
    }

    // TransferLog型に変換して配列に追加
    acc.push({
      from_address: fromAddress,
      to_address: toAddress,
      token_id: hasArgs ? eventlog.args?.tokenId.toString() : BigInt(eventlog.topics[3]).toString(),
      block_number: log.blockNumber,
      contract_address: contractAddress,
      gas_price: receiptlog ? Number(receiptlog.gasPrice) : 0.0,
      gas_used: receiptlog ? Number(receiptlog.gasUsed) : 0.0,
      transaction_hash: log.transactionHash,
      token_uri: receiptlog ? receiptlog.tokenURI : "",
    });

    return acc;
  }, []);
  setLogStatus && setLogStatus(`合計 ${transferLogs.length} 件のログを取得しました`);

  return transferLogs;
}

export default fetchTransferLogs;
