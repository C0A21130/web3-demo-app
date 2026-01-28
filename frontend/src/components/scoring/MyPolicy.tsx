import { useEffect, useState } from 'react';
import { Paper, Text, Flex, Button, Switch, Table, NativeSelect } from '@mantine/core';
import { IconLockCheck } from '@tabler/icons-react';
import { Wallet, HDNodeWallet } from 'ethers';
import fetchPolicy from './fetchPolicy';
import configPolicy from './configPolicy';

type MyPolicyProps = {
  hidden: boolean;
  wallet: Wallet | HDNodeWallet | undefined;
  contractAddress: string;
}

const policies = [
  { label: "自身より信用度の高いユーザー", allowList: [1, 2] },
  { label: "過去の取引履歴のあるユーザー", allowList: [2] },
  { label: "取引相手の信用度が自身と平均値より高いユーザー", allowList: [3] },
];

const MyPolicy = (props: MyPolicyProps) => {
  const { hidden, wallet, contractAddress } = props;
  const [policy, setPolicy] = useState<number>(0);
  const [policyLoaded, setPolicyLoaded] = useState<"ポリシーを設定する" | "ポリシーを設定中" | "ポリシーが設定されました">("ポリシーを設定する");

  const loadPolicy = async () => {
    if (wallet == undefined) { return; }
    const fetchedPolicy = await fetchPolicy(wallet, contractAddress);
    setPolicy(fetchedPolicy);
  }

  // ポリシー変更ボタンが押されたときに実行される関数
  const handleConfigPolicy = async () => {
    if (wallet == undefined) { return; }
    setPolicyLoaded("ポリシーを設定中");
    const result = await configPolicy(wallet, policy, contractAddress);
    if (result) {
      setPolicyLoaded("ポリシーが設定されました");
    } else {
      setPolicyLoaded("ポリシーを設定する");
    }
  }

  useEffect(() => {
    loadPolicy();
  }, [wallet]);

  return (
    <Paper shadow="sm" withBorder className="p-4 mt-6" hidden={hidden}>
      <div className='flex items-center'>
        <IconLockCheck size={24} />
        <Text size="lg">取引制限</Text>
      </div>
      <Flex direction="column" align="flex-start" className='mt-4' gap="md">
        <Switch
          checked={policy !== 0}
          label="取引制限を有効化"
          onChange={(e) => setPolicy(e.currentTarget.checked ? 2 : 0)}
        />
        {policy != 0 && <NativeSelect
          value={policy.toString()}
          label="取引制限ポリシーを選択"
          description="取引相手のスコアが低くても過去取引履歴があるユーザーとの取引を許可します"
          onChange={(event) => setPolicy(Number(event.currentTarget.value))}
          data={[
            { label: "自身より高いスコアのユーザーのみ許可", value: "1" },
            { label: "取引履歴から許可", value: "2" },
            { label: "高信頼ユーザーのみ許可", value: "3" },
            { label: "全ての取引を拒否", value: "4" }
          ]}
        />}
      </Flex>
      {policy !== 0 && <Flex direction="column" className='mt-4'>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ポリシー値</Table.Th>
              <Table.Th>説明</Table.Th>
            </Table.Tr>
          </Table.Thead>
          {policy !== 4 && <Table.Tbody>
            {policies.map((p, index) => (
              <Table.Tr key={index}>
                <Table.Td>{p.allowList.includes(policy) ? "許可" : "ー"}</Table.Td>
                <Table.Td>{p.label}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>}
          {policy == 4 &&<Table.Tbody>
            <Table.Tr>
              <Table.Td>拒否</Table.Td>
              <Table.Td>全ての取引</Table.Td>
            </Table.Tr>
          </Table.Tbody>}
        </Table>
        <Button
          fullWidth
          variant="filled"
          color={wallet == undefined ? "gray" : "dark"}
          onClick={() => handleConfigPolicy()}
          className='mt-6'
        >
          {policyLoaded}
        </Button>
      </Flex>}
    </Paper>
  );
}

export default MyPolicy;
