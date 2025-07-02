import { useState } from 'react';
import { BrowserProvider } from 'ethers';
import { Group, Text, Paper, Container, Button, Table, TextInput, List } from '@mantine/core';
import fetchLogs from '../components/fetchLogs';
import postTransferLogs from '../components/postTransferLogs';
import { Wallet } from 'ethers';
import { JsonRpcSigner } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const Score = () => {
  const [wallet, setWallet] = useState<JsonRpcSigner>();
  const [address, setAddress] = useState<string>("0x0");
  const [contractAddress, setContractAddress] = useState<string>("0xF49af2D8DcaAc24035A2b35429873E4beeB6001E");
  const [transferLogs, setTransferLogs] = useState<TransferLog[]>([]);
  const [fetchStatus, setFetchStatus] = useState<"ログを取得する" | "ログ取得中" | "ログ取得完了" | "ログ取得エラー">("ログを取得する");
  const [postStatus, setPostStatus] = useState<"ログを送信する" | "ログを送信中" | "ログを送信完了" | "ログを送信エラー">("ログを送信する");

  // This function is called when the user clicks the "ウォレットを作成" button
  const createWallet = async () => {
    const provider = new BrowserProvider(window.ethereum);
    const wallet = await provider.getSigner();
    if (wallet == undefined) {
      console.error("ウォレットの作成に失敗しました");
      setAddress("blockchainError");
      return;
    }
    setWallet(wallet);
    setAddress(await wallet.getAddress());
  }

  // This function is called when the user clicks
  const clickFetchLogs = async () => {
    if (wallet == undefined) {
      console.error("ウォレットが接続されていません");
      return;
    }
    setFetchStatus("ログ取得中");
    const logs = await fetchLogs(contractAddress, wallet);
    if (logs.length === 0) {
      console.error("ログが取得できませんでした");
      setFetchStatus("ログ取得エラー");
      return;
    }
    setTransferLogs(logs);
    setFetchStatus("ログ取得完了");
  }

  // This function is called when the user clicks the "ログを送信" button
  const clickPostLogs = async () => {
    if (wallet == undefined) {
      console.error("ウォレットが接続されていません");
      return;
    }

    setPostStatus("ログを送信中");
    try {
      await postTransferLogs(contractAddress, transferLogs);
    } catch (error) {
      console.error("ログの送信に失敗しました", error);
      setPostStatus("ログを送信エラー");
      return;
    }
    setPostStatus("ログを送信完了");
  }

  return (
    <Container size="sm" className="mt-10">
      <Paper shadow="sm" withBorder className="p-4">
        <Text size="sm" color="dimmed">ウォレットアドレス:</Text>
        <Text size="sm" className="break-words">{address}</Text>
        <Group className="mt-3">
          <Button variant="outline" color={address == "0x0" ? "blue" : "gray"} onClick={() => createWallet()}>{address == "0x0" ? "ウォレットを作成" : "ウォレット接続済み"}</Button>
          <Button variant="outline" color={Wallet == undefined ? "gray" : "blue"} onClick={() => clickFetchLogs()}>{fetchStatus}</Button>
          <Button variant="outline" color={transferLogs.length > 1 ? "blue" : "gray"} onClick={() => clickPostLogs()}>{postStatus}</Button>
        </Group>
        <Group className="mt-3">
          <Text size="sm" color="dimmed">コントラクトアドレスを入力:</Text>
          <TextInput
            placeholder="0x0000000000000000000000000000000000000000"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.currentTarget.value)}
            className="w-full max-w-[300px]"
          />
        </Group>
        <Text size='sm'>Contract Address List</Text>
        <List type="ordered" className="mt-2" size="sm" spacing="xs">
          <List.Item>0xAAa87514287CF537fD600BFFdd2e2d65A3A73C3D [https://testnets.opensea.io/ja/collection/zombie-eth] 433</List.Item>
          <List.Item>0x32F4866B63CaDeD01058540Cff9Bb1fcC05E1cb7 [https://testnets.opensea.io/ja/collection/pokemonpackv1-2] 172</List.Item>
          <List.Item>0xF49af2D8DcaAc24035A2b35429873E4beeB6001E [https://testnets.opensea.io/ja/collection/dreamstack-7] 1</List.Item>
          <List.Item>0x76B50696B8EFFCA6Ee6Da7F6471110F334536321 [https://testnets.opensea.io/ja/collection/foundry-course-nft-6] 203</List.Item>
          <List.Item>0x6dBccC65133635D27AE56B7E3586b6e810d92082 [https://testnets.opensea.io/ja/collection/daffy-panda-ganging-up-1] 756</List.Item>
          <List.Item>0x0D48C738959d5a16108b475a8d0e98d9620BdEB8 [https://testnets.opensea.io/ja/collection/degenz-apes-club] 148</List.Item>
          <List.Item>0x50cA110B20FebEF46647c9bd68cAF848c56d9d03 [ありがトークン] 100</List.Item>
        </List>
        {transferLogs.length > 0 && (
          <div className="mt-6">
            <Text size="lg" className="mb-3">Transfer Logs 【Log Count {transferLogs.length}】</Text>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>From</Table.Th>
                  <Table.Th>To</Table.Th>
                  <Table.Th>Token ID</Table.Th>
                  <Table.Th>Block</Table.Th>
                  <Table.Th>Gas Price</Table.Th>
                  <Table.Th>Gas Used</Table.Th>
                  <Table.Th>Tx Hash</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {transferLogs.map((log, index) => (
                  <Table.Tr key={index}>
                    <Table.Td className="text-xs break-all max-w-[100px]">
                      {log.fromAddress.substring(0, 6)}...{log.fromAddress.substring(log.fromAddress.length - 4)}
                    </Table.Td>
                    <Table.Td className="text-xs break-all max-w-[100px]">
                      {log.toAddress.substring(0, 6)}...{log.toAddress.substring(log.toAddress.length - 4)}
                    </Table.Td>
                    <Table.Td>{log.tokenId}</Table.Td>
                    <Table.Td>{log.blockNumber}</Table.Td>
                    <Table.Td>{log.gasPrice?.toFixed(6) || 'N/A'}</Table.Td>
                    <Table.Td>{log.gasUsed?.toFixed(6) || 'N/A'}</Table.Td>
                    <Table.Td className="text-xs">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${log.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {log.txHash.substring(0, 6)}...{log.txHash.substring(log.txHash.length - 4)}
                      </a>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        )}
        
      </Paper>
    </Container>
  );
}

export default Score;
