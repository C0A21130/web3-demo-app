import { Wallet, HDNodeWallet } from 'ethers';
interface MyCredentialProps {
    hidden: boolean;
    wallet: Wallet | HDNodeWallet | undefined;
    contractAddress: string;
    credentialContractAddress: string;
}
declare const MyCredential: (props: MyCredentialProps) => import("react/jsx-runtime").JSX.Element;
export default MyCredential;
