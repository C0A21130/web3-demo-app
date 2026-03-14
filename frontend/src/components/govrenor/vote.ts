import { Contract, Wallet, HDNodeWallet } from "ethers";
import MyGovernor from "../../../abi/CustomGovernor.json";

/**
 * 作成された提案に対して投票を行う関数
 * @param wallet 投票を行うウォレット
 * @param governorContractAddress ガバナンスコントラクトのアドレス
 * @param proposalId 提案ID
 * @param support 0は反対、1は賛成、2は棄権を表す
 * @returns 
 */
const vote = async (wallet: Wallet | HDNodeWallet, governorContractAddress: string, proposalId: bigint, support: 0 | 1 | 2): Promise<void> => {
  const governorContract = new Contract(governorContractAddress, MyGovernor.abi, wallet);
  const provider = wallet.provider;

  // ウォレットの残高を確認する
  if (provider) {
    const balance = await provider.getBalance(wallet.address);
    if (balance <= 0n) {
      throw new Error('Insufficient balance');
    }
  }

  try {
    const tx = await governorContract.castVote(proposalId, support);
    await tx.wait();
  } catch (error: any) {
    if (error.message.includes('Transfer not allowed due to scoring rules')) {
      return;
    }
    console.error(error);
    throw new Error('Failed to vote');
  }
}

export default vote;