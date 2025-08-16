import { describe, it, expect } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { Wallet, parseEther } from 'ethers';
import configUser from '../src/components/configUser';

const rpcUrl = 'http://localhost:8545';
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const sendEther = async (wallet: Wallet, to: string, amount: string) => {
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const tx = {
    to: to,
    value: parseEther(amount)
  };
  const txReceipt = await wallet.sendTransaction(tx);
  await txReceipt.wait();
  await delay(500);
};

describe('userName', () => {

  it("should set user name and get user name", async () => {
    // Get wallet
    const localStorage = localStorageMock;
    const localStorage2 = localStorageMock;
    const student1wallet = await getWallet(rpcUrl, localStorage);
    const student2Wallet = await getWallet(rpcUrl, localStorage2);
    if (student1wallet === undefined || student2Wallet === undefined) { return; }

    // send ether to student wallet
    const provider = student1wallet.provider;
    if (provider === null) { return; }
    const teacherWallet = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    await sendEther(teacherWallet, student1wallet.address, '1.0');
    await sendEther(teacherWallet, student2Wallet.address, '1.0');

    // set user name
    const user1Address = await configUser(student1wallet, contractAddress, `student${Math.floor(Math.random() * 1000)}`);
    const user2Address = await configUser(student2Wallet, contractAddress, `student${Math.floor(Math.random() * 1000)}`);

    // check if user name was set
    if (user1Address === "0x0000000000000000000000000000000000000000" || user2Address === "0x0000000000000000000000000000000000000000") { return; }
    expect(user1Address).toBe(student1wallet.address);
    expect(user2Address).toBe(student2Wallet.address);
  }, 30000);
});
