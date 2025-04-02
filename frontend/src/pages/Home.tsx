import { useState, useEffect, useContext } from 'react';
import { Card, Text, Group } from '@mantine/core';
import { Container } from '@mantine/core';
import { walletContext } from '../App';
import fetchTokens from '../components/fetchTokens';

const Home = () => {
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const [wallet] = useContext(walletContext);
  const [tokens, setTokens] = useState<Token[]>([]);

  useEffect(() => {
    const getTokens = async () => {
      if (wallet == undefined) { return; }
      const tokens = await fetchTokens(wallet, contractAddress, "all");
      setTokens(tokens);
    }
    getTokens();
  }, []);

  // If the wallet is not connected, display a message
  if(wallet == undefined) {
    return (
      <div className='mt-12'>
        <Container className="mt-4">
          <Card shadow="sm" padding="lg" className="mb-4">
            <Text size="lg">Please Connect Wallet</Text>
          </Card>
        </Container>
      </div>
    );
  }

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
              Address: {token.owner}
            </Text>
          </Card>
        ))}
      </Container>
    </div>
  );
};

export default Home;
