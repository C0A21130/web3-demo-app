import { ethers, Wallet, HDNodeWallet, isAddress } from "ethers";
import SsdlabTokenAbi from "../../../abi/SsdlabToken.json";

/**
 * ユーザーの信用スコアを取得する関数
 * 
 * @param targetAddress - スコアを取得したいユーザーのアドレス（アドレス形式）
 * @param wallet - ウォレットインスタンス（オプション：ユーザー名からアドレス解決が必要な場合）
 * @param contractAddress - SsdlabTokenコントラクトのアドレス
 * @returns Promise<{ targetScores: number[]; myScore: number }> - 取引相手のスコアと自分のスコアを含むオブジェクト
 * @throws エラーが発生した場合は例外をスロー
 */
const fetchScores = async (targetAddressList: string[], wallet: Wallet | HDNodeWallet, contractAddress: string): Promise<{ targetScores: number[]; myScore: number }> => {
  try {
    // ユーザーアドレスがアドレス形式でない場合スコアの取得をキャンセルする
    const myAddress = wallet?.address;
    targetAddressList.map(address => {
      if (!isAddress(address)) {
        throw new Error(`無効な取引相手のアドレス形式です: ${address}`);
      }
    });
    if (!isAddress(myAddress)) {
      throw new Error('ウォレットアドレスは無効なアドレス形式です');
    }

    // コントラクトインスタンスを作成してスコアを取得
    const contract = new ethers.Contract(contractAddress, SsdlabTokenAbi.abi, wallet);
    const targetScores = await Promise.all(
      targetAddressList.map(
        async (address) => {
          const score = await contract.getScore(address);
          return Number(score);
        }
      )
    );
    const myScore = await contract.getScore(myAddress);
    
    // int8型の値をnumberに変換
    return {
      targetScores: targetScores,
      myScore: Number(myScore)
    };

  } catch (error: any) {
    console.error('スコア取得中にエラーが発生しました:', error);
    
    // より具体的なエラーメッセージを提供
    if (error.message.includes('resolver or addr is not configured')) {
      throw new Error('指定されたアドレスは無効です');
    } else if (error.message.includes('execution reverted')) {
      throw new Error('コントラクトの実行が失敗しました。アドレスまたはコントラクトアドレスを確認してください');
    } else if (error.message.includes('network')) {
      throw new Error('ネットワーク接続エラーが発生しました');
    }
    throw error;
  }
};

export default fetchScores;
