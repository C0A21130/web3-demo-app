/**
 * MemberSBT_Demomint.ts
 * 
 * @description
 * MemberSBT_Demo コントラクトを使用してSBT（Soulbound Token）を発行するための
 * フロントエンドユーティリティ関数です。
 * 
 * 【重要な特徴】
 * - セルフミント専用: ユーザーは自分自身にのみSBTを発行できます
 * - 権限不要: MINTER_ROLEなどの特別な権限は必要ありません
 * - デモ用途: 開発・テスト・デモンストレーション環境での使用を想定
 * 
 * 【本番環境での注意】
 * 本番環境では、権限管理機能を持つ MemberSBT.sol の使用を推奨します。
 */

import { ethers, Wallet, HDNodeWallet } from "ethers";
import MemberSBTDemoAbi from '../../../abi/MemberSBT_Demo.json';

/**
 * SBTをミント（発行）する関数
 * 
 * @description
 * この関数は、ユーザーのウォレットを使用してMemberSBT_Demoコントラクトの
 * safeMint関数を呼び出し、自分自身にSBTを発行します。
 * 
 * @param {Wallet | HDNodeWallet} wallet - トランザクションに署名するウォレットインスタンス
 *   - Wallet: ethers.jsの標準ウォレット（秘密鍵から生成）
 *   - HDNodeWallet: 階層的決定性ウォレット（ニーモニックから生成）
 * 
 * @param {string} contractAddress - MemberSBT_Demoコントラクトのデプロイ済みアドレス
 *   例: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
 * 
 * @param {string} tokenName - SBTに紐付けるユーザー名またはトークン名
 *   例: "太郎", "Taro Yamada"
 *   注意: オンチェーンに永続的に保存され、変更できません
 * 
 * @returns {Promise<TransactionReceipt>} トランザクションレシート
 *   - blockNumber: トランザクションが含まれるブロック番号
 *   - transactionHash: トランザクションのハッシュ値
 *   - gasUsed: 消費されたガス量
 *   - logs: イベントログ（SBTMintedイベントを含む）
 * 
 * @throws {Error} 以下の場合にエラーをスローします:
 *   - ウォレットの残高が不足している場合
 *   - コントラクトアドレスが無効な場合
 *   - ネットワーク接続に問題がある場合
 *   - トランザクションが失敗した場合（ガス不足、リバートなど）
 * 
 * @example
 * // 使用例
 * const provider = new ethers.BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 * const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
 * 
 * try {
 *   const receipt = await mintMemberSBT(signer, contractAddress, "太郎");
 *   console.log("SBT発行成功:", receipt.transactionHash);
 * } catch (error) {
 *   console.error("SBT発行失敗:", error);
 * }
 */
const mintMemberSBT = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string) => {
    try {
        // ----------------------------------------------------------------
        // 1. コントラクトインスタンスの作成
        // ----------------------------------------------------------------
        // ethers.Contract を使用して、スマートコントラクトとのインターフェースを作成します
        // 
        // パラメータ:
        // - contractAddress: デプロイ済みのコントラクトアドレス
        // - MemberSBTDemoAbi.abi: コントラクトのABI（Application Binary Interface）
        //   → コントラクトの関数やイベントの定義情報
        // - wallet: トランザクションに署名するウォレット
        //   → このウォレットがガス代を支払い、msg.senderとなります
        const contract = new ethers.Contract(contractAddress, MemberSBTDemoAbi.abi, wallet);
        
        // ----------------------------------------------------------------
        // 2. safeMint 関数の呼び出し
        // ----------------------------------------------------------------
        // MemberSBT_Demo.sol の safeMint 関数を呼び出します
        // 
        // safeMint(address to, string memory userName)
        // - to: wallet.address（自分自身のアドレス）
        // - userName: tokenName（ユーザーが指定した名前）
        // 
        // 【重要】
        // MemberSBT_Demo では、toはmsg.senderと一致する必要があります。
        // そのため、wallet.address を指定しています。
        // 
        // この呼び出しにより:
        // 1. トランザクションが作成される
        // 2. ウォレットで署名される
        // 3. ネットワークにブロードキャストされる
        const tx = await contract.safeMint(wallet.address, tokenName);
        
        // ----------------------------------------------------------------
        // 3. トランザクションの完了を待機
        // ----------------------------------------------------------------
        // tx.wait() を呼び出して、トランザクションがブロックに含まれるのを待ちます
        // 
        // 処理の流れ:
        // 1. トランザクションがメモリプールに入る
        // 2. マイナーがトランザクションをピックアップ
        // 3. ブロックに含まれる
        // 4. ブロックが確定する
        // 5. トランザクションレシートが返される
        // 
        // txReceipt には以下の情報が含まれます:
        // - transactionHash: トランザクションの一意な識別子
        // - blockNumber: トランザクションが含まれるブロック番号
        // - gasUsed: 実際に消費されたガス量
        // - logs: イベントログ（SBTMintedイベントなど）
        // - status: トランザクションの成功/失敗ステータス
        const txReceipt = await tx.wait();
        
        // ----------------------------------------------------------------
        // 4. トランザクションレシートを返す
        // ----------------------------------------------------------------
        // 呼び出し元で、トランザクションの詳細情報を確認できます
        return txReceipt;
        
    } catch (error) {
        // ----------------------------------------------------------------
        // エラーハンドリング
        // ----------------------------------------------------------------
        // 以下のような場合にエラーが発生します:
        // 
        // 1. ネットワークエラー
        //    - RPCエンドポイントに接続できない
        //    - タイムアウト
        // 
        // 2. ガス不足
        //    - ウォレットの残高が不足している
        //    - ガスリミットが低すぎる
        // 
        // 3. コントラクトのリバート
        //    - safeMint関数内のrequire文でエラー
        //    - 例: "You can only mint an SBT for yourself."
        // 
        // 4. その他
        //    - 無効なコントラクトアドレス
        //    - ABIの不一致
        //    - ウォレットのロック
        
        // エラーの詳細をコンソールに出力
        console.error(error);
        
        // 呼び出し元に分かりやすいエラーメッセージをスロー
        throw new Error('Failed to mint SBT');
    }
}

// ----------------------------------------------------------------
// エクスポート
// ----------------------------------------------------------------
// この関数を他のファイルからインポートできるようにします
// 
// 使用例:
// import mintMemberSBT from './MemberSBT_Demomint';
export default mintMemberSBT;