import { useEffect, useState } from 'react';
import { Paper, Text, TextInput, Button, Flex, Alert } from '@mantine/core';
import { IconCreditCard } from '@tabler/icons-react';
import { Wallet, HDNodeWallet } from 'ethers';
import { fetchCredential } from './fetchCredential';
import { issueCredential } from './issueCredential';
import fetchScores from '../scoring/fetchScores';

interface MyCredentialProps {
  hidden: boolean;
  wallet: Wallet | HDNodeWallet | undefined;
  contractAddress: string;
  credentialContractAddress: string;
}

const MyCredential = (props: MyCredentialProps) => {
  const { hidden, wallet, contractAddress, credentialContractAddress } = props;
  const [credential, setCredential] = useState<UserCredential>();
  const [inputUserName, setInputUserName] = useState<string>("");
  const [credentialStatus, setCredentialStatus] = useState<"会員証を発行する" | "会員証を発行中" | "会員証の発行完了" | "会員証の発行に失敗">("会員証を発行する");

  // 会員証の情報を取得する関数
  const initCredential = async () => {
    if (wallet == undefined) { return; }

    // 会員証を取得する処理
    const credentials = await fetchCredential(wallet, credentialContractAddress);
    const myCredential = credentials.find((cred) => cred.address.toLowerCase() === wallet.address.toLowerCase());
    if (!myCredential) { return; }

    // 信用スコアを取得する処理
    const scores = await fetchScores([], wallet, contractAddress);
    myCredential.trustScore = scores.myScore;

    setCredential(myCredential);
    setCredentialStatus("会員証の発行完了");
  }

  // 会員証を発行するボタンがクリックされたときの処理
  const handleIssueCredential = async () => {
    setCredentialStatus("会員証を発行中");
    if (wallet == undefined) {
      setCredentialStatus("会員証の発行に失敗");
      return;
    }

    // 会員証を発行する
    try {
      await issueCredential(wallet, credentialContractAddress, inputUserName);
      setCredentialStatus("会員証の発行完了");
    } catch (error) {
      console.error("会員証の発行に失敗:", error);
      setCredentialStatus("会員証の発行に失敗");
      return;
    }
    await initCredential();
  }

  useEffect(() => {
    initCredential();
  }, [wallet]);

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
          placeholder="登録するユーザー名を入力してください"
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
      <Alert title="会員証の発行に失敗" color="red" className="mt-4" hidden={credentialStatus !== "会員証の発行に失敗"}>
        会員証の発行に失敗しました。ユーザー名を入力・変更してもう一度お試しください。
      </Alert>
    </Paper>
  );
}

export default MyCredential;
