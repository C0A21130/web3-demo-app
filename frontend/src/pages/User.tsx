import { useContext, useEffect, useState } from 'react';
import { formatEther, Wallet } from 'ethers';
import { Flex, Group, Text, Paper, Container, Button, TextInput } from '@mantine/core';
import { rpcUrl, contractAddress, walletContext } from '../App';
import getWallet from '../components/getWallet';
import transferEther  from '../components/transferEther';
import configUser from '../components/configUser';

const User = () => {
  const [wallet, setWallet] = useContext(walletContext);
  const [address, setAddress] = useState<string>("0x0");
  const [balance, setBalance] = useState<string>("0.0");
  const [userName, setUserName] = useState<string>("");
  const [receivedEthStatus, setReceivedEthStatus] = useState<"ETHを受け取る" | "ETHを受け取り中" | "ETHを受け取り完了" | "ETHの受け取りに失敗">("ETHを受け取る");
  const [configUserStatus, setConfigUserStatus] = useState<"ユーザー名を登録する" | "ユーザー名を登録中" | "ユーザー名の登録完了" | "ユーザー名の登録に失敗">("ユーザー名を登録する");

  const updateWalletDetails = async () => {
    // Set the address of the wallet
    if (wallet == undefined) { return; }
    setAddress(wallet.address);

    // Get the balance of the wallet
    const provider = wallet.provider;
    if (provider == null) { return; }
    const balance = await provider.getBalance(wallet.address);
    setBalance(provider == null ? "0.0" : formatEther(balance));
  }

  // Create a wallet
  const createWallet = async () => {
    const wallet = await getWallet(rpcUrl, localStorage);
    setWallet(wallet);
    await updateWalletDetails();
  }

  // Transfer ether
  const getEther = async () => {
    if (wallet == undefined || receivedEthStatus != "ETHを受け取る") { return; }
    setReceivedEthStatus("ETHを受け取り中");
    const teacher = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', wallet?.provider);
    const amount = '1.0';
    try {
      await transferEther(teacher, wallet.address, amount);
      setReceivedEthStatus("ETHを受け取り完了");
    } catch (error) {
      console.error("Error transferring ether:", error);
      setReceivedEthStatus("ETHの受け取りに失敗");
    }
    await updateWalletDetails();
  }

  const configUserName = async () => {
    if (userName ==  "" || configUserStatus != "ユーザー名を登録する") { return; }
    setConfigUserStatus("ユーザー名を登録中");
    try {
      await configUser(wallet, contractAddress, userName);
      await localStorage.setItem("userName", userName);
      setConfigUserStatus("ユーザー名の登録完了");
    } catch (error) {
      console.error("Error configuring user:", error);
      setConfigUserStatus("ユーザー名の登録に失敗");
    }
    await updateWalletDetails();
  }

  useEffect(() => {
    updateWalletDetails();
  }, [wallet]);

  return (
    <Container className="mt-12">
      <Paper shadow="sm" withBorder className="mb-4 p-4">
        <Text size="lg" className="mt-3">{localStorage.getItem("userName")}</Text>
        <Text size="sm" color="dimmed">アドレス:</Text>
        <Text size="sm" className="break-words">{address}</Text>
        <Text size="sm" color="dimmed" className="mt-3">秘密鍵:</Text>
        <Text size="sm" className="break-words">0x0</Text>
        <Text size="sm" color="dimmed" className="break-words">残高:</Text>
        <Text size="sm" className="break-words mb-3">{balance}</Text>
        <Group className="mt-3">
          <Button variant="outline" color={wallet == undefined ? "blue" : "gray"} onClick={() => createWallet()}>{wallet == undefined ? "ウォレットを作成": "ウォレット接続済み"}</Button>
          <Button variant="outline" color="gray">秘密鍵を表示</Button>
          <Button variant="outline" color={wallet == undefined ? "gray" : "blue"} onClick={() => getEther()}>{receivedEthStatus}</Button>
        </Group>
        <Flex direction="column" className="mt-6" hidden={localStorage.getItem("userName") != null || balance === "0.0"}>
          <Text>ユーザー名を登録</Text>
          <Group>
            <TextInput
              placeholder="ユーザー名を入力"
              className="w-1/2"
              value={userName}
              onChange={(event) => setUserName(event.currentTarget.value)}
            >
            </TextInput>
            <Button variant="outline" className="w-8" color="blue" onClick={() => configUserName()}>{configUserStatus}</Button>
          </Group>
        </Flex>
      </Paper>
    </Container>
  );
}

export default User;
