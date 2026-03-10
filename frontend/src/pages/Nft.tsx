import { useContext, useEffect, useState } from 'react';
import { Container, Paper, Text, Group, TextInput, Button, Card, Alert } from '@mantine/core';
import { contractAddress, rpcUrlIndexContext, rpcUrls, walletContext } from '../App';
import getWallet from '../components/getWallet';
import { getOwnerAddressByTokenId } from '../components/getOwnerAddress';
import putToken from '../components/token/putToken';

const Nft = () => {
  const [wallet, setWallet] = useContext(walletContext);
  const [, setRpcUrlIndex] = useContext(rpcUrlIndexContext);
  const [tokenName, setTokenName] = useState('');
  const [tokenId, setTokenId] = useState(0);
  const [owner, setOwner] = useState('0x0');
  const [mintStatus, setMintStatus] = useState<'発行する' | '発行中' | '発行完了' | '発行失敗'>('発行する');
  const [errorMessage, setErrorMessage] = useState('');
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    setConnecting(true);
    setErrorMessage('');
    try {
      const result = await getWallet(rpcUrls, localStorage);
      setWallet(result.wallet);
      setRpcUrlIndex(result.rpcUrlIndex);
      if (result.rpcUrlIndex === -1) {
        setErrorMessage('ブロックチェーンに接続できません。Hardhat Nodeが起動しているか確認してください。');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ウォレット接続に失敗しました');
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    if (!wallet) {
      connectWallet();
    }
  }, [wallet]);

  const handleMint = async () => {
    if (!wallet || mintStatus === '発行中') {
      return;
    }

    setErrorMessage('');
    setMintStatus('発行中');

    try {
      const txReceipt = await putToken({
        wallet,
        contractAddress,
        name: tokenName,
        description: null,
        image: null,
        client: null,
        ipfsApiUrl: null,
      });

      const mintedTokenIdFromLog = txReceipt.logs?.[0]?.args?.[2];
      const mintedTokenId = typeof mintedTokenIdFromLog === 'bigint'
        ? mintedTokenIdFromLog
        : BigInt(tokenId);

      const fetchedOwner = await getOwnerAddressByTokenId(contractAddress, mintedTokenId, {
        getRunner: () => wallet,
      });

      setOwner(fetchedOwner);
      setTokenId((prev) => prev + 1);
      setMintStatus('発行完了');
    } catch (error) {
      setMintStatus('発行失敗');
      setErrorMessage(error instanceof Error ? error.message : 'NFT発行に失敗しました');
    }
  };

  return (
    <Container size="sm" className="mt-10">
      <Paper shadow="sm" withBorder className="p-4">
        <Text size="xl">NFT管理</Text>

        <Group className="mt-3" align="end">
          <TextInput
            label="トークン名"
            placeholder="例: Thanks Token"
            value={tokenName}
            onChange={(event) => setTokenName(event.target.value)}
            className="flex-1"
          />
          <Button variant="filled" color="blue" onClick={handleMint} disabled={!wallet || tokenName.trim() === ''}>
            {mintStatus}
          </Button>
        </Group>
        <Alert title="注意" color="yellow" className="mt-3" hidden={!!wallet}>
          ウォレットが未接続です。以下のボタンで接続してください。
          <Button variant="light" color="yellow" className="mt-2" onClick={connectWallet} loading={connecting}>
            ウォレット接続
          </Button>
        </Alert>
        <Alert title="エラー" color="red" className="mt-3" hidden={errorMessage === ''}>
          {errorMessage}
        </Alert>

        <Text size="lg" className="mt-6">トークン表示</Text>
        <Card withBorder className="mt-2">
          <Text size="md">トークン名: {tokenName === '' ? '未入力' : tokenName}</Text>
          <Text size="md">トークンID: {tokenId}</Text>
          <Text size="sm" className="break-words">オーナー: {owner}</Text>
        </Card>
      </Paper>
    </Container>
  );
};

export default Nft;
