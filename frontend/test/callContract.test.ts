import { describe, it, expect } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { ethers } from 'ethers';
import SsdlabAbi from './../abi/SsdlabToken.json';
import putToken from '../src/components/putToken';
import fetchToken from '../src/components/fetchTokens';

const rpcUrl = 'http://localhost:8545';
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const sendEther = async (wallet: ethers.Wallet, to: string, amount: string) => {
  const tx = {
    to: to,
    value: ethers.parseEther(amount)
  };
  const txReceipt = await wallet.sendTransaction(tx);
  await txReceipt.wait();
};

describe('callContract', () => {
  const localStorage = localStorageMock;
  const localStorage2 = localStorageMock;

  it('should mint for NFT', async () => {
    // Get wallet
    const wallet = await getWallet(rpcUrl, localStorage);
    if (wallet === undefined) { return; }
    const provider = wallet.provider;
    if (provider === null) { return; }

    // Send ether to wallet
    const teacherWallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    await sendEther(teacherWallet, wallet.address, '1.0');

    // Call contract to mint NFT
    const tokenName = 'Frends Lost Token';
    const txReceipt = await putToken(wallet, contractAddress, tokenName);
    await txReceipt.wait();

    // Check if token was minted
    const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
    expect(await contract.getTokenName(0)).toBe(tokenName);
  }, 30000);

  it('should fetch tokens', async () => {
    const wallet = await getWallet(rpcUrl, localStorage);
    if (wallet === undefined) { return; }

    const tokens = await fetchToken(wallet, contractAddress)
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].name).toBe('Frends Lost Token');
    expect(tokens[0].tokenId).toBe(0);
  }, 30000);
});
