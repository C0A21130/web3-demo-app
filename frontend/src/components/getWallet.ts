import { ethers, Wallet, HDNodeWallet } from 'ethers';

/**
 * @param rpcUrl - RPC URL
 * @param localStorage - ローカルストレージ
 * @returns wallet - ウォレット。walletはsignerの一種。
 * @description ローカルストレージに保存されている秘密鍵を取得し、ウォレットを生成する。秘密鍵が存在しない場合は、新しい秘密鍵を生成し、ローカルストレージに保存する。
 * @see https://docs.ethers.org/v6/api/wallet/
**/
const getWallet = async (rpcUrl: string, localStorage: Storage) => {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    let wallet: Wallet | HDNodeWallet;

    // プロバイダーが接続されているか確認する
    try {
        await provider.getNetwork();
    } catch (e) {
        console.error('Provider is not connected');
        return;
    }
    
    // 秘密鍵が存在するか確認する
    const secretKey = localStorage.getItem('secretKey');
    if (secretKey != null) { // 秘密鍵が存在する場合
        wallet = new Wallet(secretKey, provider);
    } else { // 秘密鍵が存在しない場合
        const HDwallet = Wallet.createRandom(provider);
        wallet = HDwallet.connect(provider);
        const randomKey = HDwallet.privateKey;
        localStorage.setItem('secretKey', randomKey);
    }

    return wallet;
}

export default getWallet;
