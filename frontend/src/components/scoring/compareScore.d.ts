import { Wallet, HDNodeWallet } from "ethers";
/**
 * 自身と取引相手のスコアを検証して取引可能か確認する関数
 * @param wallet - ウォレットインスタンス
 * @param targetAddress - 検証したい取引相手のアドレス
 * @param contractAddress - SsdlabTokenコントラクトのアドレス
 * @returns 取引可能な場合はtrue、そうでない場合はfalseを返すPromise
 * @throws エラーが発生した場合は例外をスロー
 */
declare const compareScore: (wallet: Wallet | HDNodeWallet, targetAddress: string, contractAddress: string) => Promise<boolean>;
export default compareScore;
