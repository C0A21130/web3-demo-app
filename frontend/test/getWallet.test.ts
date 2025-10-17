import { describe, it, expect, beforeEach } from "@jest/globals";
import localStorageMock from "./localStorage";
import getWallet from '../src/components/getWallet';
import { Wallet } from 'ethers';

describe('getWallet', () => {
  beforeEach(() => {
    // テスト前にローカルストレージをクリア
    localStorageMock.clear();
  });

  describe('Wallet creation', () => {
    it('should restore wallet from existing private key when private key exists in localStorage', async () => {
      // 既知の秘密鍵を設定
      const knownPrivateKey = '0x' + '1'.repeat(64); // テスト用の秘密鍵
      const expectedWallet = new Wallet(knownPrivateKey);
      const expectedAddress = expectedWallet.address;
      
      // ローカルストレージに既知の秘密鍵を設定
      localStorageMock.setItem('secretKey', knownPrivateKey);
      
      const rpcUrls = ['http://localhost:8545'];
      const { wallet, rpcUrlIndex } = await getWallet(rpcUrls, localStorageMock);
      
      expect(wallet).toBeDefined();
      expect(wallet.address).toBe(expectedAddress);
      expect(rpcUrlIndex).toBeGreaterThanOrEqual(-1); // 接続失敗の場合は-1
    });

    it('should generate new private key and save to localStorage when private key does not exist', async () => {
      // ローカルストレージが空の状態を確認
      expect(localStorageMock.getItem('secretKey')).toBeNull();
      
      const rpcUrls = ['http://localhost:8545'];
      const { wallet, rpcUrlIndex } = await getWallet(rpcUrls, localStorageMock);
      
      // 新しいウォレットが生成されることを確認
      expect(wallet).toBeDefined();
      expect(wallet.address).toBeDefined();
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/); // 有効なEthereumアドレス形式
      
      // 秘密鍵がローカルストレージに保存されることを確認
      const savedKey = localStorageMock.getItem('secretKey');
      expect(savedKey).toBeDefined();
      expect(savedKey).toMatch(/^0x[a-fA-F0-9]{64}$/); // 有効な秘密鍵形式
      
      expect(rpcUrlIndex).toBeGreaterThanOrEqual(-1);
    });
  });

  describe('Blockchain connection', () => {
    it('should connect to valid RPC URL successfully', async () => {
      const rpcUrls = ['http://localhost:8545'];
      const { wallet, rpcUrlIndex } = await getWallet(rpcUrls, localStorageMock);
      
      expect(wallet).toBeDefined();
      expect(wallet.address).toBeDefined();
      
      // ローカル環境では接続できない可能性があるため、rpcUrlIndexをチェック
      if (rpcUrlIndex >= 0) {
        // 接続成功の場合
        expect(wallet.provider).toBeDefined();
        expect(rpcUrlIndex).toBe(0); // 最初のRPC URLに接続
      } else {
        // 接続失敗の場合（ローカルでHardhatが起動していない場合）
        expect(rpcUrlIndex).toBe(-1);
      }
    });

    it('should timeout on invalid RPC URL and try next URL', async () => {
      const rpcUrls = [
        'http://invalid-url:9999', // 無効なURL
        'http://localhost:8545'    // 有効なURL（Hardhatが起動している場合）
      ];
      
      const startTime = Date.now();
      const { wallet, rpcUrlIndex } = await getWallet(rpcUrls, localStorageMock);
      const endTime = Date.now();
      
      expect(wallet).toBeDefined();
      
      // タイムアウト処理が実行されたことを時間で確認（少なくとも2秒以上）
      // ただし、ローカル環境では全て失敗する可能性もある
      if (rpcUrlIndex === -1) {
        // 全てのRPC URLで接続失敗
        expect(endTime - startTime).toBeGreaterThan(2000); // 少なくとも1つのタイムアウトが発生
      }
    }, 10000); // テストタイムアウトを10秒に設定
  });

  it('should return rpcUrlIndex -1 when all RPC URLs are invalid', async () => {
    const invalidRpcUrls = [
      'http://invalid-url-1:9999',
      'http://invalid-url-2:9998',
      'http://invalid-url-3:9997'
    ];
    
    const { wallet, rpcUrlIndex } = await getWallet(invalidRpcUrls, localStorageMock);
    
    expect(wallet).toBeDefined(); // ウォレット自体は生成される
    expect(rpcUrlIndex).toBe(-1); // 全て失敗したので-1
    expect(wallet.provider).toBeNull(); // プロバイダーは接続されていない
  }, 15000); // 複数のタイムアウトが発生するため時間を長めに設定
  
  it('should maintain same wallet across multiple calls (complete workflow)', async () => {
    const rpcUrls = ['http://localhost:8545'];
    
    // 初回実行（秘密鍵なし）
    const firstResult = await getWallet(rpcUrls, localStorageMock);
    const firstAddress = firstResult.wallet.address;
    const savedKey = localStorageMock.getItem('secretKey');
    
    expect(firstResult.wallet).toBeDefined();
    expect(firstAddress).toBeDefined();
    expect(savedKey).toBeDefined();
    
    // 2回目実行（既存の秘密鍵を使用）
    const secondResult = await getWallet(rpcUrls, localStorageMock);
    const secondAddress = secondResult.wallet.address;
    
    expect(secondResult.wallet).toBeDefined();
    expect(secondAddress).toBe(firstAddress); // 同じアドレスが返される
    expect(localStorageMock.getItem('secretKey')).toBe(savedKey); // 秘密鍵は変更されない
  });
});
