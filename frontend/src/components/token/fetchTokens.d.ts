import { Wallet, HDNodeWallet } from "ethers";
/**
 * 指定されたウォレットとコントラクトアドレスからミントされたトークンを取得する関数
 * @param rpcUrl - Ethereumネットワークに接続するためのRPC URL
 * @param contractAddress - トークンを取得するコントラクトのアドレス
 * @param wallet - トークン取得に使用するウォレットインスタンス。undefinedの場合はプロバイダーが使用される
 * @param level - 取得するトークンのレベル。"all"、"sent"、または"receive"を指定可能
 * @returns Tokens - トークンの詳細情報を含む配列
 * @returns number - 操作結果を示すステータスコード
 */
declare const fetchTokens: (rpcUrl: string, wallet: Wallet | HDNodeWallet | undefined, contractAddress: string, level: "all" | "sent" | "receive") => Promise<[Token[], number]>;
export default fetchTokens;
