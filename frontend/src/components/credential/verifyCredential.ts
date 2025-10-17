import { ethers, Wallet, HDNodeWallet } from "ethers";
import MemberSBTAbi from '../../../abi/MemberSBT_Demo.json';

/**
 * 指定されたSBT会員証が本当に発行されているかを検証する
 * 
 * @param wallet - ウォレットインスタンス（Wallet または HDNodeWallet）
 * @param contractAddress - MemberSBT_Demoスマートコントラクトのアドレス
 * @param tokenId - 所有権を検証するトークンID
 * @returns Promise<boolean> - ウォレットがSBTを所有している場合はtrue、そうでなければfalse
 * @throws ネットワークの問題や無効なパラメータにより検証が失敗した場合はエラーをスローする
 */
const verifyCredential = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenId: number, userAddress: string): Promise<boolean> => {
  try {
    // ウォレットとプロバイダーが利用可能かチェック
    const provider = wallet.provider;
    if (!wallet || !provider || tokenId < 0) {
      return false
    }

    // コントラクトインスタンスを作成して、所有権を検証
    const contract = new ethers.Contract(contractAddress, MemberSBTAbi.abi, provider);
    const isVerified = await contract.verifyCredential(tokenId, userAddress);
    return isVerified;

  } catch (error) {
    console.error('Error verifying credential:', error);

    // 特定のエラータイプを処理
    if (error instanceof Error) {
      if (error.message.includes('Query for nonexistent token')) {
        console.warn(`Token ID ${tokenId} does not exist`);
        return false;
      } else if (error.message.includes('Invalid contract address')) {
        console.error('Invalid contract address format');
        return false;
      } else if (error.message.includes('network')) {
        console.error('Network error occurred during verification');
        return false;
      } else if (error.message.includes('revert')) {
        console.warn('Contract call reverted - likely invalid token or address');
        return false;
      } else {
        console.error(`Verification failed: ${error.message}`);
        return false;
      }
    } else {
      console.error('Unknown error occurred during verification');
      return false;
    }
  }
};

export default verifyCredential;
