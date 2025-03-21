import { ethers, Wallet, HDNodeWallet, formatEther, parseEther } from "ethers";
import SsdlabAbi from './../../abi/SsdlabToken.json';

/**
 * This function mints a new NFT token using the provided wallet and contract address.
 * 
 * @param wallet - The wallet instance (either Wallet or HDNodeWallet) used to sign the transaction.
 * @param contractAddress - The address of the smart contract to interact with.
 * @param tokenName - The name of the token to be minted.
 * @returns The transaction receipt of the minting process.
 * @throws Will throw an error if the wallet balance is insufficient or if the minting process fails.
 */
const putToken = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string) => {
    // check balance of wallet
    const provider = wallet.provider;
    if (provider === null) { return; }
    const balance = await provider.getBalance(wallet.address);

    // Check if the wallet has enough balance to mint NFT
    if (formatEther(balance) == "0.0") {
        throw new Error('Insufficient balance');
    }

    // Call contract to mint NFT
    try {
        const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
        const txReceipt = await contract.safeMint(wallet.address, tokenName);
        await txReceipt.wait();
        return txReceipt;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to mint NFT');
    }
}

export default putToken;
