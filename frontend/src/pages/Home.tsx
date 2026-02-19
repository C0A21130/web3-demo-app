import { useState, useEffect, useContext } from 'react';
import { Text, Container, Group, Stack, Paper, Alert, Badge } from '@mantine/core';
import { IconGiftCard } from '@tabler/icons-react';
import { contractAddress, rpcUrls, rpcUrlIndexContext, walletContext } from '../App';
import fetchTokens from '../components/token/fetchTokens';

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

  // もしエラーが発生している場合
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

  // トークンが存在しない場合
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
        <div className="flex items-center mb-4">
          <IconGiftCard size={24} />
          <Text size="xl" className="ml-4">発行済みトークン一覧</Text>
        </div>
        {tokens?.map((token, index) => (
          <div key={index} className="my-4">
            <Group style={{ marginBottom: 5, marginTop: 10 }} justify="space-between">
              <Text size="lg" fw={700}>{token.name} #{token.tokenId}</Text>
              {wallet && token.owner.toLowerCase() === wallet.address.toLowerCase() && (
                <Badge color="green">保有中</Badge>
              )}
            </Group>
            {token.imageUrl && <Stack>
              <Text size="sm">{token.description}</Text>
              <img src={token.imageUrl != null ? token.imageUrl : '/no-image.png'} alt="Token Image" style={{ maxWidth: '200px', marginTop: '10px' }} />
            </Stack>}
            <Stack gap="xs">
              <div>
                <Text size="xs" c="dimmed">オーナー</Text>
                <Text size="sm" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{token.owner}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">送信元</Text>
                <Text size="sm" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}>{token.from}</Text>
              </div>
            </Stack>
          </div>
        ))}
      </Paper>
    </Container>
  );
};

export default Home;
