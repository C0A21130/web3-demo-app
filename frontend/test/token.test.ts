import { describe, it, expect } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { ethers } from 'ethers';
import SsdlabAbi from '../abi/SsdlabToken.json';
import putToken from '../src/components/putToken';
import fetchToken from '../src/components/fetchTokens';
import transferToken from '../src/components/transferToken';

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

describe('token', () => {

  it('should mint for token', async () => {
    // Get wallet
    const localStorage = localStorageMock;
    const wallet = await getWallet(rpcUrl, localStorage);
    if (wallet === undefined) { return; }
    const provider = wallet.provider;
    if (provider === null) { return; }

    // Send ether to wallet
    const teacherWallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    await sendEther(teacherWallet, wallet.address, '1.0');

    // Call contract to mint NFT
    const tokenName = 'Frends Lost Token';
    await putToken(wallet, contractAddress, tokenName);

    // Check if token was minted
    const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
    expect(await contract.getTokenName(0)).toBe(tokenName);
  }, 30000);

  it('should transfer token', async () => {
    const localStorage = localStorageMock;
    const localStorage2 = localStorageMock;
    const student1Wallet = await getWallet(rpcUrl, localStorage);
    const student2Wallet = await getWallet(rpcUrl, localStorage2);
    if (student1Wallet === undefined || student2Wallet === undefined) { return; }
    const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, student1Wallet);

    // transfer ether to student wallet
    const provider = student1Wallet.provider;
    if (provider === null) { return; }
    const teacherWallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    await sendEther(teacherWallet, student1Wallet.address, '1.0');
    await sendEther(teacherWallet, student2Wallet.address, '1.0');

    // Mint token
    const txReceipt = await putToken(student1Wallet, contractAddress, 'Frends Lost Token');

    // Transfer token
    const tokenId = txReceipt.logs[0].args[2];
    await transferToken(student1Wallet, contractAddress, student2Wallet.address, tokenId);
    expect(await contract.ownerOf(tokenId)).toBe(student2Wallet.address);

    // Check if token was transferred
    const tokens = await fetchToken(rpcUrl, student2Wallet, contractAddress, "receive");
    expect(tokens.length).toBeGreaterThanOrEqual(1);
  }, 30000);
  
});
