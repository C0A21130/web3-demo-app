import { Wallet, HDNodeWallet } from "ethers";
/**
 * ユーザーのアクセス制御ポリシーを取得する関数
 * @param wallet - ウォレットインスタンス
 * @param contractAddress - SsdlabTokenコントラクトのアドレス
 * @returns ポリシー値を返す
 * @throws エラーが発生した場合は例外をスロー
 */
declare const fetchPolicy: (wallet: Wallet | HDNodeWallet, contractAddress: string) => Promise<number>;
export default fetchPolicy;
