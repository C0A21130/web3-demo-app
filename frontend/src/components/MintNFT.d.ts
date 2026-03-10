import { type ContractRunner, type Eip1193Provider } from "ethers";
type MintNftDeps = {
    getRunner?: () => Promise<ContractRunner> | ContractRunner;
    getEthereum?: () => Eip1193Provider | undefined;
    createProvider?: (ethereum: Eip1193Provider) => {
        getSigner: () => Promise<unknown>;
    };
    createContract?: (contractAddress: string, abi: unknown, signer: ContractRunner) => {
        safeMint: (owner: string, tokenId: bigint) => Promise<{
            wait: () => Promise<unknown>;
        }>;
    };
};
export declare function mintNftByAddress(contractAddress: string, owner: string, tokenId: bigint, deps?: MintNftDeps): Promise<any>;
export {};
