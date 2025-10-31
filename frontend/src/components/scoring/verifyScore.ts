import { Wallet, HDNodeWallet, Contract, isAddress } from "ethers";
import SsdlabTokenAbi from "../../../abi/SsdlabToken.json";

// 検証結果の型定義
type VerifyScoreResult = {
  isVerified: boolean;
  isAuthorized: boolean;
};

/**
 * 自身と取引相手のスコアを検証して取引可能か確認する関数
 * @param wallet - ウォレットインスタンス
 * @param targetAddress - 検証したい取引相手のアドレス
 * @param contractAddress - SsdlabTokenコントラクトのアドレス
 * @returns 取引可能かどうかの結果を含むオブジェクト
 * @throws エラーが発生した場合は例外をスロー
 */
const verifyScore = async (wallet: Wallet | HDNodeWallet, targetAddress: string, contractAddress: string): Promise<VerifyScoreResult> => {
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
    const isVerified: boolean = await contract.verifyScore(wallet.address, targetAddress);

    // 自身のスコアより取引相手のスコアが低い場合の処理
    if (!isVerified) {
      const isAuthorized = await contract.accessControl(wallet.address, targetAddress);
      return {
        isVerified: false,
        isAuthorized: isAuthorized,
      };
    }

    // 両者のスコアが検証済みの場合
    return {
      isVerified: true,
      isAuthorized: true,
    };
  } catch (error) {
    console.error('検証前のエラー:', error);
    throw error;
  }
};

export default verifyScore;
