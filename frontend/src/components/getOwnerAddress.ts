import {
	BrowserProvider,
	Contract,
	isAddress,
	type ContractRunner,
	type Eip1193Provider,
} from "ethers";
import MyTokenArtifact from "../../../contracts/artifacts/contracts/Mytoken.sol/MyToken.json";

type GetOwnerAddressDeps = {
	getRunner?: () => Promise<ContractRunner> | ContractRunner;
	getEthereum?: () => Eip1193Provider | undefined;
	createProvider?: (ethereum: Eip1193Provider) => ContractRunner;
	createContract?: (
		contractAddress: string,
		abi: unknown,
		runner: ContractRunner
	) => {
		ownerOf: (tokenId: bigint) => Promise<string>;
	};
};

export async function getOwnerAddressByTokenId(
	contractAddress: string,
	tokenId: bigint,
	deps: GetOwnerAddressDeps = {}
): Promise<string> {
	if (!isAddress(contractAddress)) throw new Error("コントラクトアドレスが不正");
	if (tokenId < 0n) throw new Error("tokenIdは0以上である必要があります");

	let runner: ContractRunner;
	if (deps.getRunner) {
		runner = await deps.getRunner();
	} else {
		const ethereum = deps.getEthereum
			? deps.getEthereum()
			: (globalThis as typeof globalThis & { ethereum?: Eip1193Provider }).ethereum;
		if (!ethereum) throw new Error("ウォレット未接続");

		runner = deps.createProvider
			? deps.createProvider(ethereum)
			: new BrowserProvider(ethereum);
	}

	const contract = deps.createContract
		? deps.createContract(contractAddress, MyTokenArtifact.abi, runner)
		: new Contract(contractAddress, MyTokenArtifact.abi, runner);

	return await contract.ownerOf(tokenId);
}

