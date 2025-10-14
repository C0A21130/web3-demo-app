import { ethers, Wallet, HDNodeWallet, formatEther } from "ethers";
import SsdlabAbi from './../../abi/SsdlabToken.json';

/**
 * Mint a basic NFT token without IPFS metadata
 */
const mintToken = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string) => {
    try {
        const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
        const tx = await contract.safeMint(wallet.address, tokenName);
        const txReceipt = await tx.wait();
        return txReceipt;
    } catch (error) {
        console.error('Base minting failed:', error);
        await rollbackIPFS();
        throw new Error(`Failed to mint base NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Upload a file to IPFS using Helia library
 * @param data - File data as string or Uint8Array
 * @param _filename - Optional filename (unused but kept for interface compatibility)
 * @returns IPFS hash
 */
const uploadData = async (data: string | Uint8Array, _filename?: string): Promise<string> => {
    // Promise.withResolvers polyfill for Node.js versions < 19.8.0
    if (!(Promise as any).withResolvers) {
        (Promise as any).withResolvers = function<T>() {
            let resolve!: (value: T | PromiseLike<T>) => void;
            let reject!: (reason?: any) => void;
            const promise = new Promise<T>((res, rej) => {
                resolve = res;
                reject = rej;
            });
            return { promise, resolve, reject };
        };
    }

    try {
        // Dynamic import for Helia to avoid Jest ESM issues
        const { createHelia } = await import('helia');
        const { unixfs } = await import('@helia/unixfs');
        
        // Initialize Helia node
        const helia = await createHelia();
        const fs = unixfs(helia);
        
        let uploadData: Uint8Array;
        
        if (typeof data === 'string') {
            uploadData = new TextEncoder().encode(data);
        } else {
            uploadData = data;
        }
        
        // Upload to IPFS using Helia
        const cid = await fs.addBytes(uploadData);
        
        // Stop Helia node to free resources
        await helia.stop();
        
        console.log('Helia upload result:', cid.toString());
        
        return cid.toString();
        
    } catch (error) {
        console.error('Helia upload failed:', error);
        await rollbackIPFS();
        throw new Error(`Failed to upload to IPFS with Helia: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
// エラーが発生したさいにガベージコレクションを行いロールバック処理を行う関数
const rollbackIPFS = async (): Promise<Uint8Array> => {
    try {
        // Dynamic import for Helia to avoid Jest ESM issues
        const { createHelia } = await import('helia');
        const { unixfs } = await import('@helia/unixfs');
        
        // Initialize Helia node
        const helia = await createHelia();
        const fs = unixfs(helia);
        
        // Remove data from IPFS using Helia
        await helia.gc();
        
        // Stop Helia node to free resources
        await helia.stop();
        
        console.log('Rollback completed successfully');

        return new Uint8Array();
    } catch (error) {
        console.error('Helia rollback failed:', error);
        await rollbackIPFS();
        throw new Error(`Failed to rollback from IPFS with Helia: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// CIDをpinする関数
const pinCID = async (cid: string): Promise<void> => {
    try {
        // Dynamic import for Helia to avoid Jest ESM issues
        const { createHelia } = await import('helia');
        const { CID } = await import('multiformats/cid');
        
        // Initialize Helia node
        const helia = await createHelia();
        
        // Parse CID string to CID object
        const cidObj = CID.parse(cid);
        
        // Pin the CID
        await helia.pins.add(cidObj);
        
        // Stop Helia node to free resources
        await helia.stop();
        
        console.log('CID pinned successfully:', cid);
    } catch (error) {
        console.error('Failed to pin CID:', error);
        throw new Error(`Failed to pin CID ${cid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Mint an NFT token with IPFS-stored metadata using Helia
 */
const uploadMetadata = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string, imageData: string | Uint8Array) => {
    try {
        // 1. 画像をIPFSにアップロード
        console.log('Uploading image to IPFS...');
        const imageHash = await uploadData(imageData);
        const imageURI = `http://10.203.92.63:8080/ipfs/${imageHash}`;
        console.log('Image uploaded to IPFS:', imageHash);

        // 2. NFTメタデータを作成
        const metadata = {
            name: tokenName,
            description: "An NFT minted via Ssdlab using Helia IPFS library",
            image: imageURI,
            attributes: []
        };
        
        // 3. メタデータをIPFSにアップロード (Helia使用)
        console.log('Uploading metadata to IPFS...');
        const metadataHash = await uploadData(JSON.stringify(metadata, null, 2));
        const metadataURI = `http://10.203.92.63:8080/ipfs/${metadataHash}`;
        
        console.log('Metadata uploaded to IPFS via Helia:', metadataHash);
        console.log('Final metadata URI:', metadataURI);

        // 4. ブロックチェーンにmint
        const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
        const tx = await contract.safeMintIPFS(wallet.address, tokenName, metadataURI);
        const txReceipt = await tx.wait();
        
        // 5. すべての処理が成功したらCIDをpin
        console.log('Pinning image and metadata CIDs...');
        await pinCID(imageHash);
        await pinCID(metadataHash);
        console.log('CIDs pinned successfully');
        
        return txReceipt;
        
    } catch (error) {
        console.error('IPFS mint failed:', error);
        
        // ロールバック処理を実行
        try {
            await rollbackIPFS();
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        }
        
        throw new Error(`Failed to mint NFT with IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * This function mints a new NFT token using the provided wallet and contract address.
 * 
 * @param wallet - The wallet instance (either Wallet or HDNodeWallet) used to sign the transaction.
 * @param contractAddress - The address of the smart contract to interact with.
 * @param tokenName - The name of the token to be minted.
 * @param imageData - The image data to upload to IPFS (optional, empty string for base mint).
 * @returns The transaction receipt of the minting process.
 * @throws Will throw an error if the wallet balance is insufficient or if the minting process fails.
 */
const putToken = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string, imageData: string | Uint8Array = "") => {
    // check balance of wallet
    const provider = wallet.provider;
    if (provider === null) { 
        throw new Error('Provider is null');
    }
    const balance = await provider.getBalance(wallet.address);
    
    // Check if the wallet has enough balance to mint NFT
    if (formatEther(balance) == "0.0") {
        throw new Error('Insufficient balance');
    }

    // Call contract to mint NFT
    if (imageData === "") {
        return await mintToken(wallet, contractAddress, tokenName);
    } else {
        return await uploadMetadata(wallet, contractAddress, tokenName, imageData);
    }
};

export default putToken;