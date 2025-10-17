import { describe, it, expect } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { Wallet, parseEther } from 'ethers';
import putToken from '../src/components/putToken';
import fetchTokens from '../src/components/fetchTokens';
import transferToken from '../src/components/transferToken';
import configUser from '../src/components/configUser';

const rpcUrls = ['http://localhost:8545'];
const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sendEther = async (wallet: Wallet, to: string, amount: string) => {
  const tx = {
    to: to,
    value: parseEther(amount)
  };
  const txReceipt = await wallet.sendTransaction(tx);
  await txReceipt.wait();
  await delay(500);
}

describe('token', () => {

  it('should mint for token', async () => {
    // Get wallet
    const localStorage = localStorageMock;
    const { wallet } = await getWallet(rpcUrls, localStorage);
    if (wallet === undefined) { return; }
    const provider = wallet.provider;
    if (provider === null) { return; }

    // Send ether to wallet
    const teacherWallet = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    await sendEther(teacherWallet, wallet.address, '1.0');

    // Call contract to mint NFT
    const tokenName = 'Frends Lost Token';
    const txReceipt = await putToken(wallet, contractAddress, tokenName);

    // Check if token was minted
    expect(txReceipt).toBeDefined();
  }, 30000);

  it('should transfer token', async () => {
    const localStorage = localStorageMock;
    const localStorage2 = localStorageMock;
    const student1Wallet = await getWallet(rpcUrls, localStorage);
    const student2Wallet = await getWallet(rpcUrls, localStorage2);
    if (student1Wallet === undefined || student2Wallet === undefined) { return; }

    // transfer ether to student wallet
    const provider = student1Wallet.wallet.provider;
    if (provider === null) { return; }
    const teacherWallet = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    await sendEther(teacherWallet, student1Wallet.wallet.address, '1.0');
    await sendEther(teacherWallet, student2Wallet.wallet.address, '1.0');

    // Mint token
    const txReceipt = await putToken(student1Wallet.wallet, contractAddress, 'Frends Lost Token');
    await delay(500);

    // Transfer token
    const tokenId = txReceipt.logs[txReceipt.length - 1].args[2];
    await transferToken(student1Wallet.wallet, contractAddress, student2Wallet.wallet.address, tokenId);

    // Check if token was transferred
    const tokens = await fetchTokens(rpcUrls[student2Wallet.rpcUrlIndex], student2Wallet.wallet, contractAddress, "receive");
    const token = tokens[0][tokens[0].length - 1];
    expect(tokens[0].length).toBeGreaterThanOrEqual(1);
    expect(token.tokenId).toBe(Number(tokenId));
    expect(token.owner).toBe(student2Wallet.wallet.address);
    expect(token.name).toBe('Frends Lost Token');
    expect(token.from).toBe(student1Wallet.wallet.address);
    expect(token.to).toBe(student2Wallet.wallet.address);
  }, 30000);

  it("should transfer token for user name", async () => {
    // Get wallet
    const localStorage = localStorageMock;
    const localStorage2 = localStorageMock;
    const user1wallet = await getWallet(rpcUrls, localStorage);
    const user2Wallet = await getWallet(rpcUrls, localStorage2);
    const userName1 = `user${Math.random().toString(36).substring(2, 15)}`;
    const userName2 = `user${Math.random().toString(36).substring(2, 15)}`;

    if (user1wallet === undefined || user2Wallet === undefined) { return; }

    // send ether to student wallet
    const provider = user1wallet.wallet.provider;
    if (provider === null) { return; }
    const teacherWallet = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    await sendEther(teacherWallet, user1wallet.wallet.address, '0.1');
    await sendEther(teacherWallet, user2Wallet.wallet.address, '0.1');

    // set and get user name
    const user1Address = await configUser(user1wallet.wallet, contractAddress, userName1);
    await delay(500);
    const user2Address = await configUser(user2Wallet.wallet, contractAddress, userName2);
    await delay(500);

    // mint token
    if (user1Address === "0x0000000000000000000000000000000000000000" || user2Address === "0x0000000000000000000000000000000000000000") {
      console.error("user name is not registered");
      return;
    }
    const txReceipt = await putToken(user1wallet.wallet, contractAddress, 'Frends Lost Token');
    await delay(500);

    // transfer token
    const tokenId = txReceipt.logs[0].args[2];
    await transferToken(user1wallet.wallet, contractAddress, userName2, tokenId);
    await delay(500);

    // check if token was transferred
    const tokens = await fetchTokens(rpcUrls[user2Wallet.rpcUrlIndex], user2Wallet.wallet, contractAddress, "receive");
    const token = tokens[0][tokens[0].length - 1];
    expect(tokens[0].length).toBeGreaterThanOrEqual(1);
    expect(token.tokenId).toBe(Number(tokenId));
    expect(token.owner).toBe(user2Address);
    expect(token.name).toBe('Frends Lost Token');
    expect(token.from).toBe(user1Address);
    expect(token.to).toBe(user2Address);
  }, 30000);
  
});
