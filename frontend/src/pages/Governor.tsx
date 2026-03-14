import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text, Container, Stack, Paper, Alert, Textarea, Button, Title, Group, Divider } from '@mantine/core';
import { IconCheck, IconAlertCircle, IconCoins,} from '@tabler/icons-react';
import { create, KuboRPCClient } from 'kubo-rpc-client';
import { contractAddress, governanceContractAddress, governanceTokenContractAddress, walletContext, ipfsApiUrl } from '../App';
import ProposalList from '../components/govrenor/ProposalList';
import propose from '../components/govrenor/propose';
import mint from '../components/govrenor/mint';

const Governor = () => {
  const [wallet] = useContext(walletContext);
  const [proposalText, setProposalText] = useState('');
  const [ipfsClient, setIpfsClient] = useState<KuboRPCClient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [proposalUri, setProposalUri] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [mintMessage, setMintMessage] = useState('');
  const navigate = useNavigate();

  // ガバナンストークンを発行する関数
  const handleMint = async () => {
    if (!wallet) {
      setMintMessage('ウォレットが接続されていません');
      return;
    }

    setIsMinting(true);
    setMintMessage('');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await mint(wallet, governanceTokenContractAddress);
      
      if (result) {
        setSuccessMessage('ガバナンストークンを10トークン発行しました');
        setMintMessage('トークンの発行に成功しました。投票に参加できます。');
      } else {
        setMintMessage('トークンの発行に失敗しました。残高を確認してください。');
      }
    } catch (error) {
      console.error('Error minting tokens:', error);
      setMintMessage(error instanceof Error ? error.message : 'トークン発行中にエラーが発生しました');
    } finally {
      setIsMinting(false);
    }
  };

  // IPFSクライアントを初期化
  useEffect(() => {
    const initIpfs = async () => {
      try {
        const client = create({ url: `${ipfsApiUrl}:5001`, timeout: 3000 }) as KuboRPCClient;
        await client.id();
        setIpfsClient(client);
      } catch (error) {
        console.error("Error connecting to IPFS:", error);
        setErrorMessage("IPFSへの接続に失敗しました");
      }
    };

    initIpfs();
  }, []);

  // ウォレットチェック
  useEffect(() => {
    if (!wallet) {
      navigate('/user');
      return;
    }
  }, [wallet, navigate]);

  // 提案を作成する関数
  const handlePropose = async () => {
    if (!wallet) {
      setErrorMessage('ウォレットが接続されていません');
      return;
    }

    if (!proposalText.trim()) {
      setErrorMessage('提案の説明を入力してください');
      return;
    }

    if (!ipfsClient) {
      setErrorMessage('IPFSクライアントが初期化されていません');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    setProposalUri('');

    try {
      const uri = await propose({
        wallet: wallet,
        contractAddress: contractAddress,
        governorContractAddress: governanceContractAddress,
        ipfsApiUrl: ipfsApiUrl,
        client: ipfsClient,
        text: proposalText
      });

      if (uri) {
        setSuccessMessage('提案が正常に作成されました');
        setProposalUri(uri);
        setProposalText('');
      } else {
        setErrorMessage('提案の作成に失敗しました');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      setErrorMessage(error instanceof Error ? error.message : '提案の作成中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container size="sm" className="mt-10">
      <Paper shadow="sm" withBorder className='p-4'>
        {/* トークン発行セクション */}
        <div className='p-6'>
          <Group justify="space-between" mb="md">
            <Title order={2}>投票用トークンを受け取る</Title>
            <IconCoins size={32} />
          </Group>
          
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              提案の作成や投票を行うには、ガバナンストークンが必要です。
              ボタンをクリックして10トークンを受け取ってください。
            </Text>

            <Button
              onClick={handleMint}
              loading={isMinting}
              disabled={!wallet}
              leftSection={<IconCoins size={16} />}
              color="teal"
              fullWidth
            >
              ガバナンストークンを受け取る (10トークン)
            </Button>

            {mintMessage && (
              <Alert 
                icon={<IconAlertCircle size={16} />} 
                color={mintMessage.includes('成功') ? 'green' : 'yellow'}
              >
                {mintMessage}
              </Alert>
            )}
          </Stack>
        </div>

        <Divider my="md" />

        {/* 提案作成セクション */}
        <div className='p-6'>
          <Title order={2} mb="lg">提案を作成</Title>
          
          <Stack gap="md">
            <Textarea
              label="提案の説明"
              placeholder="提案の内容を入力してください..."
              value={proposalText}
              onChange={(event) => setProposalText(event.currentTarget.value)}
              minRows={4}
              maxRows={8}
              disabled={isSubmitting}
              required
            />

            <Button
              onClick={handlePropose}
              loading={isSubmitting}
              disabled={!wallet || !ipfsClient || !proposalText.trim()}
              fullWidth
            >
              提案を作成
            </Button>

            {errorMessage && (
              <Alert icon={<IconAlertCircle size={16} />} title="エラー" color="red">
                {errorMessage}
              </Alert>
            )}

            {successMessage && (
              <Alert icon={<IconCheck size={16} />} title="成功" color="green">
                <Stack gap="xs">
                  <Text>{successMessage}</Text>
                  {proposalUri && (
                    <Text size="sm" c="dimmed">
                      URI: {proposalUri}
                    </Text>
                  )}
                </Stack>
              </Alert>
            )}

            {!ipfsClient && !errorMessage && (
              <Alert icon={<IconAlertCircle size={16} />} title="接続中" color="blue">
                IPFSに接続中...
              </Alert>
            )}
          </Stack>
        </div>

        <ProposalList wallet={wallet} />

        <Divider my="md" />
      </Paper>
    </Container>
  );
};

export default Governor;
