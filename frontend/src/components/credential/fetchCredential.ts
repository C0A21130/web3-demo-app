import { ethers, Wallet, HDNodeWallet } from "ethers";
import MemberSBTDemoAbi from '../../../abi/MemberSbtDemo.json';

/**
 * 全てのSBT認証情報を取得する
 * イベントログを使用して効率的に全SBT情報を取得
 * 
 * @param wallet - ウォレットインスタンス（プロバイダー付き）
 * @param contractAddress - MemberSbtDemoコントラクトのアドレス
 * @returns 全SBTの認証情報配列（UserCredential[]）
 * @throws 取得失敗時にエラーをスロー
 */
export const fetchCredential = async (
    wallet: Wallet | HDNodeWallet,
    contractAddress: string
): Promise<UserCredential[]> => {
    try {
        // 入力値の検証
        if (!ethers.isAddress(contractAddress)) {
            throw new Error('Invalid contract address');
        }

        const provider = wallet.provider;
        if (!provider) {
            throw new Error('Wallet provider is not available');
        }

        // コントラクトインスタンスを作成
        let contract;
        try {
            contract = new ethers.Contract(
                contractAddress,
                MemberSBTDemoAbi.abi,
                provider
            );
        } catch (contractError: any) {
            throw new Error(`Failed to create contract instance: ${contractError.message || 'Unknown error'}`);
        }

        console.log(`📡 Fetching event logs...`);

        // SBTMintedイベントのフィルターを作成
        let filter;
        try {
            filter = contract.filters.SBTMinted();
        } catch (filterError: any) {
            throw new Error(`Failed to create event filter: ${filterError.message || 'Unknown error'}`);
        }

        // イベントログを取得（全ブロック範囲）
        let events;
        try {
            events = await contract.queryFilter(filter, 0, 'latest');
        } catch (queryError: any) {
            if (queryError.message?.includes('query returned more than')) {
                throw new Error('Too many events. Please use a smaller block range or contact support.');
            }
            if (queryError.message?.includes('network')) {
                throw new Error('Network error while fetching events. Please check your connection.');
            }
            throw new Error(`Failed to query events: ${queryError.message || 'Unknown error'}`);
        }

        console.log(`📊 Found ${events.length} SBTMinted events`);

        // イベントが見つからない場合は空配列を返す
        if (events.length === 0) {
            console.log('ℹ️  No SBT credentials found');
            return [];
        }

        // イベントログをパースしてUserCredential配列を作成
        const credentials: UserCredential[] = [];
        
        for (const event of events) {
            try {
                const eventLog = event as ethers.EventLog;
                
                // イベント引数が存在するか確認
                if (!eventLog.args) {
                    console.warn('Event log has no args, skipping...');
                    continue;
                }

                // イベントデータを取得
                const address = eventLog.args.to as string;
                const tokenId = eventLog.args.tokenId;
                const userName = eventLog.args.userName as string;

                // アドレスの検証
                if (!ethers.isAddress(address)) {
                    console.warn(`Invalid address in event: ${address}, skipping...`);
                    continue;
                }

                // トークンIDの検証
                const tokenIdNumber = Number(tokenId);
                if (isNaN(tokenIdNumber) || tokenIdNumber < 0) {
                    console.warn(`Invalid token ID in event: ${tokenId}, skipping...`);
                    continue;
                }

                // 認証情報を配列に追加
                credentials.push({
                    tokenId: tokenIdNumber,
                    userName: userName || '',
                    address: address,
                    trustScore: 0
                });
            } catch (parseError) {
                console.warn('Failed to parse event, skipping...', parseError);
                continue;
            }
        }

        console.log(`✅ Retrieved ${credentials.length} credentials`);

        return credentials;

    } catch (error) {
        console.error('❌ Error fetching credentials:', error);
        
        if (error instanceof Error) {
            throw error;
        }
        
        throw new Error('Failed to fetch credentials: Unknown error');
    }
};

export default fetchCredential;