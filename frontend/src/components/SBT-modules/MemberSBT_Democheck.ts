/**
 * MemberSBT_Democheck.ts
 * MemberSBT_Demo コントラクトから発行済みSBT情報を取得するユーティリティ関数
 */

import { ethers, BrowserProvider, JsonRpcProvider } from "ethers";
import MemberSBTDemoAbi from '../../../abi/MemberSBT_Demo.json';

/**
 * SBT所持者情報
 */
export interface SBTHolderInfo {
    tokenId: number;
    owner: string;
    userName: string;
}

/**
 * 関数の戻り値
 */
export interface SBTHolderListResult {
    success: boolean;
    holders: SBTHolderInfo[];
    error: string | null;
}

/**
 * SBT所持者一覧を取得
 * 
 * @param provider - Ethereumプロバイダー（BrowserProvider または JsonRpcProvider）
 * @param contractAddress - MemberSBT_Demoコントラクトのアドレス
 * @returns 取得結果（success, holders, error）
 * 
 * @example
 * const provider = new BrowserProvider(window.ethereum);
 * const result = await getAllSBTHolders(provider, contractAddress);
 * if (result.success) {
 *   result.holders.forEach(h => console.log(h.userName));
 * }
 */
export const getAllSBTHolders = async (
    provider: BrowserProvider | JsonRpcProvider,
    contractAddress: string
): Promise<SBTHolderListResult> => {
    try {
        // バリデーション
        if (!ethers.isAddress(contractAddress)) {
            return {
                success: false,
                holders: [],
                error: '無効なコントラクトアドレスです'
            };
        }

        if (!provider) {
            return {
                success: false,
                holders: [],
                error: 'プロバイダーが設定されていません'
            };
        }

        // コントラクトインスタンス作成
        const contract = new ethers.Contract(
            contractAddress,
            MemberSBTDemoAbi.abi,
            provider
        );

        // 総発行数を取得
        const totalSupplyBigInt = await contract.getTotalSupply();
        const totalSupply = Number(totalSupplyBigInt);

        console.log(`📊 総発行数: ${totalSupply} 件のSBTが発行されています`);

        if (totalSupply === 0) {
            return {
                success: true,
                holders: [],
                error: null
            };
        }

        // 各SBTの情報を並列取得（Promise.allで高速化）
        console.log(`🔄 ${totalSupply} 件のSBT情報を取得中...`);

        const holderPromises = Array.from({ length: totalSupply }, async (_, index) => {
            const tokenId = index;

            try {
                const [owner, userName] = await Promise.all([
                    contract.ownerOf(tokenId),
                    contract.getUserName(tokenId)
                ]);

                return {
                    tokenId,
                    owner,
                    userName
                };
            } catch (error) {
                console.warn(`⚠️ Token ID ${tokenId} の取得に失敗しました:`, error);
                return null;
            }
        });

        const holdersWithNull = await Promise.all(holderPromises);

        // nullを除外
        const holders = holdersWithNull.filter(
            (holder): holder is SBTHolderInfo => holder !== null
        );

        console.log(`✅ ${holders.length} 件のSBT情報を正常に取得しました`);

        return {
            success: true,
            holders,
            error: null
        };

    } catch (error) {
        console.error('❌ SBT所持者一覧の取得中にエラーが発生しました:', error);

        let errorMessage = 'SBT所持者一覧の取得に失敗しました';
        if (error instanceof Error) {
            errorMessage = `${errorMessage}: ${error.message}`;
        }

        return {
            success: false,
            holders: [],
            error: errorMessage
        };
    }
};

/**
 * 特定アドレスが所有するSBTを取得
 * 
 * @param provider - Ethereumプロバイダー
 * @param contractAddress - MemberSBT_Demoコントラクトのアドレス
 * @param ownerAddress - 検索対象の所有者アドレス
 * @returns 指定アドレスが所有するSBT情報
 */
export const getSBTsByOwner = async (
    provider: BrowserProvider | JsonRpcProvider,
    contractAddress: string,
    ownerAddress: string
): Promise<SBTHolderListResult> => {
    if (!ethers.isAddress(ownerAddress)) {
        return {
            success: false,
            holders: [],
            error: '無効な所有者アドレスです'
        };
    }

    const allHoldersResult = await getAllSBTHolders(provider, contractAddress);

    if (!allHoldersResult.success) {
        return allHoldersResult;
    }

    // アドレスで絞り込み（大文字小文字を区別しない）
    const filteredHolders = allHoldersResult.holders.filter(
        holder => holder.owner.toLowerCase() === ownerAddress.toLowerCase()
    );

    console.log(`🔍 ${ownerAddress} が所有するSBT: ${filteredHolders.length} 件`);

    return {
        success: true,
        holders: filteredHolders,
        error: null
    };
};

/**
 * ユーザー名でSBTを検索
 * 
 * @param provider - Ethereumプロバイダー
 * @param contractAddress - MemberSBT_Demoコントラクトのアドレス
 * @param searchKeyword - 検索キーワード（部分一致）
 * @param caseSensitive - 大文字小文字を区別するか（デフォルト: false）
 * @returns 検索にマッチしたSBT情報
 */
export const searchSBTsByUserName = async (
    provider: BrowserProvider | JsonRpcProvider,
    contractAddress: string,
    searchKeyword: string,
    caseSensitive: boolean = false
): Promise<SBTHolderListResult> => {
    if (!searchKeyword || searchKeyword.trim() === '') {
        return {
            success: false,
            holders: [],
            error: '検索キーワードを入力してください'
        };
    }

    const allHoldersResult = await getAllSBTHolders(provider, contractAddress);

    if (!allHoldersResult.success) {
        return allHoldersResult;
    }

    // ユーザー名で検索
    const filteredHolders = allHoldersResult.holders.filter(holder => {
        const userName = caseSensitive ? holder.userName : holder.userName.toLowerCase();
        const keyword = caseSensitive ? searchKeyword : searchKeyword.toLowerCase();
        return userName.includes(keyword);
    });

    console.log(`🔍 "${searchKeyword}" で検索: ${filteredHolders.length} 件ヒット`);

    return {
        success: true,
        holders: filteredHolders,
        error: null
    };
};
