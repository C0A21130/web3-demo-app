import { useState, useEffect, useContext } from 'react';
import { Card, Text, Group } from '@mantine/core';
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

  // If there are no tokens, display a message
  if(tokens.length == 0) {
    return (
      <div className='mt-12'>
        <Container className="mt-4">
          <Card shadow="sm" padding="lg" className="mb-4">
            <Text size="lg">No tokens found</Text>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className='mt-12'>
      <Container className="mt-4">
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
      </Container>
    </div>
  );
};

export default Home;
