import { ethers, Wallet, HDNodeWallet } from 'ethers';

const transferEther = async (wallet: Wallet | HDNodeWallet, to: string, amount: string) => {
  try {
    // トランザクションを送信する
    // const tx = await contract.sendTransaction(to, { value: ethers.parseEther(amount) });
    const tx = {
      to: to,
      value: ethers.parseEther(amount)
    }
    const txResponse = await wallet.sendTransaction(tx);
    await txResponse.wait();
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
}
export default transferEther;

