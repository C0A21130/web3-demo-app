import { Wallet, HDNodeWallet, Contract, isAddress } from "ethers";
import SsdlabTokenAbi from "../../../abi/SsdlabToken.json";

/**
 * 自身と取引相手のスコアを検証して取引可能か確認する関数
 * @param wallet - ウォレットインスタンス
 * @param targetAddress - 検証したい取引相手のアドレス
 * @param contractAddress - SsdlabTokenコントラクトのアドレス
 * @returns Promise<boolean> - 取引相手のスコアが検証済みであればtrue、そうでなければfalse
 * @throws エラーが発生した場合は例外をスロー
 */
const verifyScore = async (wallet: Wallet | HDNodeWallet, targetAddress: string, contractAddress: string): Promise<boolean> => {
  try {
    // 必須パラメータのチェック
    if (!wallet) {
      throw new Error('ウォレットインスタンスが提供されていません');
    }
    if (!isAddress(targetAddress)) {
      throw new Error(`無効な取引相手のアドレス形式です: ${targetAddress}`);
    }
    if (!isAddress(contractAddress)) {
      throw new Error('無効なコントラクトアドレス形式です');
    }

    const contract = new Contract(contractAddress, SsdlabTokenAbi.abi, wallet);
    const isVerified = await contract.verifyScore(wallet.address, targetAddress);
    return isVerified;
  } catch (error) {
    console.error('検証前のエラー:', error);
    throw error;
  }
};

export default verifyScore;
