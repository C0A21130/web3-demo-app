import { Wallet, HDNodeWallet } from "ethers";
import { KuboRPCClient } from "kubo-rpc-client";
interface Params {
    wallet: Wallet | HDNodeWallet;
    contractAddress: string;
    name: string;
    description: string | null;
    image: File | null;
    client: KuboRPCClient | null;
    ipfsApiUrl: string | null;
}
/**
 * 指定されたウォレットとコントラクトアドレスを使用して新しいNFTトークンをミントする関数
 *
 * @param param ミントに必要なパラメータを含むオブジェクト
 * @returns ミントプロセスのトランザクションレシート
 * @throws ウォレットの残高が不足している場合、またはミントプロセスが失敗した場合にエラーをスローします
 */
declare const putToken: (param: Params) => Promise<any>;
export default putToken;
