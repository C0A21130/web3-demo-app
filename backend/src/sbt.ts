import { Contract, JsonRpcProvider, Wallet, isAddress } from "ethers";
import { config } from "./config.js";

const provider = new JsonRpcProvider(config.rpcUrl, config.chainId);

const sbtAbi = [
  "function hasCredential(address userAddress) view returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
] as const;

const contract = new Contract(config.sbtContractAddress, sbtAbi, provider);

const staffSigner = config.staffIssuerPrivateKey
  ? new Wallet(config.staffIssuerPrivateKey, provider)
  : null;

const staffSbtAbi = [
  "function issueByStaff(address to, string userName) returns (uint256)",
] as const;

const staffContract = staffSigner
  ? new Contract(config.sbtContractAddress, staffSbtAbi, staffSigner)
  : null;

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

export async function issueSbtByStaff(address: string, userName: string): Promise<string> {
  if (!isAddress(address)) {
    throw new Error("invalid_address");
  }
  if (!staffContract) {
    throw new Error("staff_issuer_not_configured");
  }
  if (!userName.trim()) {
    throw new Error("user_name_required");
  }

  const tx = await staffContract.issueByStaff(address, userName.trim());
  const receipt = await tx.wait();
  return String(receipt?.hash ?? tx.hash ?? "");
}
