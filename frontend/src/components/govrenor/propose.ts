import { Contract, Wallet, HDNodeWallet, Interface, keccak256, toUtf8Bytes } from "ethers";
import { KuboRPCClient } from "kubo-rpc-client";
import MyGovernor from "../../../abi/CustomGovernor.json";
import SsdlabToken from "../../../abi/SsdlabToken.json";

type ProposeParams = {
  wallet: Wallet | HDNodeWallet; // 提案を作成するウォレット
  contractAddress: string; // NFTコントラクトのアドレス
  governorContractAddress: string; // ガバナンスコントラクトのアドレス
  ipfsApiUrl: string; // IPFS EndpointのURL
  client: KuboRPCClient; // IPFSクライアント
  text: string; // 提案の説明
}

const uploadDoc = async (client: KuboRPCClient, target: string, text: string, data: string, description: string): Promise<string> => {
  try {
    const descriptionHash = keccak256(toUtf8Bytes(description));
    const content = JSON.stringify({ target: target, text: text, data: data, descriptionHash: descriptionHash });
    const { cid } = await client.add(new Blob([content], { type: 'application/json' }));
    return cid.toString();
  } catch (error) {
    console.error('Failed to upload document to IPFS:', error);
    throw new Error(`Failed to upload document to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * 作成された提案をガバナンスコントラクトに提出する関数
 * @param params 提案の作成に必要なパラメータを含むオブジェクト
 * @returns 提案のURI
 */
const propose = async (params: ProposeParams) => {
  const { wallet, contractAddress, governorContractAddress, ipfsApiUrl, client, text } = params;
  const governorContract = new Contract(governorContractAddress, MyGovernor.abi, wallet);
  const iface = new Interface(SsdlabToken.abi);
  const provider = wallet.provider;

  // ウォレットの残高を確認する
  if (provider) {
    const balance = await provider.getBalance(wallet.address);
    if (balance <= 0n) {
      throw new Error('Insufficient balance');
    }
  }

  // 提案が可決される際のNFTを発行する
  const target = contractAddress; // ターゲットコントラクトのアドレス
  const value = 0; // 送金するETHの量
  const data = iface.encodeFunctionData("safeMint", [wallet.address, "Proposal NFT"]); // コールデータ（例: NFTを転送する） 
  const description = text; // 提案の説明
  let proposalUri = ""; // 提案の詳細を記載したドキュメントのURI（例: IPFSにアップロードしたJSONファイルのURI）
  if (client) {
    const cid = await uploadDoc(client, target, text, data, description);
    proposalUri = `${ipfsApiUrl}:8080/ipfs/${cid}`;
  }

  // 投票を作成するスマートコントラクトを呼び出す
  try {
    const tx = await governorContract.proposeAction([target], [value], [data], description, proposalUri);
    await tx.wait();
    return proposalUri;
  } catch (error: any) {
    if (error.message.includes('Transfer not allowed due to scoring rules')) {
      return "";
    }
    console.error(error);
    throw new Error('Failed to propose action');
  }
}

export default propose;
