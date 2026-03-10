import { Wallet, HDNodeWallet } from 'ethers';
interface UserListProps {
    wallet: Wallet | HDNodeWallet | undefined;
    contractAddress: string;
    credentialContractAddress: string;
    credentials: UserCredential[];
    setCredentials: React.Dispatch<React.SetStateAction<UserCredential[]>>;
    setAddress: React.Dispatch<React.SetStateAction<string>>;
}
declare const UserList: (props: UserListProps) => import("react/jsx-runtime").JSX.Element;
export default UserList;
