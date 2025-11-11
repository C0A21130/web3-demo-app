import { describe, it, expect } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { Wallet, parseEther, JsonRpcProvider } from 'ethers';
import putToken from '../src/components/token/putToken';
import fetchTokens from '../src/components/token/fetchTokens';
import transferToken from '../src/components/token/transferToken';

const rpcUrls = ['http://localhost:8545'];
const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const walletPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const walletPrivateKey2 = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

// 遅延関数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Etherを送信する関数
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
    // walletの取得
    const provider = new JsonRpcProvider(rpcUrls[0]);
    const wallet = new Wallet(walletPrivateKey, provider);

    // NFTのミント
    const params = {
      name: 'Frends Lost Token',
      image: null,
      description: null,
      wallet: wallet,
      contractAddress: contractAddress,
      client: null,
      ipfsApiUrl: null
    };
    const txReceipt = await putToken(params);
    await delay(500);

    // トークンが正常にミントされたかチェック
    expect(txReceipt).toBeDefined();
  }, 30000);

  it('should transfer token', async () => {
    const provider = new JsonRpcProvider(rpcUrls[0]);
    // wallet1の取得
    const wallet1 = new Wallet(walletPrivateKey, provider);
    // wallet2の取得
    const wallet2 = new Wallet(walletPrivateKey2, provider);

    // MFTのミント
    const params = { 
      name: 'Frends Lost Token',
      image: null,
      description: null,
      wallet: wallet1,
      contractAddress: contractAddress,
      client: null,
      ipfsApiUrl: null
    };
    const txReceipt = await putToken(params);
    await delay(500);

    // NFTの転送
    const tokenId = txReceipt.logs[txReceipt.logs.length - 1].args[2];
    await transferToken(wallet1, contractAddress, wallet2.address, tokenId);
    await delay(500);

    // トークンが正常に転送されたかチェック
    const tokens = await fetchTokens(rpcUrls[0], wallet2, contractAddress, "receive");
    const token = tokens[0][tokens[0].length - 1];
    expect(tokens[0].length).toBeGreaterThanOrEqual(1);
    expect(token.tokenId).toBe(Number(tokenId));
    expect(token.owner).toBe(wallet2.address);
    expect(token.name).toBe('Frends Lost Token');
    expect(token.from).toBe(wallet1.address);
    expect(token.to).toBe(wallet2.address);
  }, 30000);

  it("should transfer token with `getWallet.ts`", async () => {
    // walletの取得
    const localStorage = localStorageMock;
    const user1 = await getWallet(rpcUrls, localStorage);
    if (user1 === undefined) { return; }

    // Etherを送信しておく
    const provider = user1.wallet.provider;
    if (provider === null) { return; }
    const agentWallet = new Wallet(walletPrivateKey2, provider);
    await sendEther(agentWallet, user1.wallet.address, '0.1');
    await delay(500);

    // NFTのミント
    const params = {
      name: 'Frends Lost Token',
      image: null,
      description: null,
      wallet: user1.wallet,
      contractAddress: contractAddress,
      client: null,
      ipfsApiUrl: null
    };
    const txReceipt = await putToken(params);
    await delay(500);

    // NFTの転送
    const tokenId = txReceipt.logs[0].args[2];
    await transferToken(user1.wallet, contractAddress, agentWallet.address, tokenId);
    await delay(500);

    // トークンが正常に転送されたかチェック
    const tokens = await fetchTokens(rpcUrls[0], agentWallet, contractAddress, "receive");
    const token = tokens[0][tokens[0].length - 1];
    expect(tokens[0].length).toBeGreaterThanOrEqual(0);
    expect(token.tokenId).toBe(Number(tokenId));
    expect(token.owner).toBe(agentWallet.address);
    expect(token.name).toBe(params.name);
    expect(token.from).toBe(user1.wallet.address);
    expect(token.to).toBe(agentWallet.address);
  }, 30000);
  
});
