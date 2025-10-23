import { ethers, Wallet, HDNodeWallet } from "ethers";
import MemberSBTDemoAbi from '../../../abi/MemberSbtDemo.json';

/**
 * SBT（Soulbound Token）を発行する
 * 
 * @param wallet - ウォレットインスタンス（Wallet または HDNodeWallet）
 * @param contractAddress - MemberSbtDemoコントラクトのアドレス
 * @param userName - SBTに紐付けるユーザー名
 * @returns 発行されたSBTの認証情報（UserCredential）
 * @throws 発行失敗時にエラーをスロー
 */
export const issueCredential = async (
    wallet: Wallet | HDNodeWallet, 
    contractAddress: string,
    userName: string
): Promise<UserCredential> => {
    try {
        // 入力値の検証
        if (!ethers.isAddress(contractAddress)) {
            throw new Error('Invalid contract address');
        }

        if (!userName || userName.trim() === '') {
            throw new Error('User name is required');
        }

        if (!wallet.provider) {
            throw new Error('Wallet provider is not available');
        }

        // コントラクトインスタンスを作成
        const contract = new ethers.Contract(contractAddress, MemberSBTDemoAbi.abi, wallet);
        
        // トランザクションを送信
        let tx;
        try {
            tx = await contract.safeMint(wallet.address, userName);
        } catch (txError: any) {
            if (txError.message?.includes('You can only mint an SBT for yourself')) {
                throw new Error('You can only mint an SBT for yourself');
            }
            if (txError.message?.includes('insufficient funds')) {
                throw new Error('Insufficient funds for gas');
            }
            throw new Error(`Transaction failed: ${txError.message || 'Unknown error'}`);
        }

        // トランザクションの完了を待機
        let receipt;
        try {
            receipt = await tx.wait();
        } catch (receiptError: any) {
            throw new Error(`Transaction receipt failed: ${receiptError.message || 'Unknown error'}`);
        }

        if (!receipt) {
            throw new Error('Transaction receipt is null');
        }
        
        // イベントログからSBTMintedイベントを取得
        const mintEvent = receipt.logs
            .map((log: any) => {
                try {
                    return contract.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find((parsed: any) => parsed?.name === 'SBTMinted');

        if (!mintEvent) {
            throw new Error('SBTMinted event not found in transaction logs');
        }

        // トークンIDを取得して検証
        const tokenId = Number(mintEvent.args.tokenId);

        if (isNaN(tokenId) || tokenId < 0) {
            throw new Error('Invalid token ID received from event');
        }

        // UserCredential型のオブジェクトを返す
        return {
            tokenId,
            userName,
            address: wallet.address,
            trustScore: 0
        };
    } catch (error) {
        console.error('Failed to issue credential:', error);
        
        if (error instanceof Error) {
            throw error;
        }
        
        throw new Error('Failed to issue credential: Unknown error');
    }
}

export default issueCredential;