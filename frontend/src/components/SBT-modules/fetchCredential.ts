import { ethers, Wallet, HDNodeWallet } from "ethers";
import MemberSBTDemoAbi from '../../../abi/MemberSBT_Demo.json';

export const fetchCredential = async (
    wallet: Wallet | HDNodeWallet,
    contractAddress: string
): Promise<UserCredential[]> => {
    try {
        if (!ethers.isAddress(contractAddress)) {
            throw new Error('Invalid contract address');
        }

        const provider = wallet.provider;
        if (!provider) {
            throw new Error('Wallet provider is not available');
        }

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

        let filter;
        try {
            filter = contract.filters.SBTMinted();
        } catch (filterError: any) {
            throw new Error(`Failed to create event filter: ${filterError.message || 'Unknown error'}`);
        }

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

        if (events.length === 0) {
            console.log('ℹ️  No SBT credentials found');
            return [];
        }

        const credentials: UserCredential[] = [];
        
        for (const event of events) {
            try {
                const eventLog = event as ethers.EventLog;
                
                if (!eventLog.args) {
                    console.warn('Event log has no args, skipping...');
                    continue;
                }

                const address = eventLog.args.to as string;
                const tokenId = eventLog.args.tokenId;
                const userName = eventLog.args.userName as string;

                if (!ethers.isAddress(address)) {
                    console.warn(`Invalid address in event: ${address}, skipping...`);
                    continue;
                }

                const tokenIdNumber = Number(tokenId);
                if (isNaN(tokenIdNumber) || tokenIdNumber < 0) {
                    console.warn(`Invalid token ID in event: ${tokenId}, skipping...`);
                    continue;
                }

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