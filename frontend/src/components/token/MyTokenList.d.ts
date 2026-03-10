import { Wallet, HDNodeWallet } from 'ethers';
interface MyTokenListProps {
    hidden: boolean;
    rpcUrl: string;
    wallet: Wallet | HDNodeWallet | undefined;
    contractAddress: string;
}
declare const MyTokenList: (props: MyTokenListProps) => import("react/jsx-runtime").JSX.Element;
export default MyTokenList;
