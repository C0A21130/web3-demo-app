import { describe, it, expect, beforeEach } from "@jest/globals";
import { mintNftByAddress } from "../src/components/MintNFT";

describe("mintNftByAddress", () => {
  const validContractAddress = "0x0000000000000000000000000000000000000001";
  const validOwner = "0x0000000000000000000000000000000000000002";

  beforeEach(() => {
    delete (globalThis as typeof globalThis & { ethereum?: unknown }).ethereum;
  });

  it("ウォレット未接続ならエラーになる", async () => {
    await expect(
      mintNftByAddress(validContractAddress, validOwner, 1n)
    ).rejects.toThrow("ウォレット未接続");
  });

  it("safeMint成功時にwait結果を返す", async () => {
    const mintedTokenId = 1n;
    const fakeReceipt = { status: 1, hash: "0xabc" };

    const result = await mintNftByAddress(validContractAddress, validOwner, mintedTokenId, {
      getEthereum: () => ({
        request: async (_request: { method: string; params?: Array<unknown> | object }) => null,
      }),
      createProvider: () => ({
        getSigner: async () => ({ address: "0xsigner" }),
      }),
      createContract: () => ({
        safeMint: async () => ({
          wait: async () => fakeReceipt,
        }),
      }),
    });

    console.log("minted nft:", {
      contractAddress: validContractAddress,
      owner: validOwner,
      tokenId: mintedTokenId.toString(),
      txHash: fakeReceipt.hash,
      status: fakeReceipt.status,
    });

    expect(result).toEqual(fakeReceipt);
  });
});
