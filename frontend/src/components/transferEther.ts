import { ethers, Wallet, HDNodeWallet, parseEther, formatEther } from 'ethers';

const transferEther = async (fromWallet: Wallet | HDNodeWallet, toWallet: Wallet | HDNodeWallet, amount: number): Promise<string> => {
  // from addressの検証
  if (!ethers.isAddress(toWallet.address)) {
    console.error('Invalid recipient address:', toWallet.address);
    return "無効な受取人アドレスです";
  }

  // to addressの検証
  if (!ethers.isAddress(fromWallet.address)) {
    console.error('Invalid sender address:', fromWallet.address);
    return "無効な送信者アドレスです";
  }

  // providerの取得
  const provider = fromWallet.provider;
  if (!provider) {
    console.error('Provider is not set for the sender wallet');
    return "プロバイダーが設定されていません";
  }

  //残高の取得と0.1ETH以下であることの確認
  const balance = await provider.getBalance(toWallet.address);
  if (balance >= parseEther('0.1')) {
    console.error('Insufficient balance in the recipient wallet:', toWallet.address);
    return "残高は十分です";
  }

  try {
    // トランザクションを送信する
    const tx = {
      to: toWallet.address,
      value: parseEther(amount.toString())
    }
    const txResponse = await fromWallet.sendTransaction(tx);
    await txResponse.wait();
    const balanceAfter = await provider.getBalance(toWallet.address);
    return `Transaction successful! New balance: ${formatEther(balanceAfter)} ETH`;
  } catch (error) {
    console.error('Error sending transaction:', error);
    return "トランザクションの送信中にエラーが発生しました";
  }
}
export default transferEther;

