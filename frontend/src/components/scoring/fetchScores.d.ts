import { Wallet, HDNodeWallet } from "ethers";
/**
 * ユーザーの信用スコアを取得する関数
 *
 * @param targetAddress - スコアを取得したいユーザーのアドレス（アドレス形式）
 * @param wallet - ウォレットインスタンス（オプション：ユーザー名からアドレス解決が必要な場合）
 * @param contractAddress - SsdlabTokenコントラクトのアドレス
 * @returns Promise<{ targetScores: number[]; myScore: number }> - 取引相手のスコアと自分のスコアを含むオブジェクト
 * @throws エラーが発生した場合は例外をスロー
 */
declare const fetchScores: (targetAddressList: string[], wallet: Wallet | HDNodeWallet, contractAddress: string) => Promise<{
    targetScores: number[];
    myScore: number;
}>;
export default fetchScores;
