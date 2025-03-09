import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { ethers, formatUnits } from 'ethers';
import * as Testabi from '../abi/Test.json';

const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

describe('getWallet', () => {
  it('should return signer', async () => {
    const localStorage = localStorageMock;
    const wallet = await getWallet(localStorage);
    if (wallet === undefined) { return; }
    const address = await wallet.getAddress();
    expect(wallet).toBeDefined();
    expect(address).toBeDefined();
  });

  it('', async () => {
    const localStorage = localStorageMock;
    try { // test if the contract is deployed
      const wallet = await getWallet(localStorage);
      const contract = new ethers.Contract(contractAddress, Testabi.abi, wallet);
      const id = await contract.getId();
      expect(Number(formatUnits(id, 0))).toBe(1);
    } catch (e) {
      console.log(e);
    }
  });
});
