import { JsonRpcProvider } from "ethers";
import { create as createIPFS, IPFSHTTPClient } from 'ipfs-http-client';

// フェイルオーバー設定インターface
interface FailoverConfig {
    ipfsEndpoints: string[];
    blockchainProviders: string[];
    fallbackMode: 'sequential' | 'parallel' | 'prioritized';
    healthCheckInterval: number;
    connectionTimeout: number;
    maxFailureCount: number;
}

// サービス健康状態
interface ServiceHealth {
    endpoint: string;
    isHealthy: boolean;
    lastChecked: Date;
    failureCount: number;
    responseTime: number;
}

// フェイルオーバーマネージャー
class FailoverManager {
    private ipfsHealth: Map<string, ServiceHealth> = new Map();
    private blockchainHealth: Map<string, ServiceHealth> = new Map();
    private config: FailoverConfig;
    private healthCheckTimer: NodeJS.Timeout | null = null;

    constructor(config: FailoverConfig) {
        this.config = config;
        this.initializeHealthChecks();
        this.startHealthChecking();
    }

    private initializeHealthChecks(): void {
        // IPFS エンドポイントの初期化
        this.config.ipfsEndpoints.forEach(endpoint => {
            this.ipfsHealth.set(endpoint, {
                endpoint,
                isHealthy: true,
                lastChecked: new Date(),
                failureCount: 0,
                responseTime: 0
            });
        });

        // ブロックチェーンプロバイダーの初期化
        this.config.blockchainProviders.forEach(provider => {
            this.blockchainHealth.set(provider, {
                endpoint: provider,
                isHealthy: true,
                lastChecked: new Date(),
                failureCount: 0,
                responseTime: 0
            });
        });
    }

    private startHealthChecking(): void {
        this.healthCheckTimer = setInterval(async () => {
            await this.performHealthChecks();
        }, this.config.healthCheckInterval);
    }

    private async performHealthChecks(): Promise<void> {
        // IPFS 健康チェック
        const ipfsChecks = Array.from(this.ipfsHealth.keys()).map(endpoint =>
            this.checkIPFSHealth(endpoint)
        );

        // ブロックチェーン健康チェック
        const blockchainChecks = Array.from(this.blockchainHealth.keys()).map(provider =>
            this.checkBlockchainHealth(provider)
        );

        await Promise.allSettled([...ipfsChecks, ...blockchainChecks]);
    }

    private async checkIPFSHealth(endpoint: string): Promise<void> {
        const health = this.ipfsHealth.get(endpoint)!;
        const startTime = Date.now();

        try {
            const client = createIPFS({ url: endpoint, timeout: this.config.connectionTimeout });
            await client.id();
            
            health.isHealthy = true;
            health.failureCount = 0;
            health.responseTime = Date.now() - startTime;
        } catch (error) {
            health.isHealthy = false;
            health.failureCount++;
            health.responseTime = Date.now() - startTime;
            
            console.warn(`IPFS endpoint ${endpoint} health check failed:`, error);
        }

        health.lastChecked = new Date();
    }

    private async checkBlockchainHealth(providerUrl: string): Promise<void> {
        const health = this.blockchainHealth.get(providerUrl)!;
        const startTime = Date.now();

        try {
            const provider = new JsonRpcProvider(providerUrl);
            await provider.getNetwork();
            
            health.isHealthy = true;
            health.failureCount = 0;
            health.responseTime = Date.now() - startTime;
        } catch (error) {
            health.isHealthy = false;
            health.failureCount++;
            health.responseTime = Date.now() - startTime;
            
            console.warn(`Blockchain provider ${providerUrl} health check failed:`, error);
        }

        health.lastChecked = new Date();
    }

    // 健康なIPFSクライアントを取得
    async getHealthyIPFSClient(): Promise<IPFSHTTPClient | null> {
        const healthyEndpoints = this.getHealthyEndpoints(this.ipfsHealth);
        
        if (healthyEndpoints.length === 0) {
            console.error('No healthy IPFS endpoints available');
            return null;
        }

        const selectedEndpoint = this.selectEndpoint(healthyEndpoints);
        
        try {
            const client = createIPFS({ 
                url: selectedEndpoint, 
                timeout: this.config.connectionTimeout 
            });
            
            // 接続テスト
            await client.id();
            return client;
        } catch (error) {
            console.error(`Failed to create IPFS client for ${selectedEndpoint}:`, error);
            
            // そのエンドポイントを不健康としてマーク
            const health = this.ipfsHealth.get(selectedEndpoint);
            if (health) {
                health.isHealthy = false;
                health.failureCount++;
            }
            
            // 再帰的に他のエンドポイントを試す
            return this.getHealthyIPFSClient();
        }
    }

