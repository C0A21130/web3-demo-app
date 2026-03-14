import { Contract, Wallet, HDNodeWallet} from "ethers";
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
 * ガバナンスコントラクトから提案の内容を取得する関数
 * @param wallet 提案の内容を取得するウォレット
 * @param governorContractAddress ガバナンスコントラクトのアドレス
 * @returns 提案の内容の配列
 */
const fetchProposals = async (wallet: Wallet | HDNodeWallet, governorContractAddress: string): Promise<ProposeContent[]> => {
  const governorContract = new Contract(governorContractAddress, MyGovernor.abi, wallet);
  const provider = wallet.provider;

  // ウォレットの残高を確認する
  if (provider) {
    const balance = await provider.getBalance(wallet.address);
    if (balance <= 0n) {
      throw new Error('Insufficient balance');
    }
  }

  // 提案のURIをイベントログから取得する
  const filter = governorContract.filters.ProposalMaterialURISet(null, null);
  let logs: any[] = await governorContract.queryFilter(filter);
  const propossals = logs.map(log => {
    const [proposalId, proposalUri] = log.args;
    return { proposalId: BigInt(proposalId), proposalUri };
  });

  // 提案のURIが存在するか確認する
  const proposalContents = await Promise.all(
    propossals.map(async (proposal) => {
      let proposalData;
      let state = 0n;
      try {
        const response = await fetch(proposal.proposalUri);
        state = await governorContract.state(proposal.proposalId);
        if (response.ok) {
          proposalData = await response.json();
        }
      } catch (error) {
        console.error(`Error fetching proposal data from URI: ${proposal.proposalUri}`, error);
      }
      return {
        proposalId: proposal.proposalId,
        proposalUri: proposal.proposalUri,
        target: proposalData.target || "",
        state: state,
        text: proposalData.text || "",
        data: proposalData.data || "",
        descriptionHash: proposalData.descriptionHash || ""
      }
    })
  );

  return proposalContents;
}

export default fetchProposals;
