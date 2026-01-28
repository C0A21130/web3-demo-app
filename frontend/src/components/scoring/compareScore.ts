import { Wallet, HDNodeWallet, Contract, isAddress } from "ethers";
import SsdlabTokenAbi from "../../../abi/SsdlabToken.json";

/**
 * 自身と取引相手のスコアを検証して取引可能か確認する関数
 * @param wallet - ウォレットインスタンス
 * @param targetAddress - 検証したい取引相手のアドレス
 * @param contractAddress - SsdlabTokenコントラクトのアドレス
 * @returns 取引可能な場合はtrue、そうでない場合はfalseを返すPromise
 * @throws エラーが発生した場合は例外をスロー
 */
const compareScore = async (wallet: Wallet | HDNodeWallet, targetAddress: string, contractAddress: string): Promise<boolean> => {
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

    // コントラクトインスタンスの作成とスコア検証の呼び出し
    const contract = new Contract(contractAddress, SsdlabTokenAbi.abi, wallet);
    const isMyScoreHigher: boolean = await contract.compareScore(wallet.address, targetAddress);

    // 取引可能かどうかの結果を返す
    return isMyScoreHigher

  } catch (error) {
    console.error('検証前のエラー:', error);
    throw error;
  }
};

export default compareScore;
