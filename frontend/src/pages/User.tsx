import { useContext, useEffect, useState } from 'react';
import { formatEther, Wallet } from 'ethers';
import { Group, Text, Paper, Container, Button } from '@mantine/core';
import { walletContext } from '../App';
import getWallet from '../components/getWallet';
import transferEther  from '../components/transferEther';

const User = () => {
  const rpcUrl = 'http://10.203.92.63:8545';
  const [wallet, setWallet] = useContext(walletContext);
  const [address, setAddress] = useState<string>("0x0");
  const [balance, setBalance] = useState<string>("0.0");

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
    if (wallet == undefined) { return; }
    const teacher = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', wallet?.provider);
    const amount = '1.0';
    await transferEther(teacher, wallet.address, amount);
    await updateWalletDetails();
  }


  useEffect(() => {
    updateWalletDetails();
  }, [wallet]);

  return (
    <Container className="mt-12">
      <Paper shadow="sm" withBorder className="mb-4 p-4">
        <Text size="lg" className="mt-3">Non Set User Name</Text>
        <Text size="sm" color="dimmed">アドレス:</Text>
        <Text size="sm" className="break-words">{address}</Text>
        <Text size="sm" color="dimmed" className="mt-3">秘密鍵:</Text>
        <Text size="sm" className="break-words">0x0</Text>
        <Text size="sm" color="dimmed" className="break-words">残高:</Text>
        <Text size="sm" className="break-words mb-3">{balance}</Text>
        <Group>
          <Button variant="outline" color={wallet == undefined ? "blue" : "gray"} onClick={() => createWallet()}>{wallet == undefined ? "ウォレットを作成": "ウォレット接続済み"}</Button>
          <Button variant="outline" color="gray">秘密鍵を表示</Button>
        </Group>
        <Group className="mt-3">
          <Button variant="outline" color={wallet == undefined ? "gray" : "blue"} onClick={() => getEther()}>お金を受け取る</Button>
          <Button variant="outline" color={balance == "0.0" ? "gray" : "blue"}>ユーザー名を登録</Button>
        </Group>
      </Paper>
    </Container>
  );
}

export default User;
