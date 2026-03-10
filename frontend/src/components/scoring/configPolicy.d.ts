import { Wallet, HDNodeWallet } from "ethers";
/**
 * ユーザーのアクセス制御ポリシーを設定する関数
 * @param wallet - ウォレットインスタンス
 * @param policy - アクセス制御ポリシーの数値（0-4）
 * @param contractAddress - SsdlabTokenコントラクトのアドレス
 * @returns トランザクションレシートを返すPromise
 * @throws エラーが発生した場合は例外をスロー
 */
declare const configPolicy: (wallet: Wallet | HDNodeWallet, policy: number, contractAddress: string) => Promise<boolean>;
export default configPolicy;
