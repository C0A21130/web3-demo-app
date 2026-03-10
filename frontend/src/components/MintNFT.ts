import {
  BrowserProvider,
  Contract,
  isAddress,
  type ContractRunner,
  type Eip1193Provider,
} from "ethers";
import MyTokenArtifact from "../../../contracts/artifacts/contracts/Mytoken.sol/MyToken.json";

type MintNftDeps = {
  getRunner?: () => Promise<ContractRunner> | ContractRunner;
  getEthereum?: () => Eip1193Provider | undefined;
  createProvider?: (ethereum: Eip1193Provider) => {
    getSigner: () => Promise<unknown>;
  };
  createContract?: (
    contractAddress: string,
    abi: unknown,
    signer: ContractRunner
  ) => {
    safeMint: (
      owner: string,
      tokenId: bigint
    ) => Promise<{ wait: () => Promise<unknown> }>;
  };
};

export async function mintNftByAddress(
  contractAddress: string,
  owner: string,
  tokenId: bigint,
  deps: MintNftDeps = {}
) {
  if (!isAddress(contractAddress)) throw new Error("コントラクトアドレスが不正");
  if (!isAddress(owner)) throw new Error("ownerアドレスが不正");
  if (tokenId < 0n) throw new Error("tokenIdは0以上である必要があります");

  let runner: ContractRunner;
  if (deps.getRunner) {
    runner = await deps.getRunner();
  } else {
    const ethereum = deps.getEthereum
      ? deps.getEthereum()
      : (globalThis as typeof globalThis & { ethereum?: Eip1193Provider }).ethereum;
    if (!ethereum) throw new Error("ウォレット未接続");

    const provider = deps.createProvider
      ? deps.createProvider(ethereum)
      : new BrowserProvider(ethereum);
    runner = (await provider.getSigner()) as ContractRunner;
  }

  const contract = deps.createContract
    ? deps.createContract(contractAddress, MyTokenArtifact.abi, runner)
    : new Contract(contractAddress, MyTokenArtifact.abi, runner);
  const tx = await contract.safeMint(owner, tokenId);
  return await tx.wait();
}