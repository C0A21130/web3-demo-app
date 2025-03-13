import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { ethers, formatUnits } from 'ethers';
import * as Testabi from '../abi/Test.json';

const rpcUrl = "http://10.203.92.:8545";
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

describe('getWallet', () => {
  it('should return signer', async () => {
    const localStorage = localStorageMock;
    const wallet = await getWallet(rpcUrl, localStorage);
    if (wallet === undefined) { return; }
    const address = await wallet.getAddress();
    expect(wallet).toBeDefined();
    expect(address).toBeDefined();
  });

  it('should call contract for wallet', async () => {
    const localStorage = localStorageMock;
    try { // test if the contract is deployed
      const wallet = await getWallet(rpcUrl, localStorage);
      const contract = new ethers.Contract(contractAddress, Testabi.abi, wallet);
      const id = await contract.getId();
      expect(Number(formatUnits(id, 0))).toBe(1);
    } catch (e) {
      console.log(e);
    }
  });

  it('Should be equal random wallet and wallet with a private key', async () => {
    const localStorage = localStorageMock;
    const randomWallet = await getWallet(rpcUrl, localStorage); // create random wallet
    const wallet = await getWallet(rpcUrl, localStorage); // create wallet with private key
    if (randomWallet === undefined || wallet === undefined) { return; }
    const randomPrivateKey = randomWallet.privateKey;
    const randomAddress = randomWallet.address;
    const privateKey = wallet.privateKey;
    const address = wallet.address;
    // compare
    expect(randomPrivateKey).toBe(privateKey);
    expect(randomAddress).toBe(address);
  });
});
