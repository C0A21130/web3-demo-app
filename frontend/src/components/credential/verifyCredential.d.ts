import { Wallet, HDNodeWallet } from "ethers";
/**
 * 指定されたSBT会員証が本当に発行されているかを検証する
 *
 * @param wallet - ウォレットインスタンス（Wallet または HDNodeWallet）
 * @param contractAddress - MemberSbtDemoスマートコントラクトのアドレス
 * @param tokenId - 所有権を検証するトークンID
 * @returns Promise<boolean> - ウォレットがSBTを所有している場合はtrue、そうでなければfalse
 * @throws ネットワークの問題や無効なパラメータにより検証が失敗した場合はエラーをスローする
 */
declare const verifyCredential: (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenId: number, userAddress: string) => Promise<boolean>;
export default verifyCredential;
