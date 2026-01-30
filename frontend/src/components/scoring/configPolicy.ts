import { Wallet, HDNodeWallet, Contract, isAddress } from "ethers";
import SsdlabTokenAbi from "../../../abi/SsdlabToken.json";

/**
 * ユーザーのアクセス制御ポリシーを設定する関数
 * @param wallet - ウォレットインスタンス
 * @param policy - アクセス制御ポリシーの数値（0-4）
 * @param contractAddress - SsdlabTokenコントラクトのアドレス
 * @returns トランザクションレシートを返すPromise
 * @throws エラーが発生した場合は例外をスロー
 */
const configPolicy = async (wallet: Wallet | HDNodeWallet, policy: number, contractAddress: string): Promise<boolean> => {
  try {
    // 必須パラメータのチェック
    if (!wallet) {
      throw new Error('ウォレットインスタンスが提供されていません');
    }
    if (policy < 0 || policy > 4) {
      throw new Error(`無効なポリシー値です。0-4の範囲で指定してください: ${policy}`);
    }
    if (!isAddress(contractAddress)) {
      throw new Error('無効なコントラクトアドレス形式です');
    }

    // コントラクトインスタンスの作成とポリシー設定の呼び出し
    const contract = new Contract(contractAddress, SsdlabTokenAbi.abi, wallet);
    const tx = await contract.setPolicy(policy);
    await tx.wait();

    // ポリシーが設定されたことを確認する
    const currentPolicy = await contract.getPolicy(wallet.address);
    if (Number(currentPolicy) !== policy) {
      console.log(`ポリシーの設定に失敗しました。期待値: ${policy}, 実際の値: ${currentPolicy}`);
      return false;
    }
    return true;

  } catch (error) {
    console.error('ポリシー設定時のエラー:', error);
    return false;
  }
};

export default configPolicy;
