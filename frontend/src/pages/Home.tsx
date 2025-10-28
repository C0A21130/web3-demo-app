import { useState, useEffect, useContext } from 'react';
import { Card, Text, Group, Paper, Alert } from '@mantine/core';
import { Container } from '@mantine/core';
import { contractAddress, rpcUrls, rpcUrlIndexContext, walletContext } from '../App';
import fetchTokens from '../components/fetchTokens';

const Home = () => {
  const [wallet] = useContext(walletContext);
  const [rpcUrlIndex] = useContext(rpcUrlIndexContext);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [statusCode, setStatusCode] = useState<number>(0);

  useEffect(() => {
    const getTokens = async () => {
      const [tokens, code] = await fetchTokens(rpcUrls[rpcUrlIndex], wallet, contractAddress, "all");
      setTokens(tokens);
      setStatusCode(code);
    }
    getTokens();
  }, []);

  // If the wallet is not connected, display a message
  if (statusCode != 0) {
    return (
      <Container size="sm" className="mt-10">
        <Paper shadow="sm" withBorder className='p-4'>
          <Text size="lg">エラー</Text>
          <Alert title="注意" color="red" className="mt-4">
            {statusCode == -1 ? "ユーザー画面からRPC URLを変更してください" : "スマートコントラクトが存在しません"}
          </Alert>
        </Paper>
      </Container>
    );
  }

  // If there are no tokens, display a message
  if(tokens.length == 0) {
    return (
      <Container size="sm" className="mt-10">
        <Paper shadow="sm" withBorder className='p-4'>
          <Text size="lg">トークンが未発行です</Text>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="sm" className="mt-10">
      <Paper shadow="sm" withBorder className='p-4'>
        <Text size="xl" className="mb-4">トークン一覧</Text>
        {tokens?.map((token, index) => (
          <Card key={index} shadow="sm" padding="lg" className="mb-4">
            <Group style={{ marginBottom: 5, marginTop: 10 }}>
              <Text size="lg">{token.name} #{token.tokenId}</Text>
            </Group>
            <Text size="sm">{token.description}</Text>
            <Text size="sm" style={{ lineHeight: 1.5 }}>
              トークンのオーナー: {token.owner}
            </Text>
            <Group className='mt-4'>
              <Text size="sm">{token.from} から</Text>
              <Text size="sm">{token.to} へ送られました</Text>
              <img hidden={token.imageUrl == null} src={token.imageUrl != null ? token.imageUrl : '/no-image.png'} alt="Token Image" style={{ maxWidth: '200px', marginTop: '10px' }} />
            </Group>
          </Card>
        ))}
      </Paper>
    </Container>
  );
};

export default Home;
