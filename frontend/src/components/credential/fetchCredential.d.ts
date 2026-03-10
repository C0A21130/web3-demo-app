import { Wallet, HDNodeWallet } from "ethers";
/**
 * 全てのSBT認証情報を取得する
 * イベントログを使用して効率的に全SBT情報を取得
 *
 * @param wallet - ウォレットインスタンス（プロバイダー付き）
 * @param contractAddress - MemberSbtDemoコントラクトのアドレス
 * @returns 全SBTの認証情報配列（UserCredential[]）
 * @throws 取得失敗時にエラーをスロー
 */
export declare const fetchCredential: (wallet: Wallet | HDNodeWallet, contractAddress: string) => Promise<UserCredential[]>;
export default fetchCredential;
