import { type ContractRunner, type Eip1193Provider } from "ethers";
type GetOwnerAddressDeps = {
    getRunner?: () => Promise<ContractRunner> | ContractRunner;
    getEthereum?: () => Eip1193Provider | undefined;
    createProvider?: (ethereum: Eip1193Provider) => ContractRunner;
    createContract?: (contractAddress: string, abi: unknown, runner: ContractRunner) => {
        ownerOf: (tokenId: bigint) => Promise<string>;
    };
};
export declare function getOwnerAddressByTokenId(contractAddress: string, tokenId: bigint, deps?: GetOwnerAddressDeps): Promise<string>;
export {};
