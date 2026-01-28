import { describe, it, expect } from "@jest/globals";
import { Wallet, HDNodeWallet, JsonRpcProvider, JsonRpcSigner, parseEther } from 'ethers';

import putToken from '../src/components/token/putToken';
import transferToken from '../src/components/token/transferToken';
import configPolicy from '../src/components/scoring/configPolicy';
import fetchScores from '../src/components/scoring/fetchScores';
import fetchTransferLogs from '../src/components/scoring/fetchTransferLogs';

// パラメータを設定
const rpcUrl = 'http://localhost:8545';
const trustScoringApiUrl: string | undefined = undefined;
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const privateKey2 = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const walletNum = 10;
const transferNum = 50;

type Account = {
  wallet: HDNodeWallet;
  trust: boolean;
  policy: number;
};

// 指定されたミリ秒数だけ処理を遅延させる
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ユーザーのアカウント(ウォレットとポリシーと信頼度)を初期化する
const initAccounts = async (walletNum: number) => {
  // ETHを送金するためのメインウォレットを初期化する
  const provider = new JsonRpcProvider(rpcUrl);
  const mainWallet = new Wallet(privateKey, provider);

  // アカウント一覧を保存する配列を作成する
  const accounts: { wallet: HDNodeWallet, trust: boolean, policy: number }[] = [];
  for (let i = 0; i < walletNum; i++) {
    // ウォレットを作成してETHを受け取る
    const wallet = Wallet.createRandom(null).connect(provider);
    const tx = await mainWallet.sendTransaction({
      to: wallet.address,
      value: parseEther("0.5")
    });
    await tx.wait();
    await delay(500);

    // アカウントのポリシーを設定する(20%がポリシー3、30%がポリシー2、30%がポリシー1、20%がポリシー0)
    let policy = 0;
    const ratio = (i + 1) / walletNum;
    if (ratio <= 0.2) {
      policy = 3;
    } else if (ratio <= 0.5) {
      policy = 2;
    } else if (ratio <= 0.8) {
      policy = 1;
    }

    await configPolicy(wallet, policy, contractAddress);
    await delay(500);

    accounts.push({
      wallet,
      trust: policy <= 1,
      policy
    });
  }

  // accountsnの配列をランダムにシャッフルする
  for (let i = accounts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [accounts[i], accounts[j]] = [accounts[j], accounts[i]];
  }
  return accounts;
}

// ランダムにアカウントを選択する
const selectRandomAccount = (accounts: Account[]) => {
  const randIndex1 = Math.floor(Math.random() * accounts.length);
  const randIndex2 = Math.floor(Math.random() * accounts.length);
  const fromAccount = accounts[randIndex1];
  const toAccount = accounts[randIndex2];
  if (fromAccount.wallet.address === toAccount.wallet.address) {
    return selectRandomAccount(accounts);
  }
  return { fromAccount, toAccount };
}

