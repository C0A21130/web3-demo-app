import { describe, it, expect } from "@jest/globals";
import { Wallet, JsonRpcProvider } from 'ethers';
import putToken from '../src/components/putToken';
import transferToken from '../src/components/transferToken';
import fetchScores from '../src/components/scoring/fetchScores';
import verifyScore from '../src/components/scoring/verifyScore';

const rpcUrl = 'http://localhost:8545';
const myKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const targetKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const target2key = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

/**
 * 指定されたミリ秒数だけ処理を遅延させる
 * @param ms 遅延時間（ミリ秒）
 * @returns Promise<void> 指定時間後に解決されるPromise
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('scoring', () => {
  it('トークンの交換によって信用スコアが算出されることを確認する', async () => {
    // ウォレットの初期化
    const provider = new JsonRpcProvider(rpcUrl);
    const myWallet = new Wallet(myKey, provider);
    const targetWallet = new Wallet(targetKey, provider);
    if (provider == null) { return; }
    if (myWallet == undefined || targetWallet == undefined) { return; }

    // トークンをミントして転送する
    const params = {
      name: 'Frends Lost Token', 
      image: null, 
      description: "'Scoring Test Token", 
      wallet: myWallet,
      contractAddress: contractAddress, 
      client: null, 
      ipfsApiUrl: null
    };
    const txReceipt = await putToken(params);
    await delay(500);
    const tokenId = txReceipt.logs[txReceipt.length - 1].args[2];
    await transferToken(myWallet, contractAddress, targetWallet.address, tokenId);
    await delay(500);

    // 初期スコアを確認する
    const scores = await fetchScores([targetWallet.address], myWallet, contractAddress);
    expect(scores.targetScores[0]).toBeGreaterThanOrEqual(-128);
    expect(scores.targetScores[0]).toBeLessThanOrEqual(127);
    expect(scores.myScore).toBeGreaterThanOrEqual(-128);
    expect(scores.myScore).toBeLessThanOrEqual(127);
    expect(scores.targetScores[0]).toBeGreaterThanOrEqual(0);
    expect(scores.myScore).toBeGreaterThanOrEqual(0);
  })

  it('複数アドレスの信用スコアをまとめて取得できることを確認する', async () => {
    // ウォレットを初期化する
    const provider = new JsonRpcProvider(rpcUrl);
    const myWallet = new Wallet(myKey, provider);
    const targetWallet = new Wallet(targetKey, provider);
    const target2Wallet = new Wallet(target2key, provider);
    if (provider == null) { return; }
    if (myWallet == undefined || targetWallet == undefined || target2Wallet == undefined) { return; }

    // トークンをミントして転送する
    const params = {
      name: 'Frends Lost Token', 
      image: null, 
      description: "'Scoring Test Token", 
      wallet: myWallet,
      contractAddress: contractAddress, 
      client: null, 
      ipfsApiUrl: null
    };
    const txReceipt = await putToken(params);
    await delay(500);
    const tokenId = txReceipt.logs[txReceipt.length - 1].args[2];
    await transferToken(myWallet, contractAddress, targetWallet.address, tokenId);
    await delay(500);
    
    // 初期スコアを確認する
    const addressList = [targetWallet.address, target2Wallet.address];
    const scores = await fetchScores(addressList, myWallet, contractAddress);
    expect(scores.targetScores.length).toBe(2);
    expect(scores.targetScores[0]).toBeGreaterThanOrEqual(-128);
    expect(scores.targetScores[0]).toBeLessThanOrEqual(127);
    expect(scores.targetScores[1]).toBe(0); // NFT転送がないため0となる
    expect(scores.myScore).toBeGreaterThanOrEqual(-128);
    expect(scores.myScore).toBeLessThanOrEqual(127);
  });

  it('相手のアドレスを指定しない場合、自分のスコアのみ取得できることを確認する', async () => {
    // ウォレットを初期化する
    const provider = new JsonRpcProvider(rpcUrl);
    const myWallet = new Wallet(myKey, provider);
    const targetWallet = new Wallet(targetKey, provider);
    if (provider == null) { return; }
    if (myWallet == undefined) { return; }
    
    // トークンをミントして転送する
    const params = {
      name: 'Frends Lost Token', 
      image: null, 
      description: "'Scoring Test Token", 
      wallet: myWallet,
      contractAddress: contractAddress, 
      client: null, 
      ipfsApiUrl: null
    };
    const txReceipt = await putToken(params);
    await delay(500);
    const tokenId = txReceipt.logs[txReceipt.length - 1].args[2];
    await transferToken(myWallet, contractAddress, targetWallet.address, tokenId);
    await delay(500);

    // 初期スコアを確認する
    const scores = await fetchScores([], myWallet, contractAddress);
    expect(scores.targetScores.length).toBe(0);
    expect(scores.myScore).toBeGreaterThanOrEqual(-128);
    expect(scores.myScore).toBeLessThanOrEqual(127);
  });

  it('自身と取引相手のスコアを検証して取引可能か確認する', async () => {
    // ウォレットを初期化する
    const provider = new JsonRpcProvider(rpcUrl);
    const myWallet = new Wallet(myKey, provider);
    const targetWallet = new Wallet(targetKey, provider);
    if (provider == null) { return; }
    if (myWallet == undefined || targetWallet == undefined) { return; }

    // トークンをミントして転送する
    const params = {
      name: 'Frends Lost Token', 
      image: null, 
      description: "'Scoring Test Token", 
      wallet: myWallet,
      contractAddress: contractAddress, 
      client: null, 
      ipfsApiUrl: null
    };
    const txReceipt = await putToken(params);
    await delay(500);
    const tokenId = txReceipt.logs[txReceipt.length - 1].args[2];
    await transferToken(myWallet, contractAddress, targetWallet.address, tokenId);
    await delay(500);

    // スコアを検証する
    const isVerified = await verifyScore(myWallet, targetWallet.address, contractAddress);
    expect(isVerified).toBe(true);
  });
});