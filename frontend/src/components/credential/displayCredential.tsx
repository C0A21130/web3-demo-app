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
  const [credential, setCredential] = useState<UserCredential>();
  const [inputUserName, setInputUserName] = useState<string>("");
  const [credentialStatus, setCredentialStatus] = useState<"会員証を発行する" | "会員証を発行中" | "会員証の発行完了" | "会員証の発行に失敗">("会員証を発行する");

  // 会員証の情報を取得する関数
  const initCredential = async () => {
    // 会員証を取得する処理(TODO: 実装予定)
    const fetchCredential: UserCredential = {
      tokenId: 1,
      userName: inputUserName,
      address: wallet?.address || "0x0000000000000000000000",
      trustScore: 0.0
    };

    // 信用スコアを取得する処理(TODO: 実装予定)
    const scores = {myScore: 85, targetScores: []};
    fetchCredential.trustScore = scores.myScore;

    setCredential(fetchCredential);
  }

  // 会員証を発行するボタンがクリックされたときの処理(TODO: 実装予定)
  const handleIssueCredential = async () => {
    setCredentialStatus("会員証を発行中");
    if (wallet == undefined) {
      setCredentialStatus("会員証の発行に失敗");
      return;
    }
    try {
      // ここに会員証発行のロジックを実装
      setCredentialStatus("会員証の発行完了");
    } catch (error) {
      console.error("会員証の発行に失敗:", error);
      setCredentialStatus("会員証の発行に失敗");
      return;
    }
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
        <Text size="lg">My会員証</Text>
      </div>
      <Flex direction="column" className="mt-3" hidden={credentialStatus === "会員証の発行完了"}>
        <Text size="sm" mb={2} className='mt-2'>
          会員証の発行
        </Text>
        <TextInput
          placeholder="ユーザー名"
          className="mb-4"
          value={inputUserName}
          onChange={(event) => setInputUserName(event.currentTarget.value)}
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
        <Text size="sm" color="dimmed">会員証 {credential?.tokenId}</Text>
        <Text size="sm" color="dimmed">ユーザー名: {credential?.userName}</Text>
        <Text size="sm" className="break-words mb-3">信用スコア: {credential?.trustScore}</Text>
      </Flex>
      <Alert title="会員証が発行されていません" color="yellow" className="mt-4" hidden={credentialStatus === "会員証の発行完了"}>
        会員証を発行することでありがトークンを受け取りやすくなります
      </Alert>
    </Paper>
  );
}

export default DisplayCredential;
