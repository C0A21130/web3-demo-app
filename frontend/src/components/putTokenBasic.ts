import { ethers, Wallet, HDNodeWallet, formatEther } from "ethers";
import { IPFSHTTPClient } from "ipfs-http-client";
import SsdlabAbi from './../../abi/SsdlabToken.json';

/**
 * 劣化版putToken - ロールバック機構と再試行処理を除去
 * 
 * 目的：提案ミドルウェア（putTokenError.ts）との比較評価用
 * 特徴：エラーハンドリング機構なし、整合性維持機能なし
 */

interface BasicParams {
    wallet: Wallet | HDNodeWallet;
    contractAddress: string;
    name: string;
    description: string | null;
    image: File | null;
    client: IPFSHTTPClient | null;
    ipfsApiUrl: string | null;
}

/**
 * 基本的なNFTミント - エラーハンドリングなし
 */
const basicMintToken = async (params: BasicParams, tokenName: string, metadataURI: string | null) => {
    const contract = new ethers.Contract(params.contractAddress, SsdlabAbi.abi, params.wallet);
    let tx;
    
    if (metadataURI != null) {
        tx = await contract.safeMintIPFS(params.wallet.address, tokenName, metadataURI);
    } else {
        tx = await contract.safeMint(params.wallet.address, tokenName);
    }
    
    const txReceipt = await tx.wait();
    return txReceipt;
};

/**
 * 基本的なIPFSアップロード - エラーハンドリングなし
 */
const basicUploadTokenData = async (
    tokenName: string, 
    tokenImage: File | null, 
    description: string, 
    client: IPFSHTTPClient, 
    ipfsApiUrl: string
): Promise<string> => {
    if (!tokenImage) return '';
    
    // IPFSアップロード（エラー時は例外で終了）
    const imageResult = await client.add(tokenImage);
    const imageCid = imageResult.cid.toString();

    // メタデータ作成
    const metadata = {
        name: tokenName,
        description: description,
        image: `${ipfsApiUrl}:8080/ipfs/${imageResult.path}`,
        attributes: []
    };
    
    const metadataResult = await client.add(JSON.stringify(metadata, null, 2));
    const metadataCid = metadataResult.cid.toString();
    
    const tokenUrl = `${ipfsApiUrl}:8080/ipfs/${metadataCid}`;

    // ピン処理（エラー時は無視）
    try {
        await client.pin.add(imageCid);
        await client.pin.add(metadataCid);
    } catch (error) {
        // ピンエラーは無視（データは残ったまま）
    }

    return tokenUrl;
};

/**
 * 劣化版putToken - エラーハンドリング機構なし
 */
const putTokenBasic = async (param: BasicParams) => {
    // 残高チェック（エラー時は例外で終了）
    let provider = param.wallet.provider;
    if (provider === null) { 
        throw new Error('Provider is null');
    }
    
    const balance = await provider.getBalance(param.wallet.address);
    if (formatEther(balance) == "0.0") {
        throw new Error('Insufficient balance');
    }

    let tokenUrl: string | null = null;

    // IPFSアップロード（エラー時は例外で終了、ロールバックなし）
    if (param.image !== null && param.ipfsApiUrl !== null && param.description !== null && param.client !== null) {
        tokenUrl = await basicUploadTokenData(param.name, param.image, param.description, param.client, param.ipfsApiUrl);
    }

    // ブロックチェーンミント（エラー時は例外で終了、IPFSデータは残ったまま）
    return await basicMintToken(param, param.name, tokenUrl);
};

export default putTokenBasic;