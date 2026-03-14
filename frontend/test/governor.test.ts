import { describe, it, expect } from "@jest/globals";
import { Wallet, JsonRpcProvider, Contract } from 'ethers';
import { create } from "kubo-rpc-client";
import execute from "../src/components/govrenor/execute";
import fetchProposals from "../src/components/govrenor/fetchProposals";
import mint from "../src/components/govrenor/mint";
import propose from "../src/components/govrenor/propose";
import vote from "../src/components/govrenor/vote";
import MyGovernor from "../abi/CustomGovernor.json";

// パラメータを設定
const rpcUrl = 'http://localhost:8545';           // ローカルのEthereumノードのURL
const ipfsApiUrl: string | undefined = undefined; // ポートは含まないIPFSエンドポイントのURL(例: "http://localhost)
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";  // テスト用のプライベートキー
const privateKey2 = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // テスト用のプライベートキー2
const contractAddress = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';                // NFT(ERC-721)コントラクトのアドレス
const GovernanceTokenContractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // ガバナンストークン(ERC-20)コントラクトのアドレス
const governorContractAddress = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';        // ガバナンスコントラクトのアドレス

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Governor', () => {
  (ipfsApiUrl ? it : it.skip)("提案を作成して投票してNFTが転送されること", async () => {
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet1 = new Wallet(privateKey, provider);
    const wallet2 = new Wallet(privateKey2, provider);
    const client = create(`${ipfsApiUrl || "http://localhost:5001"}`);
    const contract = new Contract(governorContractAddress, MyGovernor.abi, wallet1);

    // トークンをミントして投票権を持たせる
    await mint(wallet2, GovernanceTokenContractAddress);
    await delay(500);

    // 提案を作成する
    const propos = {
      rpcUrl: rpcUrl,
      wallet: wallet1,
      contractAddress: contractAddress,
      governorContractAddress: governorContractAddress,
      ipfsApiUrl: ipfsApiUrl || "",
      client: client,
      text: `Test proposal + ${new Date().toISOString()}`
    }
    const proposeUri = await propose(propos);
    expect(proposeUri).toContain("ipfs");
    await delay(500);

    // 提案が存在するか確認する
    const proposesalContents = await fetchProposals(wallet1, governorContractAddress);
    expect(proposesalContents.length).toBeGreaterThan(0);
    const index = proposesalContents.length - 1;

    // 投票可能な状態になるまで待機する
    while (true) {
      const state = await contract.state(proposesalContents[index].proposalId);
      if (state == 1n) { break; } // 1は投票可能状態を表す
      expect(state).toBe(0n);
      await provider.send("evm_mine", []);
      await delay(500); // 0.5秒待機してから再度確認する
    }

    // 投票を行う
    await vote(wallet2, governorContractAddress, proposesalContents[index].proposalId, 1);

    // 投票結果確定まで待機する
    while (true) {
      const state = await contract.state(proposesalContents[index].proposalId);
      if (state == 4n) { break; } // 4は実行可能状態を表す
      expect(state).toBe(1n);
      await provider.send("evm_mine", []);
      await delay(500); // 0.5秒待機してから再度確認する
    }

    // 投票してNFTが転送されることを確認
    const executeResult = await execute(wallet2, governorContractAddress, proposesalContents[index]);
    expect(executeResult).toBe(true);
  }, 20000);
});
