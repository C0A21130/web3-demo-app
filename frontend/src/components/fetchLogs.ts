import { Contract, JsonRpcSigner, formatUnits, TransactionReceipt } from "ethers";
import SsdlabAbi from "../../abi/SsdlabToken.json";
import { EventLog } from "ethers";

const fetchLogs = async (contractAddress: string, signer: JsonRpcSigner): Promise<TransferLog[]> => {
  const contract = new Contract(contractAddress, SsdlabAbi.abi, signer);
  let transferLog: TransferLog;
  let txReceipt: TransactionReceipt | null = null;
  let gasPrice: number;
  let gasUsed: number;

  // アドレスを指定しない場合は全てのログを取得する
  let logs = await contract.queryFilter("Transfer");
  logs = logs.filter((log) => {
    const eventlog = log as EventLog;
    // fromが0x0000000000000000000000000000000000000000ではないものを取得する
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
      transferLog = {
        fromAddress: eventlog.args?.from || "0x0000000000000000000000000000000000000",
        toAddress: eventlog.args?.to || "0x0000000000000000000000000000",
        tokenId: eventlog.args?.tokenId || -1,
        blockNumber: eventlog.blockNumber,
        gasPrice: gasPrice || 0.0,
        gasUsed: gasUsed || 0.0,
        txHash: eventlog.transactionHash,
      };
      return transferLog;
    })
  );
  return transeferLogs;

}

export default fetchLogs;
