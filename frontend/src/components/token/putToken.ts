import { ethers, Wallet, HDNodeWallet, formatEther } from "ethers";
import { IPFSHTTPClient } from "ipfs-http-client";
import SsdlabAbi from '../../../abi/SsdlabToken.json';

interface Params {
    wallet: Wallet | HDNodeWallet;
    contractAddress: string;
    name: string;
    description: string | null;
    image: File | null;
    client: IPFSHTTPClient | null;
    ipfsApiUrl: string | null;
}

/**
 * Mint a basic NFT token without IPFS metadata
 */
const mintToken = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string , metadataURI: string | null, client: IPFSHTTPClient | null) => {
    try {
        const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
        if (metadataURI != null) {
            const tx = await contract.safeMintIPFS(wallet.address, tokenName, metadataURI);
            const txReceipt = await tx.wait();
            return txReceipt;
        } else {
            const tx = await contract.safeMint(wallet.address, tokenName);
            const txReceipt = await tx.wait();
            return txReceipt;
        }
    } catch (error) {
        console.error('Base minting failed:', error);
        if (client != null) {
            await rollbackIPFS(client);
        }
        throw new Error(`Failed to mint base NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// エラーが発生した際にガベージコレクションを行いロールバック処理を行う関数
const rollbackIPFS = async (client: IPFSHTTPClient): Promise<void> => {
    try {
        // IPFSノードでガベージコレクションを実行
        await client.repo.gc();
        
    } catch (error) {
        console.error('IPFS rollback failed:', error);
        throw new Error(`Failed to rollback IPFS with gc: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// // CIDをpinする関数
const pinCID = async (client: IPFSHTTPClient, cid: string): Promise<void> => {
    try {
        await client.pin.add(cid);
    } catch (error) {
        console.error('Failed to pin CID:', error);
        throw new Error(`Failed to pin CID ${cid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// // CIDをunpinする関数
const unpinCID = async (client: IPFSHTTPClient, cid: string): Promise<void> => {
    try {
        await client.pin.rm(cid);
    } catch (error) {
        console.error('Failed to unpin CID:', error);
        throw new Error(`Failed to unpin CID ${cid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

const uploadTokenData = async (tokenName: string, tokenImage: File | null, description: string, client: IPFSHTTPClient, ipfsApiUrl: string): Promise<string> => {
    let isPinned = false;
    let imageCid : string | null = null;
    let metadataCid : string | null = null;
    
    try {
        // 1. File オブジェクトを直接IPFSにアップロード
        if (!tokenImage) return '';
        const imageResult = await client.add(tokenImage);
        imageCid = imageResult.cid.toString();

        // 2. メタデータをIPFSにアップロード（URIを取得）
        const metadata = {
            name: tokenName,
            description: description,
            image: `${ipfsApiUrl}:8080/ipfs/${imageResult.path}`,
            attributes: []
        };
        const metadataResult = await client.add(JSON.stringify(metadata, null, 2));
        metadataCid = metadataResult.cid.toString();
        const tokenUrl = `${ipfsApiUrl}:8080/ipfs/${metadataCid}`;

        // // 5. 画像とメタデータのCIDをpinする
        await pinCID(client, imageCid);
        await pinCID(client, metadataCid);
        isPinned = true;

        return tokenUrl;
    } catch (error) {
        console.error('IPFS mint failed:', error);
        
        // エラー時にピンされたCIDをunpinする
        if (isPinned) {
            try {
                if (imageCid != null) {
                    console.log('Unpinning image CID due to error:', imageCid);
                    await unpinCID(client, imageCid);
                }
                if (metadataCid != null) {
                    console.log('Unpinning metadata CID due to error:', metadataCid);
                    await unpinCID(client, metadataCid);
                }
            } catch (unpinError) {
                console.error('Failed to unpin CIDs during error handling:', unpinError);
            }
        }
        
        await rollbackIPFS(client);
        throw new Error(`Failed to mint NFT with IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * 指定されたウォレットとコントラクトアドレスを使用して新しいNFTトークンをミントする関数
 *
 * @param param ミントに必要なパラメータを含むオブジェクト
 * @returns ミントプロセスのトランザクションレシート
 * @throws ウォレットの残高が不足している場合、またはミントプロセスが失敗した場合にエラーをスローします
 */
const putToken = async (param: Params) => {
    let tokenUrl: string | null = null;

    // check balance of wallet
    const provider = param.wallet.provider;
    if (provider === null) { 
        throw new Error('Provider is null');
    }
    const balance = await provider.getBalance(param.wallet.address);

    // Check if the wallet has enough balance to mint NFT
    if (formatEther(balance) == "0.0") {
        throw new Error('Insufficient balance');
    }

    if (param.image !== null && param.ipfsApiUrl !== null && param.description !== null && param.client !== null) {
        tokenUrl = await uploadTokenData(param.name, param.image, param.description, param.client, param.ipfsApiUrl);
    }

    // Call contract to mint NFT
    const txReceipt = await mintToken(param.wallet, param.contractAddress, param.name, tokenUrl, param.client);
    return txReceipt;
};

export default putToken;