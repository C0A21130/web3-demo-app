import { describe, it, expect, beforeEach } from "@jest/globals";
import type { ContractRunner } from "ethers";
import { getOwnerAddressByTokenId } from "../src/components/getOwnerAddress";

describe("getOwnerAddressByTokenId", () => {
  const validContractAddress = "0x0000000000000000000000000000000000000001";
  const expectedOwner = "0x00000000000000000000000000000000000000AA";

  beforeEach(() => {
    delete (globalThis as typeof globalThis & { ethereum?: unknown }).ethereum;
  });

  it("ウォレット未接続ならエラーになる", async () => {
    await expect(
      getOwnerAddressByTokenId(validContractAddress, 1n)
    ).rejects.toThrow("ウォレット未接続");
  });

  it("ownerOf成功時にオーナーアドレスを返す", async () => {
    const result = await getOwnerAddressByTokenId(validContractAddress, 1n, {
      getEthereum: () => ({
        request: async (_request: { method: string; params?: Array<unknown> | object }) => null,
      }),
      createProvider: () => ({}) as ContractRunner,
      createContract: () => ({
        ownerOf: async () => expectedOwner,
      }),
    });

    console.log("owner address:", result);
    expect(result).toBe(expectedOwner);
  });
});
