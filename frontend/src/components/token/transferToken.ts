import { ethers, Wallet, HDNodeWallet, formatEther } from "ethers";
import SsdlabAbi from "../../../abi/SsdlabToken.json";

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
const transferToken = async (wallet: Wallet | HDNodeWallet, contractAddress: string, to: string, tokenId: number): Promise<boolean> => {
  const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
  const from = wallet.address;
  let toAddress = to;
  const balance = await contract.balanceOf(from);

  // NFTを発行するための残高があるか確認
  if (formatEther(balance) == "0.0") {
    throw new Error('Insufficient balance');
  }

  // NFT転送スマートコントラクトを呼び出す
  try {
    const tx = await contract.safeTransferFrom(from, toAddress, tokenId);
    const txReceipt = await tx.wait();
    return txReceipt ? true : false;
  } catch (error: any) {
    if (error.message.includes('Transfer not allowed due to scoring rules')) {
      return false;
    }
    console.error(error);
    throw new Error('Failed to transfer NFT');
  }
};

export default transferToken;
