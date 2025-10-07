import { useEffect, useState } from 'react';
import { Paper, Text, TextInput, Button, Flex, Alert } from '@mantine/core';
import { IconCreditCard } from '@tabler/icons-react';
import { Wallet, HDNodeWallet } from 'ethers';

interface DisplayCredentialProps {
  hidden: boolean;
  wallet: Wallet | HDNodeWallet | undefined;
  contractAddress: string;
}

const DisplayCredential = (props: DisplayCredentialProps) => {
  const { hidden, wallet, contractAddress } = props;
  const [credentialId, setCredentialId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [trustScore, setTrustScore] = useState<number>(0);
  const [credentialStatus, setCredentialStatus] = useState<"会員証を発行する" | "会員証を発行中" | "会員証の発行完了" | "会員証の発行に失敗">("会員証を発行する");

  // 会員証の情報を取得する関数
  const initCredential = async () => {
    // 会員証を取得する処理

    // 信用スコアを取得する処理

    setCredentialId("1234567890");
    setUserName("exampleUser");
    setTrustScore(85);
  }

  // 会員証を発行するボタンがクリックされたときの処理
  const handleIssueCredential = async () => {
    setCredentialStatus("会員証を発行中");
    if (wallet == undefined) {
      setCredentialStatus("会員証の発行に失敗");
      return;
    }
    // 会員証を発行する処理

    setCredentialStatus("会員証の発行完了");
    await initCredential();
  }

  useEffect(() => {
    if (credentialStatus === "会員証を発行する" && wallet !== undefined) {
      initCredential();
    }
  }, []);

  return (
    <Paper shadow="sm" withBorder className="p-4 mt-6" hidden={hidden}>
      <div className='flex items-center'>
        <IconCreditCard size={24} />
        <Text size="lg">会員証</Text>
      </div>
      <Flex direction="column" className="mt-3" hidden={credentialStatus === "会員証の発行完了"}>
        <Text size="sm" mb={2} className='mt-2'>
          会員証の発行
        </Text>
        <TextInput
          placeholder="ユーザー名"
          className="mb-4"
          value={userName}
          onChange={(event) => setUserName(event.currentTarget.value)}
        />
        <Button
          fullWidth
          variant="filled"
          color={wallet == undefined ? "gray" : "dark"}
          onClick={() => handleIssueCredential()}
        >
          {credentialStatus}
        </Button>
      </Flex>
      <Flex direction="column" className="mt-3" hidden={credentialStatus !== "会員証の発行完了"}>
        <Text size="sm" color="dimmed">会員証 {credentialId}</Text>
        <Text size="sm" color="dimmed">ユーザー名: {userName}</Text>
        <Text size="sm" className="break-words mb-3">信用スコア: {trustScore}</Text>
      </Flex>
      <Alert title="会員証が発行されていません" color="yellow" className="mt-4" hidden={credentialStatus === "会員証の発行完了"}>
        会員証を発行することでありがトークンを受け取りやすくなります
      </Alert>
    </Paper>
  );
}

export default DisplayCredential;