// 信用スコアリングシステムでスコアを登録する
const registerScore = async (fromAccount: Account, toAccount: Account) => {
  try {
    const body = {
      contract_address: contractAddress,
      from_address: fromAccount.wallet.address,
      to_address_list: [toAccount.wallet.address],
    };
    const response = await fetch(`${trustScoringApiUrl}/auth`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error("HTTPエラー:", response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    await delay(500);
  } catch (error) {
    console.error(error);
  }
}

describe('scoring', () => {
  describe('fetch score and config policy', () => {
    it('複数アドレスの信用スコアをまとめて取得できることを確認する', async () => {
      // ウォレットを初期化する
      const provider = new JsonRpcProvider(rpcUrl);
      const wallet = new Wallet(privateKey, provider);
      const wallet2 = new Wallet(privateKey2, provider);
      if (provider == null) { return; }
      if (wallet == undefined || wallet2 == undefined) { return; }

      // 初期スコアを確認する
      const addressList = [wallet2.address];
      const scores = await fetchScores(addressList, wallet, contractAddress);
      expect(scores.targetScores.length).toBe(1);
      expect(scores.targetScores[0]).toBeGreaterThanOrEqual(-128);
      expect(scores.targetScores[0]).toBeLessThanOrEqual(127);
      expect(scores.myScore).toBeGreaterThanOrEqual(-128);
      expect(scores.myScore).toBeLessThanOrEqual(127);
    });

    it('相手のアドレスを指定しない場合は自分のスコアのみ取得できることを確認する', async () => {
      // ウォレットを初期化する
      const provider = new JsonRpcProvider(rpcUrl);
      const wallet = new Wallet(privateKey, provider);
      if (provider == null) { return; }
      if (wallet == undefined) { return; }

      // 初期スコアを確認する
      const scores = await fetchScores([], wallet, contractAddress);
      expect(scores.targetScores.length).toBe(0);
      expect(scores.myScore).toBeGreaterThanOrEqual(-128);
      expect(scores.myScore).toBeLessThanOrEqual(127);
    });
  });

  describe("fetch TransferLogs", () => {
    it("NFT転送ログが存在しない場合は空の配列が返されることを確認する", async () => {
      // ウォレットを初期化する
      const provider = new JsonRpcProvider(rpcUrl);
      const wallet = new Wallet(privateKey, provider);
      const signer = new JsonRpcSigner(provider, wallet.address);
      if (provider == null || signer == undefined) { return; }

      // 転送ログを取得する
      const logs = await fetchTransferLogs(contractAddress, signer);
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBe(0);
    });

    it("転送ログを取得できることを確認する", async () => {
      // ウォレットを初期化する
      const provider = new JsonRpcProvider(rpcUrl);
      const wallet = new Wallet(privateKey, provider);
      const signer = new JsonRpcSigner(provider, wallet.address);
      if (provider == null || signer == undefined) { return; }

      // NFTを発行して転送する
      const params = {
        name: "Scoring Test Token",
        image: null,
        description: "Scoring Test Token",
        wallet: wallet,
        contractAddress: contractAddress,
        client: null,
        ipfsApiUrl: null
      };
      for (let i = 0; i < 5; i++) {
        const txReceipt = await putToken(params);
        await delay(500);
        const tokenId = txReceipt.logs[txReceipt.length - 1].args[2];
        const toAddress = Wallet.createRandom(null).connect(provider).address;
        await transferToken(wallet, contractAddress, toAddress, tokenId);
        await delay(500);
      };

      // 転送ログを取得する
      const logs = await fetchTransferLogs(contractAddress, signer);
      expect(Array.isArray(logs)).toBe(true);
      logs.forEach(log => {
        expect(log).toHaveProperty("from_address");
        expect(log).toHaveProperty("to_address");
        expect(log).toHaveProperty("token_id");
        expect(log).toHaveProperty("contract_address");
        expect(log).toHaveProperty("block_number");
        expect(log).toHaveProperty("gas_price");
        expect(log).toHaveProperty("gas_used");
        expect(log).toHaveProperty("transaction_hash");
        expect(log).toHaveProperty("token_uri");
        expect(log.from_address).not.toBe("0x0000000000000000000000000000000000000000");
      });
    }, 10000);

    it("不正なコントラクトアドレスの場合は空の配列が返されることを確認する", async () => {
      // ウォレットを初期化する
      const provider = new JsonRpcProvider(rpcUrl);
      const wallet = new Wallet(privateKey, provider);
      const signer = new JsonRpcSigner(provider, wallet.address);
      if (provider == null || signer == undefined) { return; }

      // 転送ログを取得する
      const logs = await fetchTransferLogs("0x0000000000000000000000000000000000000000", signer);
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBe(0);
    });
  });

  (trustScoringApiUrl ? describe : describe.skip)('configPolicy', () => {
    it("ポリシーによる信用スコアで判別できることを確認する", async () => {
      if (trustScoringApiUrl == undefined) {
        console.error("ポリシーによる信用スコアのテストを実行するにはtrustScoringApiUrlを設定してください");
        it.skip;
      }

      // 取引数のカウント用変数を初期化する
      let trustedSuccessCount = 0; // 信頼できる取引主の成功数
      let untrustedSuccessCount = 0; // 信頼できない取引主の成功数
      let trustedFailCount = 0; // 信頼できる取引主の失敗数
      let untrustedFailCount = 0; // 信頼できない取引主の失敗数
      const results = [];

      // ウォレットを初期化する
      const accounts = await initAccounts(walletNum);

      // トークンの転送を繰り返す
      for (let i = 0; i < transferNum; i++) {
        // accountsからランダムに1つ選んで転送元と転送先を決定する
        const { fromAccount, toAccount } = selectRandomAccount(accounts);

        // トークンを発行して転送する
        const params = {
          name: "Scoring Test Token",
          image: null,
          description: "Scoring Test Token",
          wallet: fromAccount.wallet,
          contractAddress: contractAddress,
          client: null,
          ipfsApiUrl: null
        };
        const txReceipt = await putToken(params);
        await delay(500);
        const tokenId = txReceipt.logs[txReceipt.length - 1].args[2];

        // 信用スコアリングシステムでスコアを登録する
        await registerScore(fromAccount, toAccount);

        // トークンを転送して結果に応じてカウントを増やす
        const result = await transferToken(fromAccount.wallet, contractAddress, toAccount.wallet.address, tokenId);
        await delay(500);
        if (result) {
          if (toAccount.trust) {
            trustedSuccessCount++;
          } else {
            untrustedSuccessCount++;
          }
        } else {
          if (toAccount.trust) {
            trustedFailCount++;
          } else {
            untrustedFailCount++;
          }
        }

        // 誤認可割合と誤拒否割合を確認する
        if ((i + 1) % 10 === 0) {
          const far = untrustedSuccessCount / (untrustedSuccessCount + trustedSuccessCount);
          const frr = trustedFailCount / (trustedFailCount + untrustedFailCount);
          results.push([far, frr]);
        }
      }

      // 結果を確認する
      console.log("最終結果:");
      console.log("|取引数|誤認可割合(FAR)|誤拒否割合(FRR)|");
      console.log("|---|---|---|")
      results.forEach((result, index) => {
        console.log(`|${(index + 1) * 10}|${result[0]}|${result[1]}|`);
      });

      // 最終的な誤認可割合と誤拒否割合が許容範囲内であることを確認する
      expect(results[results.length - 1][0]).toBeLessThanOrEqual(0.5); // 誤認可割合(FAR)が50%以下
      expect(results[results.length - 1][1]).toBeLessThanOrEqual(0.5); // 誤拒否割合(FRR)が50%以下
    }, 360000);
  });
});
