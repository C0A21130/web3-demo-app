import { JsonRpcSigner } from "ethers";
declare const fetchTransferLogs: (contractAddress: string, signer: JsonRpcSigner, setLogStatus?: (status: string) => void) => Promise<TransferLog[]>;
export default fetchTransferLogs;
