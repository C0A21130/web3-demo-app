import { Wallet, HDNodeWallet } from 'ethers';
type MyPolicyProps = {
    hidden: boolean;
    wallet: Wallet | HDNodeWallet | undefined;
    contractAddress: string;
};
declare const MyPolicy: (props: MyPolicyProps) => import("react/jsx-runtime").JSX.Element;
export default MyPolicy;
