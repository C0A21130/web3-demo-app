import { Wallet, HDNodeWallet, Contract, isAddress } from "ethers";
import SsdlabTokenAbi from "../../../abi/SsdlabToken.json";

/**
 * ユーザーのアクセス制御ポリシーを取得する関数
 * @param wallet - ウォレットインスタンス
 * @param contractAddress - SsdlabTokenコントラクトのアドレス
 * @returns ポリシー値を返す
 * @throws エラーが発生した場合は例外をスロー
 */
const fetchPolicy = async (wallet: Wallet | HDNodeWallet, contractAddress: string): Promise<number> => {
  try {
    // 必須パラメータのチェック
    if (!wallet) {
      throw new Error('ウォレットインスタンスが提供されていません');
    }
    if (!isAddress(contractAddress)) {
      throw new Error('無効なコントラクトアドレス形式です');
    }

    // コントラクトインスタンスの作成
    const contract = new Contract(contractAddress, SsdlabTokenAbi.abi, wallet);

    // ポリシーが設定されたことを確認する
    const currentPolicy = await contract.getPolicy(wallet.address);
    return Number(currentPolicy);
  } catch (error) {
    console.error('ポリシー取得のエラー:', error);
    return 0;
  }
};

export default fetchPolicy;
