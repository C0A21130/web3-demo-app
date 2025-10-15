import { ethers, Wallet, HDNodeWallet, formatEther } from "ethers";
import { create } from "ipfs-http-client";
import SsdlabAbi from './../../abi/SsdlabToken.json';

interface Params {
    wallet: Wallet | HDNodeWallet;
    contractAddress: string;
    name: string;
    description: string | null;
    image: File | null;
    ipfsApiUrl: string | null;
}

/**
 * Mint a basic NFT token without IPFS metadata
 */
const mintToken = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string , metadataURI: string | null) => {
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
        // await rollbackIPFS();
        throw new Error(`Failed to mint base NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// // エラーが発生したさいにガベージコレクションを行いロールバック処理を行う関数
// const rollbackIPFS = async (): Promise<Uint8Array> => {
//     try {
//         // Dynamic import for Helia to avoid Jest ESM issues
//         const { createHelia } = await import('helia');
//         const { unixfs } = await import('@helia/unixfs');
        
//         // Initialize Helia node
//         const helia = await createHelia();
//         const fs = unixfs(helia);

//         // Remove data from IPFS using Helia
//         await helia.gc();
        
//         // Stop Helia node to free resources
//         await helia.stop();
        
//         console.log('Rollback completed successfully');

//         return new Uint8Array();
//     } catch (error) {
//         console.error('Helia rollback failed:', error);
//         await rollbackIPFS();
//         throw new Error(`Failed to rollback from IPFS with Helia: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
// };

// // CIDをpinする関数
// const pinCID = async (cid: string): Promise<void> => {
//     try {
//         // Dynamic import for Helia to avoid Jest ESM issues
//         const { createHelia } = await import('helia');
//         const { CID } = await import('multiformats/cid');
        
//         // Initialize Helia node
//         const helia = await createHelia();
        
//         // Parse CID string to CID object
//         const cidObj = CID.parse(cid);
        
//         // Pin the CID
//         await helia.pins.add(cidObj);
        
//         // Stop Helia node to free resources
//         await helia.stop();
        
//         console.log('CID pinned successfully:', cid);
//     } catch (error) {
//         console.error('Failed to pin CID:', error);
//         throw new Error(`Failed to pin CID ${cid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
// };

// // CIDをunpinする関数
// const unpinCID = async (cid: string): Promise<void> => {
//     try {
//         // Dynamic import for Helia to avoid Jest ESM issues
//         const { createHelia } = await import('helia');
//         const { CID } = await import('multiformats/cid');
        
//         // Initialize Helia node
//         const helia = await createHelia();
        
//         // Parse CID string to CID object
//         const cidObj = CID.parse(cid);
        
//         // Unpin the CID
//         await helia.pins.rm(cidObj);
        
//         // Stop Helia node to free resources
//         await helia.stop();
        
//         console.log('CID unpinned successfully:', cid);
//     } catch (error) {
//         console.error('Failed to unpin CID:', error);
//         throw new Error(`Failed to unpin CID ${cid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
// };

const uploadTokenData = async (tokenName: string, tokenImage: File | null, description: string, ipfsApiUrl: string): Promise<string> => {
    let isPinned = false;
    const client = create({ url: `${ipfsApiUrl}:5001` });
    
    try {
        // 1. File オブジェクトを直接IPFSにアップロード
        if (!tokenImage) return '';
        const imageResult = await client.add(tokenImage);

        // 2. メタデータをIPFSにアップロード（URIを取得）
        const metadata = {
            name: tokenName,
            description: description,
            image: `${ipfsApiUrl}:8080/ipfs/${imageResult.path}`,
            attributes: []
        };
        const metadataResult = await client.add(JSON.stringify(metadata, null, 2));
        const metadataCid = metadataResult.cid.toString();
        const tokenUrl = `${ipfsApiUrl}:8080/ipfs/${metadataCid}`;

        // // 5. 画像とメタデータのCIDをpinする
        // await pinCID(imageCid);
        // await pinCID(metadataHash);
        // isPinned = true;

        // // 6. スマートコントラクトを呼び出してNFTをミント
        // const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
        // const tx = await contract.safeMintIPFS(wallet.address, tokenName, metadataHash);
        // const txReceipt = await tx.wait();

        // console.log('Transaction created successfully');
        return tokenUrl;
    } catch (error) {
        console.error('IPFS mint failed:', error);
        
        // エラー時にピンされたCIDをunpinする
        // if (isPinned) {
        //     try {
        //         if (imageCid) {
        //             console.log('Unpinning image CID due to error:', imageCid);
        //             await unpinCID(imageCid);
        //         }
        //         if (metadataHash) {
        //             console.log('Unpinning metadata CID due to error:', metadataHash);
        //             await unpinCID(metadataHash);
        //         }
        //     } catch (unpinError) {
        //         console.error('Failed to unpin CIDs during error handling:', unpinError);
        //     }
        // }
        
        // await rollbackIPFS();
        // throw new Error(`Failed to mint NFT with IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return '';
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

    if (param.image !== null && param.ipfsApiUrl !== null && param.description !== null) {
        tokenUrl = await uploadTokenData(param.name, param.image, param.description, param.ipfsApiUrl);
        console.log('Token URL:', tokenUrl);
    }

    // Call contract to mint NFT
    const txReceipt = await mintToken(param.wallet, param.contractAddress, param.name, tokenUrl);
    return txReceipt;
};

export default putToken;