import { Wallet, HDNodeWallet } from 'ethers';
import { Card, Button, Text, RingProgress } from '@mantine/core';
import { useEffect } from 'react';
import fetchScores from '../scoring/fetchScores';

interface UserListProps {
  wallet: Wallet | HDNodeWallet | undefined;
  contractAddress: string;
  credentials: UserCredential[];
  setCredentials: React.Dispatch<React.SetStateAction<UserCredential[]>>;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
}

const UserList = (props: UserListProps) => {
  const { wallet, credentials, setCredentials, setAddress, contractAddress } = props;

  // SBTと信用スコアを一覧として取得する(TODO: 実装予定)
  const fetchCredentials = async (): Promise<UserCredential[]> => {
    if (wallet == undefined) { return []; }

    // SBTによる会員証一覧を取得する(TODO: 実装予定)
    let newCredentials =  [
      { tokenId: 1, userName: 'Alice', address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', trustScore: 0.0 },
      { tokenId: 2, userName: 'Bob', address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', trustScore: 0.0 },
      { tokenId: 3, userName: 'Charlie', address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', trustScore: 0.0 },
    ];

    // 取得した会員証一覧を元に信用スコアを取得する
    const targetAddressList = newCredentials.map(credential => credential.address);
    const scores = await fetchScores(targetAddressList, wallet, contractAddress);

    // 信用スコアをSBTにマージする
    newCredentials = newCredentials.map((credential, index) => ({
      ...credential,
      trustScore: scores.targetScores[index] || 0.0,
    }));

    return newCredentials;
  }

  useEffect(() => {
    if (credentials.length > 0) { return; } // 既に取得済みなら再取得しない
    const initCredentials = async () => {
      const userCredentials = await fetchCredentials();
      setCredentials(userCredentials);
    };
    initCredentials();
  }, []);

  return (
    <section className="my-4">
      <Text fw={700} size="lg" className="mb-2">ユーザー一覧</Text>
      <div className="flex flex-col gap-4">
        {credentials.map((credential, i) => (
          <Card shadow="sm" padding="md" radius="md" key={i} className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <Text fw={700} size="md">{credential.userName}</Text>
              <div className="flex flex-col items-center">
                <Text size="sm" fw={700}>人気度</Text>
                <RingProgress
                  size={60}
                  thickness={6}
                  sections={[{ value: credential.trustScore / 100, color: 'blue' }]}
                  label={<Text size="sm" fw={700}>{credential.trustScore.toFixed(3)}</Text>}
                />
              </div>
            </div>
            <Text size="sm" className="mb-2">アドレス：<br />{credential.address}</Text>
            <Button color="dark" className="w-32 self-end" onClick={() => setAddress(credential.address)}>選択する</Button>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default UserList;
