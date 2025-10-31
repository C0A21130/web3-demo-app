import { describe, it, expect } from "@jest/globals";
import { Wallet, HDNodeWallet, JsonRpcProvider, parseEther } from 'ethers';
import putToken from '../src/components/putToken';
import transferToken from '../src/components/transferToken';
import fetchScores from '../src/components/scoring/fetchScores';
import verifyScore from '../src/components/scoring/verifyScore';

const rpcUrl = 'http://localhost:8545';
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const privateKey2 = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const privateKey3 = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
const privateKey4 = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6";
const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

// 指定されたミリ秒数だけ処理を遅延させる
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('scoring', () => {
  it('複数アドレスの信用スコアをまとめて取得できることを確認する', async () => {
    // ウォレットを初期化する
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const wallet2 = new Wallet(privateKey2, provider);
    const wallet3 = new Wallet(privateKey3, provider);
    const wallet4 = new Wallet(privateKey4, provider);
    if (provider == null) { return; }
    if (wallet == undefined || wallet2 == undefined || wallet3 == undefined || wallet4 == undefined) { return; }

    // トークンをミントして転送する
    const params = {
      name: "Scoring Test Token", 
      image: null, 
      description: "Scoring Test Token", 
      wallet: wallet,
      contractAddress: contractAddress, 
      client: null, 
      ipfsApiUrl: null
    };
    let txReceipt = await putToken(params);
    await delay(500);
    let tokenId = txReceipt.logs[txReceipt.length - 1].args[2];
    await transferToken(wallet, contractAddress, wallet2.address, tokenId);
    await delay(500);

    // トークンをミントして転送する(wallet -> wallet3)
    txReceipt = await putToken(params);
    await delay(500);
    tokenId = txReceipt.logs[txReceipt.length - 1].args[2];
    await transferToken(wallet, contractAddress, wallet3.address, tokenId);
    await delay(500);

    // トークンをミントして転送する(wallet -> wallet4)
    txReceipt = await putToken(params);
    await delay(500);
    tokenId = txReceipt.logs[txReceipt.length - 1].args[2];
    await transferToken(wallet, contractAddress, wallet4.address, tokenId);
    await delay(500);
    
    // 初期スコアを確認する
    const addressList = [wallet2.address, wallet3.address];
    const scores = await fetchScores(addressList, wallet, contractAddress);
    expect(scores.targetScores.length).toBe(2);
    expect(scores.targetScores[0]).toBeGreaterThanOrEqual(-128);
    expect(scores.targetScores[0]).toBeLessThanOrEqual(127);
    expect(scores.targetScores[1]).toBeGreaterThanOrEqual(-128);
    expect(scores.targetScores[1]).toBeLessThanOrEqual(127);
    expect(scores.myScore).toBeGreaterThanOrEqual(-128);
    expect(scores.myScore).toBeLessThanOrEqual(127);
  });

  it('相手のアドレスを指定しない場合、自分のスコアのみ取得できることを確認する', async () => {
    // ウォレットを初期化する
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey3, provider);
    if (provider == null) { return; }
    if (wallet == undefined) { return; }

    // 初期スコアを確認する
    const scores = await fetchScores([], wallet, contractAddress);
    expect(scores.targetScores.length).toBe(0);
    expect(scores.myScore).toBeGreaterThanOrEqual(-128);
    expect(scores.myScore).toBeLessThanOrEqual(127);
  });

  it('自身と取引相手のスコアを比較して取引可能か判断できることを確認する', async () => {
    // ウォレットを初期化する
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const wallet2 = new Wallet(privateKey2, provider);
    const wallet3 = new Wallet(privateKey3, provider);
    const wallet4 = new Wallet(privateKey4, provider);
    if (provider == null) { return; }
    if (wallet == undefined || wallet2 == undefined || wallet3 == undefined || wallet4 == undefined) { return; }

    // スコアを検証する
    const verifyScoreResult = await verifyScore(wallet, wallet2.address, contractAddress);
    expect(verifyScoreResult.isVerified).toBe(true); // スコアが高い人から低い人への取引可能
    const verifyScoreResult2 = await verifyScore(wallet2, wallet3.address, contractAddress);
    expect(verifyScoreResult2.isVerified).toBe(true); // スコアが同じ人は取引可能
    const verifyScoreResult3 = await verifyScore(wallet4, wallet.address, contractAddress);
    expect(verifyScoreResult3.isVerified).toBe(false); // スコアが低い人から高い人への取引不可
  });

  it("取引相手のスコアが低い場合に取引がブロックされることを確認する", async () => {
    // ウォレットを初期化する
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const wallet2 = new Wallet(privateKey2, provider);
    if (provider == null) { return; }
    if (wallet == undefined || wallet2 == undefined) { return; }

    // スコアを検証して取引がブロックされることを確認する
    const verifyScoreResult = await verifyScore(wallet2, wallet.address, contractAddress);
    expect(verifyScoreResult.isAuthorized).toBe(false);
    const params = {
      name: "Scoring Test Token",
      image: null,
      description: "Scoring Test Token",
      wallet: wallet,
      contractAddress: contractAddress,
      client: null,
      ipfsApiUrl: null
    };
    const txReceipt = await putToken(params);
    await delay(500);
    const tokenId = txReceipt.logs[txReceipt.length - 1].args[2];
    const result = await transferToken(wallet2, contractAddress, wallet.address, tokenId);
    await delay(500);
    expect(result).toBe(false); // 取引がブロックされることを確認
  });

  it("事前に設定したウォレットの信頼度を信用スコアで判別できることを確認する", async () => {
    // パラメータを設定
    const walletNum = 30;
    const transferNum = 10;

    // ウォレットを初期化する
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);

    // ウォレットの配列を作成する
    const wallets: { wallet: HDNodeWallet, trust: boolean }[] = [];
    for (let i = 0; i < walletNum; i++) {
      // ウォレットを作成してETHを受け取る
      const myWallet = Wallet.createRandom(null).connect(provider);
      const tx = await wallet.sendTransaction({
        to: myWallet.address,
        value: parseEther("1.0")
      });
      await tx.wait();
      await delay(500);

      // ウォレットの信頼度を事前に設定する
      wallets.push(
        { wallet: myWallet, trust: (i >= (walletNum * 0.5)) ? true : false }
      );
    }

    // walletsをランダムにシャッフルする
    wallets.sort(() => Math.random() - 0.5);
    if (provider == null) { return; }
    if (wallet == undefined) { return; }

    // トークンの転送を繰り返す
    for (let i = 0; i < transferNum; i++) {
      // walletsからランダムに1つ選んで転送元と転送先を決定する
      const randIndex1 = Math.floor(Math.random() * wallets.length);
      const randIndex2 = Math.floor(Math.random() * wallets.length);
      const myWallet = wallets[randIndex1];
      const targetWallet = wallets[randIndex2];
      if (myWallet.wallet.address === targetWallet.wallet.address || !myWallet.trust) {
        i--;
        continue;
      }

      // トークンを発行して転送する
      const params = {
        name: "Scoring Test Token",
        image: null,
        description: "Scoring Test Token",
        wallet: myWallet.wallet,
        contractAddress: contractAddress,
        client: null,
        ipfsApiUrl: null
      };
      const txReceipt = await putToken(params);
      await delay(500);
      const tokenId = txReceipt.logs[txReceipt.length - 1].args[2];
      await transferToken(myWallet.wallet, contractAddress, targetWallet.wallet.address, tokenId);
      await delay(500);
    }

    // 信用スコアを確認する
    const addressList = wallets.map(w => w.wallet.address);
    const scores = await fetchScores(addressList, wallet, contractAddress);

    // スコアの高い順にソートする
    const scoreWithAddress = scores.targetScores.map((score, index) => {
      return { address: addressList[index], score: score, trust: wallets[index].trust };
    });
    scoreWithAddress.sort((a, b) => b.score - a.score);

    // 上位50%はtrust=true、下位50%はtrust=falseの数をカウントする
    const cutoffIndex = Math.floor(scoreWithAddress.length * 0.5);
    let trustHighTrueCount = 0;
    let trustLowFalseCount = 0;
    for (let i = 0; i < scoreWithAddress.length; i++) {
      if (i < cutoffIndex) {
        if (scoreWithAddress[i].trust) {
          trustHighTrueCount++;
        }
      } else {
        if (!scoreWithAddress[i].trust) {
          trustLowFalseCount++;
        }
      }
    }

    expect(trustHighTrueCount).toBeGreaterThanOrEqual(Math.floor((walletNum * 0.5) - trustHighTrueCount));
    expect(trustLowFalseCount).toBeGreaterThanOrEqual(Math.floor((walletNum * 0.5) - trustLowFalseCount));
  }, 40000);
});