import { Contract, Wallet, HDNodeWallet } from "ethers";
import MyGovernor from "../../../abi/CustomGovernor.json";

type ProposeContent = {
  proposalId: bigint;
  proposalUri: string;
  target: string;
  text: string;
  data: string;
  descriptionHash: string;
  state: bigint;
};

/**
 * 投票結果が賛成多数である提案を実行する関数
 * @param wallet 投票結果が賛成多数である提案を実行するウォレット
 * @param governorContractAddress ガバナンスコントラクトのアドレス
 * @param proposalContent 実行する提案の内容
 * @returns 提案の実行に成功したかどうか
 */
const execute = async (wallet: Wallet | HDNodeWallet, governorContractAddress: string, proposalContent: ProposeContent) => {
  const governorContract = new Contract(governorContractAddress, MyGovernor.abi, wallet);
  const provider = wallet.provider;

  // ウォレットの残高を確認する
  if (provider) {
    const balance = await provider.getBalance(wallet.address);
    if (balance <= 0n) {
      throw new Error('Insufficient balance');
    }
  }

  // 投票が終了し賛成が多数であることを確認する
  const proposalState = await governorContract.state(proposalContent.proposalId);
  if (proposalState != 4n) {
    console.error(`Proposal state is not succeeded. Current state: ${proposalState}`);
    return false;
  }

  // 投票を作成するスマートコントラクトを呼び出す
  try {
    const tx = await governorContract.execute([proposalContent.target], [0], [proposalContent.data], proposalContent.descriptionHash);
    const txReceipt = await tx.wait();
    return txReceipt ? true : false;
  } catch (error: any) {
    if (error.message.includes('Transfer not allowed due to scoring rules')) {
      return false;
    }
    console.error(error);
    throw new Error('Failed to transfer NFT');
  }
}

export default execute;
