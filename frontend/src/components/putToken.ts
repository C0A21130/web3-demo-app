import { ethers, Wallet, HDNodeWallet, formatEther } from "ethers";
import SsdlabAbi from './../../abi/SsdlabToken.json';

// Function to mint NFT
const baseMint = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string) => {
    try {
        const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
        const tx = await contract.safeMint(wallet.address, tokenName);
        const txReceipt = await tx.wait();
        return txReceipt;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to mint NFT');
    }
};

// IPFS HTTP APIを直接使用してファイルをアップロード
const uploadToIPFS = async (content: string, filename: string = 'file'): Promise<string> => {
    try {
        const formData = new FormData();
        const blob = new Blob([content], { type: 'text/plain' });
        formData.append('file', blob, filename);
        
        // IPFS HTTP APIに直接POST
        const response = await fetch('http://10.203.92.63:5001/api/v0/add?pin=true', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`IPFS API error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('IPFS upload result:', result);
        
        return result.Hash;
    } catch (error) {
        console.error('IPFS upload failed:', error);
        throw error;
    }
};

// Function to mint NFT with IPFS using HTTP API
const IPFSMint = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string, tokenURI: string) => {
    try {
        // 1. 画像コンテンツをIPFSにアップロード
        const imageHash = await uploadToIPFS(tokenURI, 'image.txt');
        const imageURI = `http://10.203.92.63:8080/ipfs/${imageHash}`;
        
        console.log('Image uploaded to IPFS:', imageHash);

        // 2. NFTメタデータを作成
        const metadata = {
            name: tokenName,
            description: "An NFT minted via Ssdlab using IPFS HTTP API",
            image: imageURI,
            attributes: []
        };
        
        // 3. メタデータをIPFSにアップロード
        const metadataHash = await uploadToIPFS(JSON.stringify(metadata, null, 2), 'metadata.json');
        const metadataURI = `http://10.203.92.63:8080/ipfs/${metadataHash}`;
        
        console.log('Metadata uploaded to IPFS:', metadataHash);
        console.log('Final metadata URI:', metadataURI);

        // 4. ブロックチェーンにmint
        const contract = new ethers.Contract(contractAddress, SsdlabAbi.abi, wallet);
        const tx = await contract.safeMintIPFS(wallet.address, tokenName, metadataURI);
        const txReceipt = await tx.wait();
        
        return txReceipt;
        
    } catch (error) {
        console.error('IPFS mint failed:', error);
        throw new Error(`Failed to mint NFT with IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * This function mints a new NFT token using the provided wallet and contract address.
 * 
 * @param wallet - The wallet instance (either Wallet or HDNodeWallet) used to sign the transaction.
 * @param contractAddress - The address of the smart contract to interact with.
 * @param tokenName - The name of the token to be minted.
 * @param tokenURI - The URI of the token metadata (optional, empty string for base mint).
 * @returns The transaction receipt of the minting process.
 * @throws Will throw an error if the wallet balance is insufficient or if the minting process fails.
 */
const putToken = async (wallet: Wallet | HDNodeWallet, contractAddress: string, tokenName: string, tokenURI: string = "") => {
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
    if (tokenURI === "") {
        return await baseMint(wallet, contractAddress, tokenName);
    } else {
        return await IPFSMint(wallet, contractAddress, tokenName, tokenURI);
    }
};

export default putToken;