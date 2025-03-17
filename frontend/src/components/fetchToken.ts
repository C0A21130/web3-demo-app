import { ethers, Wallet, HDNodeWallet, formatUnits, EventLog } from "ethers";
import SsdlabAbi from "./../../abi/SsdlabToken.json";

/**
 * This function fetches the tokens minted by the provided wallet and contract address.
 * @param wallet 
 * @param contractAddress 
 * @returns
 */
const fetchToken = async (wallet: Wallet | HDNodeWallet, contractAddress: string) => {
    const tokens: Token[] = [];
    const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);

    // Listen for token minted
    const filter = contract.filters.Transfer("0x0000000000000000000000000000000000000000", null, null);
    const logs = await contract.queryFilter(filter);
    const tokenCount = logs.length;

    // Fetch token
    for (let i = 0; i < tokenCount; i++) {
        // console.log(logs[i]);
        const tokenId = await Number((logs[i] as EventLog).args![2]);
        const owner = await contract.ownerOf(tokenId);
        const tokenName = await contract.getTokenName(tokenId);
        tokens.push({ tokenId: tokenId, owner: owner, name: tokenName });
    }
    return tokens;
};

export default fetchToken;
