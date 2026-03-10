import { Contract, JsonRpcProvider, isAddress } from "ethers";
import { config } from "./config.js";

const provider = new JsonRpcProvider(config.rpcUrl, config.chainId);

const sbtAbi = [
  "function hasCredential(address userAddress) view returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
] as const;

const contract = new Contract(config.sbtContractAddress, sbtAbi, provider);

export async function hasSbtCredential(address: string): Promise<boolean> {
  if (!isAddress(address)) return false;

  try {
    const hasCredential = await contract.hasCredential(address);
    if (Boolean(hasCredential)) return true;
  } catch {
    // Fallback to balanceOf for compatibility with older deployments.
  }

  try {
    const balance: bigint = await contract.balanceOf(address);
    return balance > 0n;
  } catch {
    return false;
  }
}
