import { describe, it, expect } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { ethers } from 'ethers';
import SsdlabAbi from './../abi/SsdlabToken.json';
import putToken from '../src/components/putToken';

const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

describe('callContract', () => {
  const localStorage = localStorageMock;

  it('should send ether', async () => {
    // Get wallet
    const wallet = await getWallet(localStorage);
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

  it('should mint for NFT', async () => {
    // Get wallet
    const localStorage = localStorageMock;
    const wallet = await getWallet(localStorage);
    if (wallet === undefined) { return; }
    const provider = wallet.provider;
    if (provider === null) { return; }

    // Call contract to mint NFT
    const tokenName = 'Frends Lost Token';
    const txReceipt = await putToken(wallet, contractAddress, tokenName);
    await txReceipt.wait();

    // Check if token was minted
    const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
    expect(await contract.getTokenName(1)).toBe(tokenName);
  });
});
