import { describe, it, expect } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { ethers, formatUnits } from 'ethers';
import * as Testabi from '../abi/Test.json';

const rpcUrl = 'http://10.203.92.71:8545';
const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

describe('getWallet', () => {
  it('should return signer', async () => {
    const localStorage = localStorageMock;
    const wallet = await getWallet(rpcUrl, localStorage);
    if (wallet === undefined) { return; }
    const address = await wallet.getAddress();
    expect(wallet).toBeDefined();
    expect(address).toBeDefined();
  });

  it('should interact with contract', async () => {
    const localStorage = localStorageMock;
    const wallet = await getWallet(rpcUrl, localStorage);
    const contract = new ethers.Contract(contractAddress, Testabi.abi, wallet);
    const id = await contract.getId();
    expect(Number(formatUnits(id, 0))).toBe(1);
  });

  it('should send ether', async () => {
    // Get wallet
    const localStorage = localStorageMock;
    const wallet = await getWallet(rpcUrl, localStorage);
    if (wallet === undefined) { return; }
    const provider = wallet.provider;
    if (provider === null) { return; }

    // Send ether
    const owner = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    const tx = {
      to: wallet.address,
      value: ethers.parseEther('1.0')
    };
    await owner.sendTransaction(tx);
    const walletBalance = await provider.getBalance(wallet.address);
    expect(ethers.formatEther(walletBalance)).toBe('1.0');
  });
});
