import { useState, useEffect } from 'react';
import { Wallet, HDNodeWallet } from 'ethers';
import { Text, Stack,  Alert, Button, Title, Badge, Group, Card, Loader } from '@mantine/core';
import { IconAlertCircle, IconThumbUp, IconThumbDown, IconMinus, IconRocket } from '@tabler/icons-react';
import { governanceContractAddress } from '../../App';
import fetchProposals from './fetchProposals';
import vote from './vote';
import execute from './execute';

type ProposalListProps = {
  wallet: Wallet | HDNodeWallet | undefined;
};

type ProposeContent = {
  proposalId: bigint;
  proposalUri: string;
  target: string;
  text: string;
  data: string;
  descriptionHash: string;
  state: bigint;
};

const ProposalList = (props: ProposalListProps) => {
  const { wallet } = props;
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [proposals, setProposals] = useState<ProposeContent[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(false);
  const [votingProposalId, setVotingProposalId] = useState<bigint | null>(null);
  const [executingProposalId, setExecutingProposalId] = useState<bigint | null>(null);

  // 提案の状態を表示用の文字列に変換
  const getProposalStateText = (state: bigint): string => {
    const stateMap: { [key: string]: string } = {
      '0': 'Pending',
      '1': 'Active',
      '2': 'Canceled',
      '3': 'Defeated',
      '4': 'Succeeded',
      '5': 'Queued',
      '6': 'Expired',
      '7': 'Executed'
    };
    return stateMap[state.toString()] || 'Unknown';
  };

  // 提案の状態に応じたバッジのカラーを取得
  const getProposalStateColor = (state: bigint): string => {
    const stateColorMap: { [key: string]: string } = {
      '0': 'gray',    // Pending
      '1': 'blue',    // Active
      '2': 'red',     // Canceled
      '3': 'red',     // Defeated
      '4': 'green',   // Succeeded
      '5': 'cyan',    // Queued
      '6': 'orange',  // Expired
      '7': 'teal'     // Executed
    };
    return stateColorMap[state.toString()] || 'gray';
  };

  // 提案一覧を取得
  const loadProposals = async () => {
    if (!wallet) return;

    setIsLoadingProposals(true);
    try {
      const proposalList = await fetchProposals(wallet, governanceContractAddress);

      setProposals(proposalList);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      setErrorMessage('提案一覧の取得に失敗しました');
    } finally {
      setIsLoadingProposals(false);
    }
  };

  // 提案を実行する関数
  const handleExecute = async (proposal: ProposeContent) => {
    if (!wallet) {
      setErrorMessage('ウォレットが接続されていません');
      return;
    }

    setExecutingProposalId(proposal.proposalId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const result = await execute(wallet, governanceContractAddress, proposal);
      
      if (result) {
        setSuccessMessage('提案が正常に実行されました');
        // 提案一覧を再取得
        await loadProposals();
      } else {
        setErrorMessage('提案の実行に失敗しました');
      }
    } catch (error) {
      console.error('Error executing proposal:', error);
      setErrorMessage(error instanceof Error ? error.message : '提案実行中にエラーが発生しました');
    } finally {
      setExecutingProposalId(null);
    }
  };

  // 投票を実行
  const handleVote = async (proposalId: bigint, support: 0 | 1 | 2) => {
    if (!wallet) {
      setErrorMessage('ウォレットが接続されていません');
      return;
    }

    setVotingProposalId(proposalId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await vote(wallet, governanceContractAddress, proposalId, support);
      setSuccessMessage('投票が正常に完了しました');
      // 提案一覧を再取得
      await loadProposals();
    } catch (error) {
      console.error('Error voting:', error);
      setErrorMessage(error instanceof Error ? error.message : '投票中にエラーが発生しました');
    } finally {
      setVotingProposalId(null);
    }
  };

  // 初回読み込み
  useEffect(() => {
    loadProposals();
  }, [wallet]);

  return (
    <div className='p-6'>
      <Group justify="space-between" mb="lg">
        <Title order={2}>提案一覧</Title>
        <Button
          onClick={loadProposals}
          loading={isLoadingProposals}
          variant="light"
          size="sm"
        >
          更新
        </Button>
      </Group>
      <div>
        {errorMessage && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md">
            {errorMessage}
          </Alert>
        )}
        {successMessage && (
          <Alert icon={<IconAlertCircle size={16} />} color="green" mb="md">
            {successMessage}
          </Alert>
        )}
      </div>
      {
        isLoadingProposals && proposals.length === 0 ? (
          <Group justify="center" p="xl">
            <Loader size="lg" />
          </Group>
        ) : proposals.length === 0 ? (
          <Alert icon={<IconAlertCircle size={16} />} color="gray">
            提案がまだありません
          </Alert>
        ) : (
        <Stack gap="md">
          {proposals.map((proposal) => (
            <Card key={proposal.proposalId.toString()} shadow="sm" padding="lg" withBorder>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={500} size="sm" c="dimmed">
                    提案ID: {proposal.proposalId.toString()}
                  </Text>
                  <Badge color={getProposalStateColor(proposal.state)}>
                    {getProposalStateText(proposal.state)}
                  </Badge>
                </Group>

                <Text fw={600} size="lg">
                  {proposal.text || '説明なし'}
                </Text>

                {proposal.proposalUri && (
                  <Text size="xs" c="dimmed" truncate>
                    URI: {proposal.proposalUri}
                  </Text>
                )}

                {/* 投票が可能な場合のみボタンを表示 (Active状態) */}
                {proposal.state === 1n && (
                  <Group gap="xs" mt="sm">
                    <Button
                      leftSection={<IconThumbUp size={16} />}
                      color="green"
                      onClick={() => handleVote(proposal.proposalId, 1)}
                      loading={votingProposalId === proposal.proposalId}
                      disabled={votingProposalId !== null}
                      size="sm"
                    >
                      賛成
                    </Button>
                    <Button
                      leftSection={<IconThumbDown size={16} />}
                      color="red"
                      onClick={() => handleVote(proposal.proposalId, 0)}
                      loading={votingProposalId === proposal.proposalId}
                      disabled={votingProposalId !== null}
                      size="sm"
                    >
                      反対
                    </Button>
                    <Button
                      leftSection={<IconMinus size={16} />}
                      color="gray"
                      onClick={() => handleVote(proposal.proposalId, 2)}
                      loading={votingProposalId === proposal.proposalId}
                      disabled={votingProposalId !== null}
                      size="sm"
                    >
                      棄権
                    </Button>
                  </Group>
                )}

                {/* 提案が成功した場合に実行ボタンを表示 (Succeeded状態) */}
                {proposal.state === 4n && (
                  <Group gap="xs" mt="sm">
                    <Button
                      leftSection={<IconRocket size={16} />}
                      color="teal"
                      onClick={() => handleExecute(proposal)}
                      loading={executingProposalId === proposal.proposalId}
                      disabled={executingProposalId !== null}
                      size="sm"
                      fullWidth
                    >
                      提案を実行
                    </Button>
                  </Group>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </div >
  );
};

export default ProposalList;
