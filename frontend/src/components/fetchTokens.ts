import { Contract, Wallet, HDNodeWallet, EventLog, JsonRpcProvider, Provider } from "ethers";
import SsdlabAbi from "../../abi/SsdlabToken.json";

/**
 * This function fetches the tokens minted by the provided wallet and contract address.
 * @param rpcUrl - The RPC URL to connect to the Ethereum network.
 * @param contractAddress - The address of the contract to fetch tokens from.
 * @param wallet - The wallet instance to use for fetching tokens. If undefined, a provider will be used.
 * @param level - The level of tokens to fetch. It can be "all", "sent", or "receive".
 * @returns Tokens - An array of tokens with their details.
 * @returns number - A status code indicating the result of the operation.
 */
const fetchTokens = async (rpcUrl: string, wallet: Wallet | HDNodeWallet | undefined, contractAddress: string, level: "all" | "sent" | "receive"): Promise<[Token[], number]> => {
  let tokens: Token[] = [];
  let contract: Contract;
  let from: string | null = null;
  let to: string | null = null;
  let provider: JsonRpcProvider | Provider;

  if (wallet == undefined || wallet.provider == undefined) {
    // Create a provider if wallet is undefined
    try {
      provider = new JsonRpcProvider(rpcUrl);
      await provider.getNetwork(); // Check if the RPC URL is valid
    } catch (error) {
      console.error("Error creating provider:", error);
      return [[], -1]; // Return empty array if provider creation fails
    } 
  } else {
    provider = wallet.provider;
  }

  // Check if the contract address is valid
  const code = await provider.getCode(contractAddress);
  if (code === "0x") {
    console.error("Contract not found at the provided address:", contractAddress);
    return [[], -2]; // Return empty array if contract not found
  }

  // Create a contract instance
  contract = new Contract(contractAddress, SsdlabAbi.abi, provider);

  // Set the from and to addresses
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

  // Fetch the Transfer event logs
  const filter = contract.filters.Transfer(from, to, null);
  let logs = await contract.queryFilter(filter);
  if (level === "all" || level === "receive") {
    logs = logs.filter((log) => {
      const fromAddress = (log as EventLog).args![0];
      return fromAddress !== "0x0000000000000000000000000000000000000000";
    });
  }

  // Fetch the tokens details for event logs
  tokens = await Promise.all(logs.map(async (log) => {
    const tokenId = Number((log as EventLog).args![2]);
    const owner = await contract.ownerOf(tokenId);
    const tokenName = await contract.getTokenName(tokenId);
    const fromAddress = (log as EventLog).args![0];
    const toAddress = (log as EventLog).args![1];
    return { tokenId: tokenId, owner: owner, name: tokenName, from: fromAddress, to: toAddress};
  }));
  return [tokens, 0];
};

export default fetchTokens;
