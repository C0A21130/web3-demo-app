import { Wallet, HDNodeWallet } from 'ethers';
import { Card, Button, Text, RingProgress } from '@mantine/core';
import { useEffect } from 'react';
import fetchCredential from '../credential/fetchCredential';

interface UserListProps {
  wallet: Wallet | HDNodeWallet | undefined;
  contractAddress: string;
  credentials: UserCredential[];
  setCredentials: React.Dispatch<React.SetStateAction<UserCredential[]>>;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
}

const UserList = (props: UserListProps) => {
  const { wallet, contractAddress, credentials, setCredentials, setAddress } = props;

  // SBTと信用スコアを一覧として取得する(TODO: 実装予定)
  const fetchCredentials = async (): Promise<void> => {
    // SBTによる会員証一覧を取得する
    if (wallet == undefined) { return; }
    let newCredentials =  await fetchCredential(wallet, contractAddress);

    // 取得した会員証一覧を元に信用スコアを取得する(TODO: 実装予定)
    const targetAddressList = newCredentials.map(credential => credential.address);
    const scores = {
      myScore: 85.5,
      targetScores: [90.0, 75.3, 60.8],
    }

    // 信用スコアをSBTにマージする
    newCredentials = newCredentials.map((credential, index) => ({
      ...credential,
      trustScore: scores.targetScores[index] || 0.0,
    }));

    setCredentials(newCredentials);
  }

  useEffect(() => {
    fetchCredentials();
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
