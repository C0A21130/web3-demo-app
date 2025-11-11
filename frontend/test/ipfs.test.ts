import { describe, it, expect } from "@jest/globals";
import { Wallet, JsonRpcProvider, Contract } from 'ethers';
import putToken from '../src/components/token/putToken';
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import SsdlabAbi from "../abi/SsdlabToken.json";

const rpcUrls = ['http://localhost:8545'];
const ipfsApiUrl = 'http://localhost';
const contractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const walletPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// IPFSを用いたNFTの発行
describe('IPFS', () => {

  it('should mint for token with IPFS metadata', async () => {
    // walletの取得
    const provider = new JsonRpcProvider(rpcUrls[0]);
    const wallet = new Wallet(walletPrivateKey, provider);
    const client = create({ url: ipfsApiUrl+":5001" }) as IPFSHTTPClient;

    // NFTのミント
    const imageData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header bytes
    const mockFile = new File([imageData], 'test-image.png', { type: 'image/png' });
    const params = {
        name: 'Frends Lost Token', 
        image: mockFile, 
        description: "This is a test token with IPFS metadata", 
        wallet: wallet, 
        contractAddress: contractAddress, 
        client: client, 
        ipfsApiUrl: ipfsApiUrl 
    };
    const txReceipt = await putToken(params);

    // Check if token was minted with IPFS metadata
    expect(txReceipt).toBeDefined();
    expect(txReceipt.logs).toBeDefined();
    expect(txReceipt.logs.length).toBeGreaterThan(0);
    
    // トークンが正常にミントされたかチェック
    const tokenId = txReceipt.logs[txReceipt.logs.length - 1].args[2];
    expect(tokenId).toBeDefined();

    const contract = new Contract(contractAddress, SsdlabAbi.abi, provider);
    const tokenURI = await contract.getTokenURI(tokenId);
    console.log(`Token URI for minted token ${tokenId}: ${tokenURI}`);
  }, 60000); // IPFS処理に時間がかかる可能性があるため60秒に延長
});