import { ethers, Wallet, HDNodeWallet, EventLog } from "ethers";
import SsdlabAbi from "../../abi/SsdlabToken.json";

/**
 * This function fetches the tokens minted by the provided wallet and contract address.
 * @param wallet 
 * @param contractAddress 
 * @returns
 */
const fetchTokens = async (wallet: Wallet | HDNodeWallet, contractAddress: string, level: "all" | "sent" | "receive") => {
  let tokens: Token[] = [];
  const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
  let from: string | null = null;
  let to: string | null = null;

  // Set the from and to addresses
  if (level === "sent") {
    from = wallet.address;
    to = null;
  } else if (level === "receive") {
    from = null;
    to = wallet.address;
  } else {
    from = "0x0000000000000000000000000000000000000000";
    to = null;
  }

  // Fetch the tokens
  const filter = contract.filters.Transfer(from, to, null);
  const logs = await contract.queryFilter(filter);
  tokens = await Promise.all(logs.map(async (log) => {
    const tokenId = Number((log as EventLog).args![2]);
    const owner = await contract.ownerOf(tokenId);
    const tokenName = await contract.getTokenName(tokenId);
    return { tokenId: tokenId, owner: owner, name: tokenName };
  }));
  return tokens;
};

export default fetchTokens;
