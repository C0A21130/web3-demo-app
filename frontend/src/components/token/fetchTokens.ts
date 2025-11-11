import { Contract, Wallet, HDNodeWallet, EventLog, JsonRpcProvider, Provider } from "ethers";
import SsdlabAbi from "../../../abi/SsdlabToken.json";

/**
 * 指定されたウォレットとコントラクトアドレスからミントされたトークンを取得する関数
 * @param rpcUrl - Ethereumネットワークに接続するためのRPC URL
 * @param contractAddress - トークンを取得するコントラクトのアドレス
 * @param wallet - トークン取得に使用するウォレットインスタンス。undefinedの場合はプロバイダーが使用される
 * @param level - 取得するトークンのレベル。"all"、"sent"、または"receive"を指定可能
 * @returns Tokens - トークンの詳細情報を含む配列
 * @returns number - 操作結果を示すステータスコード
 */
const fetchTokens = async (rpcUrl: string, wallet: Wallet | HDNodeWallet | undefined, contractAddress: string, level: "all" | "sent" | "receive"): Promise<[Token[], number]> => {
  let tokens: Token[] = [];
  let contract: Contract;
  let from: string | null = null;
  let to: string | null = null;
  let provider: JsonRpcProvider | Provider;

  if (wallet == undefined || wallet.provider == undefined) {
    // ウォレットがundefinedの場合はプロバイダーを作成
    try {
      provider = new JsonRpcProvider(rpcUrl);
      await provider.getNetwork(); // RPC URLが有効かチェック
    } catch (error) {
      console.error("Error creating provider:", error);
      return [[], -1]; // プロバイダー作成に失敗した場合は空の配列を返す
    } 
  } else {
    provider = wallet.provider;
  }

  // コントラクトアドレスが有効かチェック
  const code = await provider.getCode(contractAddress);
  if (code === "0x") {
    console.error("Contract not found at the provided address:", contractAddress);
    return [[], -2]; // コントラクトが見つからない場合は空の配列を返す
  }

  // コントラクトインスタンスを作成
  contract = new Contract(contractAddress, SsdlabAbi.abi, provider);

  // レベルに基づいてフィルターを決定
  if (level === "all" || wallet === undefined) {
    from = null;
    to = null;
  } else if (level === "sent") {
    from = wallet.address;
    to = null;
  } else if (level === "receive") {
    from = null;
    to = wallet.address;
  }

  // transferイベントログを取得
  const filter = contract.filters.Transfer(from, to, null);
  let logs = await contract.queryFilter(filter);
  if (level === "all" || level === "receive") {
    logs = logs.filter((log) => {
      const fromAddress = (log as EventLog).args![0];
      return fromAddress !== "0x0000000000000000000000000000000000000000";
    });
  }

  // tokens配列をログからマッピングして作成
  tokens = await Promise.all(logs.map(async (log) => {
    const tokenId = Number((log as EventLog).args![2]);
    const owner = await contract.ownerOf(tokenId);
    const tokenName = await contract.getTokenName(tokenId);
    const fromAddress = (log as EventLog).args![0];
    const toAddress = (log as EventLog).args![1];
    const tokenURI = await contract.getTokenURI(tokenId);
    let imageUrl: string | null = null;
    let description: string | null = null;

    // tokenURIが存在する場合、メタデータを取得して画像URLと説明を抽出
    if (tokenURI && tokenURI.trim() !== "") {
      try {
        const response = await fetch(tokenURI);
        const metadata = await response.json();
        description = metadata.description;
        imageUrl = metadata.image;
      } catch (error) {
        console.error(`Failed to fetch metadata for token ID ${tokenId}:`, error);
      }
    }

    return { 
      tokenId: tokenId, 
      owner: owner, 
      name: tokenName,
      from: fromAddress, 
      to: toAddress,
      description: description,
      imageUrl: imageUrl
    };
  }));
  return [tokens, 0];
};

export default fetchTokens;
