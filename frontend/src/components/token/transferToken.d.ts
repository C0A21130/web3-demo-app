import { Wallet, HDNodeWallet } from "ethers";
/**
 * 指定したウォレットとコントラクトアドレスを使ってNFTトークンを転送する関数
 *
 * @param wallet - 取引に署名するためのウォレットインスタンス（WalletまたはHDNodeWallet）
 * @param contractAddress - 操作対象のスマートコントラクトのアドレス
 * @param to - NFTトークンの受取人アドレス
 * @param tokenId - 転送するNFTトークンのID
 * @returns boolean - 転送が成功した場合はtrue、失敗した場合はfalseを返す
 * @throws ウォレット残高が不足している場合や転送処理に失敗した場合はエラーをスロー
 */
declare const transferToken: (wallet: Wallet | HDNodeWallet, contractAddress: string, to: string, tokenId: number) => Promise<boolean>;
export default transferToken;
