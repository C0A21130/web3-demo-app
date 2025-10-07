import { Wallet, HDNodeWallet, JsonRpcProvider } from 'ethers';

/**
 * @param rpcUrl - RPC URL
 * @param localStorage - ローカルストレージ
 * @returns wallet - ウォレット。walletはsignerの一種。
 * @description ローカルストレージに保存されている秘密鍵を取得し、ウォレットを生成する。秘密鍵が存在しない場合は、新しい秘密鍵を生成し、ローカルストレージに保存する。
 * @see https://docs.ethers.org/v6/api/wallet/
**/
const getWallet = async (rpcUrls: string[], localStorage: Storage): Promise<{wallet: Wallet | HDNodeWallet, rpcUrlIndex: number}> => {
  let provider: JsonRpcProvider;
  let wallet: Wallet | HDNodeWallet;
  let secretKey = localStorage.getItem('secretKey');
  let index: number = 0;
    
  // 秘密鍵が存在するか確認する
  if (secretKey != null) { // 秘密鍵が存在する場合
    wallet = new Wallet(secretKey, null);
  } else { // 秘密鍵が存在しない場合ランダムに生成する
    wallet = Wallet.createRandom(null);
    const randomKey = wallet.privateKey;
    localStorage.setItem('secretKey', randomKey);
  }

  // ウォレットのアドレスの最後の文字を16進数として解釈し、RPC URLの数で割った余りを開始インデックスとする
  let startindex = parseInt(wallet.address.slice(-1), 16) % rpcUrls.length;

  // 複数のRPC URLを順番に試して、有効なものを見つける
  for (let i = 0; i < rpcUrls.length; i++) {
    index = (startindex + i) % rpcUrls.length;

    // RPC URLが有効か確認する
    try {
      // プロバイダーを作成
      provider = new JsonRpcProvider(rpcUrls[index]);

      // タイムアウトを設定して、接続が遅い場合に備える
      const networkPromise = provider.getNetwork();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 2000)
      );
      await Promise.race([networkPromise, timeoutPromise]);

      // 有効なRPC URLが見つかった場合、ウォレットにプロバイダーを設定して返す
      wallet = wallet.connect(provider);
      return { wallet: wallet, rpcUrlIndex: index };
    } catch (e) {
      console.error('Invalid RPC URL:', rpcUrls[index]);
      if (i === rpcUrls.length - 1) {
        return { wallet: wallet, rpcUrlIndex: -1 }; // 全てのRPC URLが無効な場合、undefinedを返す
      }
    }
  }
  return { wallet: wallet, rpcUrlIndex: index };
}

export default getWallet;
