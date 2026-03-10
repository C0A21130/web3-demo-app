import { Wallet, HDNodeWallet } from "ethers";
/**
 * SBT（Soulbound Token）を発行する
 *
 * @param wallet - ウォレットインスタンス（Wallet または HDNodeWallet）
 * @param contractAddress - MemberSbtDemoコントラクトのアドレス
 * @param userName - SBTに紐付けるユーザー名
 * @returns 発行されたSBTの認証情報（UserCredential）
 * @throws 発行失敗時にエラーをスロー
 */
export declare const issueCredential: (wallet: Wallet | HDNodeWallet, contractAddress: string, userName: string) => Promise<UserCredential>;
export default issueCredential;
