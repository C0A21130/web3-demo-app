import { Contract, Wallet, HDNodeWallet, parseEther } from "ethers";
import GovernorToken from "../../../abi/GovernanceToken.json";

// 発行したトークンを自分に委譲する
const delegate = async (wallet: Wallet | HDNodeWallet, contract: Contract): Promise<boolean> => {
  try {
    const tx = await contract.delegate(wallet.address);
    const txReceipt = await tx.wait();
    return txReceipt ? true : false;
  } catch (error) {
    delegate(wallet, contract);
    return false;
  }
}
/**
 * 指定したウォレットとコントラクトアドレスを使ってFTを発行する関数
 * @param wallet - 発行するウォレット
 * @param contractAddress - 発行するコントラクトアドレス
 * @return 発行が成功したかどうかを示すboolean値。発行に失敗した場合はエラーをスローする。
 */
const mint = async (wallet: Wallet | HDNodeWallet, contractAddress: string): Promise<boolean> => {
  const contract = new Contract(contractAddress, GovernorToken.abi, wallet);
  const provider = await wallet.provider

  // FTを発行するための残高があるか確認
  if (provider) {
    const balance = await provider.getBalance(wallet.address);
    if (balance <= 0n) {
      return false;
    }
  }

  // 発行するための金額を指定
  const mintAmount = parseEther("10");

  // 投票を作成するスマートコントラクトを呼び出す
  try {
    // トランザクションを送信して、発行が成功したかどうかを確認する
    const txMint = await contract.mint(wallet.address, mintAmount);
    const txMintReceipt = await txMint.wait();

    if (txMintReceipt) {
      // 発行が成功した場合は、発行したトークンを自分に委譲する
      const delegateResult = await delegate(wallet, contract);
      return delegateResult;
    } else {
      return false;
    }
  } catch (error: any) {
    console.error(error);
    return false;
  }
}

export default mint;
