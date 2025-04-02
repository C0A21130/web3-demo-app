import { Wallet, HDNodeWallet, Contract } from 'ethers';
import SsdlabTokenAbi from '../../abi/SsdlabToken.json';

// User configuration
const configUser = async (wallet: Wallet | HDNodeWallet | undefined, contractAddress: string, userName: string) => {
  const contract = new Contract(contractAddress, SsdlabTokenAbi.abi, wallet);
  let userAddress = "0x0000000000000000000000000000000000000000";
  // check if the wallet is connected
  if (!wallet) {
    throw new Error('Wallet is not connected');
  }
  const provider = wallet.provider;
  if (!provider) {
    throw new Error('Provider is not connected');
  }

  // check if the userName
  userAddress = await contract.getUserAddress(userName);
  if (userAddress == "0x0000000000000000000000000000000000000000") {
    const tx = await contract.setUserAddress(userName, wallet.address);
    await tx.wait();
    userAddress = await contract.getUserAddress(userName);
  }
  return userAddress;
}

export default configUser;
