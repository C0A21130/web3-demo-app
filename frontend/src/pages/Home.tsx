import { useState, useEffect, useContext } from 'react';
import { Card, Text, Group, Paper } from '@mantine/core';
import { Container } from '@mantine/core';
import { contractAddress, rpcUrls, rpcUrlIndexContext, walletContext } from '../App';
import fetchTokens from '../components/fetchTokens';

const Home = () => {
  const [wallet] = useContext(walletContext);
  const [rpcUrlIndex] = useContext(rpcUrlIndexContext);
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    const getTokens = async () => {
      const tokens = await fetchTokens(rpcUrls[rpcUrlIndex], wallet, contractAddress, "all");
      setTokens(tokens);
    }
    getTokens();
  }, []);

  // If the wallet is not connected, display a message
  if (tokens.length == 1 && tokens[0].tokenId == -1) {
    return (
      <Container size="sm" className="mt-10">
        <Paper shadow="sm" withBorder className='p-4'>
          <Text size="lg">ユーザー画面からRPC URLを変更してください</Text>
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
            <Text size="sm" style={{ lineHeight: 1.5 }}>
              トークンのオーナー: {token.owner}
            </Text>
            <Group className='mt-4'>
              <Text size="sm">{token.from} から</Text>
              <Text size="sm">{token.to} へ送られました</Text>
            </Group>
          </Card>
        ))}
      </Paper>
    </Container>
  );
};

export default Home;
