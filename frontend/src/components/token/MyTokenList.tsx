import { useState, useEffect } from 'react';
import { Wallet, HDNodeWallet } from 'ethers';
import { Text, Group, Paper, Badge } from '@mantine/core';
import { IconGiftCard } from '@tabler/icons-react';
import fetchTokens from './fetchTokens';

interface MyTokenListProps {
  hidden: boolean;
  rpcUrl: string;
  wallet: Wallet | HDNodeWallet | undefined;
  contractAddress: string;
}

const MyTokenList = (props: MyTokenListProps) => {
  const { hidden, rpcUrl, wallet, contractAddress } = props;
  const [tokens, setTokens] = useState<Token[]>([]);

  // 受け取ったトークン一覧を取得
  const getTokens = async () => {
    const [tokens] = await fetchTokens(rpcUrl, wallet, contractAddress, "receive");
    setTokens(tokens);
  };

  useEffect(() => {
    getTokens();
  }, [wallet]);

  // トークンが存在しない場合
  if (tokens.length === 0) {
    return (
      <Paper hidden={hidden} shadow="sm" withBorder className='p-4 mt-6'>
        <div className="flex items-center mb-4">
          <IconGiftCard size={24} />
          <Text size="lg">保有トークン</Text>
        </div>
        <Text size="sm" className="mt-4">
          保有しているトークンはありません
        </Text>
      </Paper>
    );
  }

  return (
    <Paper hidden={hidden} shadow="sm" withBorder className='p-4 mt-6'>
      <Group className="flex mb-4" justify="space-between" align='flex-start'>
        <div className="flex items-center">
          <IconGiftCard size={24} />
          <Text size="lg">保有トークン</Text>
        </div>
        <Badge color="blue">{tokens.length}件</Badge>
      </Group>

      {tokens.map((token, index) => (
        <div key={index} className="my-4">
          <Group style={{ marginBottom: 5, marginTop: 10 }} justify="space-between">
            <Text size="lg" fw={700}>{token.name} #{token.tokenId}</Text>
          </Group>
          
          {token.description && (
            <Text size="sm" className="mt-2">{token.description}</Text>
          )}
          
          <Group>
            <div>
              <Text size="xs" c="dimmed">送信元</Text>
              <Text size="sm" style={{wordBreak: "break-all"}}>{token.from}</Text>
            </div>
          </Group>
          
          {token.imageUrl && (
            <img 
              src={token.imageUrl} 
              alt={`${token.name} Image`} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '300px',
                marginTop: '16px',
                borderRadius: '8px',
                objectFit: 'contain'
              }} 
            />
          )}
        </div>
      ))}
    </Paper>
  );
};

export default MyTokenList;
