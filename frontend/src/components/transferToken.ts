import { ethers, Wallet, HDNodeWallet, formatEther, isAddress } from "ethers";
import SsdlabAbi from "./../../abi/SsdlabToken.json";

/**
 * This function transfers an NFT token using the provided wallet and contract address.
 * 
 * @param wallet - The wallet instance (either Wallet or HDNodeWallet) used to sign the transaction.
 * @param contractAddress - The address of the smart contract to interact with.
 * @param to - The address of the recipient of the NFT token.
 * @param tokenId - The ID of the NFT token to be transferred.
 * @throws Will throw an error if the wallet balance is insufficient or if the transfer process fails.
 */
const transferToken = async (wallet: Wallet | HDNodeWallet, contractAddress: string, to: string, tokenId: number) => {
  const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
  const from = wallet.address;
  let toAddress = to;
  const balance = await contract.balanceOf(from);

  // Check if the wallet has enough balance to mint NFT
  if (formatEther(balance) == "0.0") {
    throw new Error('Insufficient balance');
  }

  // transfer address to user name
  if (!isAddress(to)) {
    toAddress = await contract.getUserAddress(to);
  }

  // Call contract to transfer NFT
  try {
    const tx = await contract.safeTransferFrom(from, toAddress, tokenId);
    const txReceipt = await tx.wait();
    return txReceipt;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to transfer NFT');
  }
};

export default transferToken;