    // 健康なブロックチェーンプロバイダーを取得
    async getHealthyBlockchainProvider(): Promise<JsonRpcProvider | null> {
        const healthyProviders = this.getHealthyEndpoints(this.blockchainHealth);
        
        if (healthyProviders.length === 0) {
            console.error('No healthy blockchain providers available');
            return null;
        }

        const selectedProvider = this.selectEndpoint(healthyProviders);
        
        try {
            const provider = new JsonRpcProvider(selectedProvider);
            
            // 接続テスト
            await provider.getNetwork();
            return provider;
        } catch (error) {
            console.error(`Failed to create blockchain provider for ${selectedProvider}:`, error);
            
            // そのプロバイダーを不健康としてマーク
            const health = this.blockchainHealth.get(selectedProvider);
            if (health) {
                health.isHealthy = false;
                health.failureCount++;
            }
            
            // 再帰的に他のプロバイダーを試す
            return this.getHealthyBlockchainProvider();
        }
    }

    private getHealthyEndpoints(healthMap: Map<string, ServiceHealth>): string[] {
        return Array.from(healthMap.entries())
            .filter(([_, health]) => 
                health.isHealthy && 
                health.failureCount < this.config.maxFailureCount
            )
            .map(([endpoint, _]) => endpoint);
    }

    private selectEndpoint(endpoints: string[]): string {
        switch (this.config.fallbackMode) {
            case 'sequential':
                return endpoints[0];
            
            case 'parallel':
                // 並列接続の場合、最初に成功したものを使用
                return endpoints[0];
            
            case 'prioritized':
                // 応答時間でソート
                const healthData = endpoints
                    .map(endpoint => ({
                        endpoint,
                        health: this.ipfsHealth.get(endpoint) || this.blockchainHealth.get(endpoint)
                    }))
                    .filter(data => data.health)
                    .sort((a, b) => a.health!.responseTime - b.health!.responseTime);
                
                return healthData.length > 0 ? healthData[0].endpoint : endpoints[0];
            
            default:
                return endpoints[0];
        }
    }

    // 統計情報取得
    getHealthStats(): {
        ipfs: ServiceHealth[];
        blockchain: ServiceHealth[];
        summary: {
            totalIPFS: number;
            healthyIPFS: number;
            totalBlockchain: number;
            healthyBlockchain: number;
        };
    } {
        const ipfsStats = Array.from(this.ipfsHealth.values());
        const blockchainStats = Array.from(this.blockchainHealth.values());
        
        return {
            ipfs: ipfsStats,
            blockchain: blockchainStats,
            summary: {
                totalIPFS: ipfsStats.length,
                healthyIPFS: ipfsStats.filter(s => s.isHealthy).length,
                totalBlockchain: blockchainStats.length,
                healthyBlockchain: blockchainStats.filter(s => s.isHealthy).length,
            }
        };
    }

    // フェイルオーバーイベントの記録
    recordFailover(service: 'ipfs' | 'blockchain', fromEndpoint: string, toEndpoint: string): void {
        console.log(`Failover executed: ${service} from ${fromEndpoint} to ${toEndpoint}`);
        
        // メトリクス記録（実装依存）
        // this.metricsRecorder.recordFailover(service, fromEndpoint, toEndpoint);
    }

    // 清掃処理
    cleanup(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
    }
}

// 自動フェイルオーバー付きIPFSクライアント
class FailoverIPFSClient {
    private failoverManager: FailoverManager;
    private currentClient: IPFSHTTPClient | null = null;

    constructor(failoverManager: FailoverManager) {
        this.failoverManager = failoverManager;
    }

    async ensureConnection(): Promise<IPFSHTTPClient> {
        if (!this.currentClient) {
            this.currentClient = await this.failoverManager.getHealthyIPFSClient();
            if (!this.currentClient) {
                throw new Error('No IPFS endpoints available');
            }
        }
        return this.currentClient;
    }

    async add(data: any): Promise<any> {
        try {
            const client = await this.ensureConnection();
            return await client.add(data);
        } catch (error) {
            console.warn('IPFS add failed, attempting failover:', error);
            this.currentClient = null;
            
            const newClient = await this.failoverManager.getHealthyIPFSClient();
            if (!newClient) {
                throw new Error('All IPFS endpoints failed');
            }
            
            this.currentClient = newClient;
            return await newClient.add(data);
        }
    }

