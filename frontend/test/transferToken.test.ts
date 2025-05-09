import { describe, it, expect } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { ethers } from 'ethers';
import putToken from '../src/components/putToken';
import fetchTokens from '../src/components/fetchTokens';
import transferToken from '../src/components/transferToken';
import configUser from '../src/components/configUser';

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

describe('transferToken', () => {

  it("should transfer token for user name", async () => {
    // Get wallet
    const localStorage = localStorageMock;
    const localStorage2 = localStorageMock;
    const user1wallet = await getWallet(rpcUrl, localStorage);
    const user2Wallet = await getWallet(rpcUrl, localStorage2);
    if (user1wallet === undefined || user2Wallet === undefined) { return; }

    // send ether to student wallet
    const provider = user1wallet.provider;
    if (provider === null) { return; }
    const teacherWallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
    await sendEther(teacherWallet, user1wallet.address, '0.1');
    await sendEther(teacherWallet, user2Wallet.address, '0.1');

    // set and get user name
    const user1Address = await configUser(user1wallet, contractAddress, "user1");
    const user2Address = await configUser(user2Wallet, contractAddress, "user2");

    // mint token
    if (user1Address === "0x0000000000000000000000000000000000000000" || user2Address === "0x0000000000000000000000000000000000000000") {
      console.log("user name is not registered");
      return;
    }
    const txReceipt = await putToken(user1wallet, contractAddress, 'Frends Lost Token');

    // transfer token
    const tokenId = txReceipt.logs[0].args[2];
    await transferToken(user1wallet, contractAddress, "user2", tokenId);

    // check if token was transferred
    const tokens = await fetchTokens(rpcUrl, user2Wallet, contractAddress, "receive");
    expect(tokens.length).toBeGreaterThanOrEqual(1);
  }, 30000);

});
