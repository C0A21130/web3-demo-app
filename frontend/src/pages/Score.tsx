import { useState } from 'react';
import { Wallet, JsonRpcSigner, BrowserProvider } from 'ethers';
import { Group, Text, Paper, Container, Button, Table, TextInput} from '@mantine/core';
import fetchTransferLogs from '../components/scoring/fetchTransferLogs';
import postTransferLogs from '../components/scoring/postTransferLogs';

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
    setTransferLogs([]);
    const logs = await fetchTransferLogs(contractAddress, wallet);
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

    if (fetchStatus !== "ログ取得完了" || transferLogs.length === 0) {
      console.error("ログが取得されていません");
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
          <Button variant="outline" color={address == "0x0" ? "blue" : "gray"} onClick={() => createWallet()}>{address == "0x0" ? "ウォレットを接続する" : "ウォレット接続済み"}</Button>
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
        {transferLogs.length > 0 && (
          <div className="mt-6">
            <Text size="lg" className="mb-3">Transfer Logs 【Log Count {transferLogs.length}】</Text>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>From</Table.Th>
                  <Table.Th>To</Table.Th>
                  <Table.Th>Token ID</Table.Th>
                  <Table.Th>Gas Price</Table.Th>
                  <Table.Th>Gas Used</Table.Th>
                  <Table.Th>TokenURI</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {transferLogs.slice(0, 100).map((log, index) => (
                  <Table.Tr key={index}>
                    <Table.Td className="text-xs break-all max-w-[100px]">
                      {log.fromAddress.substring(0, 6)}...{log.fromAddress.substring(log.fromAddress.length - 4)}
                    </Table.Td>
                    <Table.Td className="text-xs break-all max-w-[100px]">
                      {log.toAddress.substring(0, 6)}...{log.toAddress.substring(log.toAddress.length - 4)}
                    </Table.Td>
                    <Table.Td>{log.tokenId}</Table.Td>
                    <Table.Td>{log.gasPrice?.toFixed(6) || 'N/A'}</Table.Td>
                    <Table.Td>{log.gasUsed?.toFixed(6) || 'N/A'}</Table.Td>
                    <Table.Td className="text-xs break-all max-w-[100px]">
                      <a href={log.tokenURI} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {log.tokenURI.substring(0, 6)}...{log.tokenURI.substring(log.tokenURI.length - 4)}
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