    async pin(cid: string): Promise<void> {
        try {
            const client = await this.ensureConnection();
            await client.pin.add(cid);
        } catch (error) {
            console.warn('IPFS pin failed, attempting failover:', error);
            this.currentClient = null;
            
            const newClient = await this.failoverManager.getHealthyIPFSClient();
            if (!newClient) {
                throw new Error('All IPFS endpoints failed');
            }
            
            this.currentClient = newClient;
            await newClient.pin.add(cid);
        }
    }

    async unpin(cid: string): Promise<void> {
        try {
            const client = await this.ensureConnection();
            await client.pin.rm(cid);
        } catch (error) {
            console.warn('IPFS unpin failed, attempting failover:', error);
            this.currentClient = null;
            
            const newClient = await this.failoverManager.getHealthyIPFSClient();
            if (newClient) {
                this.currentClient = newClient;
                await newClient.pin.rm(cid);
            }
            // unpin失敗は非致命的なのでエラーをスローしない
        }
    }

    async gc(): Promise<void> {
        try {
            const client = await this.ensureConnection();
            await client.repo.gc();
        } catch (error) {
            console.warn('IPFS GC failed, attempting failover:', error);
            this.currentClient = null;
            
            const newClient = await this.failoverManager.getHealthyIPFSClient();
            if (newClient) {
                this.currentClient = newClient;
                await newClient.repo.gc();
            }
            // GC失敗は非致命的なのでエラーをスローしない
        }
    }
}

// 自動フェイルオーバー付きブロックチェーンプロバイダー
class FailoverBlockchainProvider {
    private failoverManager: FailoverManager;
    private currentProvider: JsonRpcProvider | null = null;

    constructor(failoverManager: FailoverManager) {
        this.failoverManager = failoverManager;
    }

    async ensureConnection(): Promise<JsonRpcProvider> {
        if (!this.currentProvider) {
            this.currentProvider = await this.failoverManager.getHealthyBlockchainProvider();
            if (!this.currentProvider) {
                throw new Error('No blockchain providers available');
            }
        }
        return this.currentProvider;
    }

    async getBalance(address: string): Promise<bigint> {
        try {
            const provider = await this.ensureConnection();
            return await provider.getBalance(address);
        } catch (error) {
            console.warn('Blockchain getBalance failed, attempting failover:', error);
            this.currentProvider = null;
            
            const newProvider = await this.failoverManager.getHealthyBlockchainProvider();
            if (!newProvider) {
                throw new Error('All blockchain providers failed');
            }
            
            this.currentProvider = newProvider;
            return await newProvider.getBalance(address);
        }
    }

    async sendTransaction(transaction: any): Promise<any> {
        try {
            const provider = await this.ensureConnection();
            return await provider.broadcastTransaction(transaction);
        } catch (error) {
            console.warn('Blockchain sendTransaction failed, attempting failover:', error);
            this.currentProvider = null;
            
            const newProvider = await this.failoverManager.getHealthyBlockchainProvider();
            if (!newProvider) {
                throw new Error('All blockchain providers failed');
            }
            
            this.currentProvider = newProvider;
            return await newProvider.broadcastTransaction(transaction);
        }
    }

    async waitForTransaction(txHash: string): Promise<any> {
        try {
            const provider = await this.ensureConnection();
            return await provider.waitForTransaction(txHash);
        } catch (error) {
            console.warn('Blockchain waitForTransaction failed, attempting failover:', error);
            this.currentProvider = null;
            
            const newProvider = await this.failoverManager.getHealthyBlockchainProvider();
            if (!newProvider) {
                throw new Error('All blockchain providers failed');
            }
            
            this.currentProvider = newProvider;
            return await newProvider.waitForTransaction(txHash);
        }
    }
}

// デフォルト設定
const DEFAULT_FAILOVER_CONFIG: FailoverConfig = {
    ipfsEndpoints: [
        'http://localhost:5001',
        'https://ipfs.infura.io:5001',
        'https://ipfs.io'
    ],
    blockchainProviders: [
        'http://localhost:8545',
        'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
        'https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY'
    ],
    fallbackMode: 'prioritized',
    healthCheckInterval: 30000, // 30秒
    connectionTimeout: 5000,    // 5秒
    maxFailureCount: 3
};

export {
    FailoverManager,
    FailoverIPFSClient,
    FailoverBlockchainProvider,
    DEFAULT_FAILOVER_CONFIG,
    type FailoverConfig,
    type ServiceHealth
};