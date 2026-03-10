import { Wallet, HDNodeWallet } from 'ethers';
/**
 * @param rpcUrls - 接続先のRPC URLの一覧
 * @param localStorage - ローカルストレージ
 * @returns 生成されたウォレットと使用したRPC URLのインデックス
 * @description ローカルストレージに保存されている秘密鍵を取得し、ウォレットを生成する。秘密鍵が存在しない場合は、新しい秘密鍵を生成し、ローカルストレージに保存する。
 * @see /docs/wallet.md
 * @see https://docs.ethers.org/v6/api/wallet/
**/
declare const getWallet: (rpcUrls: string[], localStorage: Storage) => Promise<{
    wallet: Wallet | HDNodeWallet;
    rpcUrlIndex: number;
}>;
export default getWallet;
