import { ethers, Wallet, HDNodeWallet, parseEther } from 'ethers';

/**
 * 指定したウォレットから別のウォレットへEtherを送金する関数
 * @param privateKey 送金元のウォレットのプライベートキー
 * @param toWallet 送金先のウォレット
 */
const transferEther = async (privateKey: string, toWallet: Wallet | HDNodeWallet, endpointURL: string): Promise<boolean> => {
  // 送金先アドレスの検証
  if (!ethers.isAddress(toWallet.address)) {
    console.error('Invalid recipient address:', toWallet.address);
    return false;
  }

  // プライベートキーが空の場合はFaucetから入金する
  if (privateKey === '') {
    try {
      const response = await fetch(`${endpointURL}/faucet?address=${toWallet.address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        console.error('Faucet request failed with status:', response.status);
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  // 送金元ウォレットの作成と接続確認
  const provider = toWallet.provider;
  const fromWallet = new Wallet(privateKey).connect(provider);
  if (!provider) {
    console.error('Provider is not set for the sender wallet');
    return false;
  }

  // 残高の取得と0.2ETH以下であることの確認
  const balance = await provider.getBalance(toWallet.address);
  if ((balance + parseEther('0.1')) > parseEther('0.2')) {
    console.error('Insufficient balance in the recipient wallet:', toWallet.address);
    return false;
  }

  // 送金処理
  try {
    const tx = {
      to: toWallet.address,
      value: parseEther('0.1')
    }
    const txReceipt = await fromWallet.sendTransaction(tx);
    await txReceipt.wait()
    return true;
  } catch (error) {
    console.error('Error sending transaction:', error);
    return false;
  }
}
export default transferEther;

