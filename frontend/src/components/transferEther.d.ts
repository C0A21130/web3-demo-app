import { Wallet, HDNodeWallet } from 'ethers';
/**
 * 指定したウォレットから別のウォレットへEtherを送金する関数
 * @param privateKey 送金元のウォレットのプライベートキー
 * @param toWallet 送金先のウォレット
 */
declare const transferEther: (privateKey: string, toWallet: Wallet | HDNodeWallet, endpointURL: string) => Promise<boolean>;
export default transferEther;
