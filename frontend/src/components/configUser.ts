import { Wallet, HDNodeWallet, Contract } from 'ethers';
import SsdlabTokenAbi from '../../abi/SsdlabToken.json';

/**
 * @description Configures the user by setting the user address in the contract.
 * @param wallet - The wallet instance (either Wallet or HDNodeWallet) used to sign the transaction.
 * @param contractAddress - The address of the smart contract. 
 * @param userName - The name of the user to be configured.
 * @return {Promise<string>} - Returns the user address if successfully configured, otherwise returns "0x0000000000000000000000000000000000000000"
 */
const configUser = async (wallet: Wallet | HDNodeWallet | undefined, contractAddress: string, userName: string) => {
  const contract = new Contract(contractAddress, SsdlabTokenAbi.abi, wallet);
  let userAddress = "0x0000000000000000000000000000000000000000";

  // check if the wallet is connected
  if (wallet == undefined || wallet.provider == null) {
    console.error("Wallet is not connected");
    return userAddress;
  }

  // check if the userName
  userAddress = await contract.getUserAddress(userName);
  if (userAddress == "0x0000000000000000000000000000000000000000") { // check if the userName is not registered
    const tx = await contract.setUserAddress(userName, wallet.address);
    await tx.wait();
    userAddress = await contract.getUserAddress(userName);
    return userAddress;
  } else if (userAddress != wallet.address) { // check if the userName is already registered
    console.error("userName is already registered");
    return "0x0000000000000000000000000000000000000000";
  } else { // check if the userName is already registered
    return userAddress;
  }
}

export default configUser;
