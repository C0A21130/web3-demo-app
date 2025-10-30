import { useContext, useEffect, useState } from 'react';
import { formatEther } from 'ethers';
import { Flex, Group, Text, Paper, Container, Button, Alert } from '@mantine/core';
import { IconWallet } from '@tabler/icons-react';
import DisplayCredential from '../components/credential/displayCredential';
import { rpcUrls, scoringEndpointUrl, rpcUrlIndexContext, contractAddress, receiveAccountPrivateKey, walletContext } from '../App';
import getWallet from '../components/getWallet';
import transferEther  from '../components/transferEther';

const User = () => {
  const [wallet, setWallet] = useContext(walletContext);
  const [rpcUrlIndex, setRpcUrlIndex] = useContext(rpcUrlIndexContext);
  const [address, setAddress] = useState<string>("0x0");
  const [balance, setBalance] = useState<string>("0.0");
  const [receivedEthStatus, setReceivedEthStatus] = useState<"ETHを受け取る" | "ETHを受け取り中" | "ETHを受け取り完了" | "ETHの受け取りに失敗" | "ETHの残高は十分です">("ETHを受け取る");

  // ウォレットの初期化
  const initWallet = async () => {
    const {wallet, rpcUrlIndex} = await getWallet(rpcUrls, localStorage);
    if (rpcUrlIndex === -1) {
      setRpcUrlIndex(-1);
      return;
    }
    setWallet(wallet);
    setAddress(wallet.address);
    const provider = wallet.provider;
    if (provider == null) { return; }
    const balance = await provider.getBalance(wallet.address);
    setBalance(provider == null ? "0.0" : formatEther(balance));
    setRpcUrlIndex(rpcUrlIndex);
  }

  // ETH受け取り処理
  const getEther = async () => {
    if (wallet == undefined || receivedEthStatus != "ETHを受け取る") { return; }
    setReceivedEthStatus("ETHを受け取り中");
    try {
      const result = await transferEther(receiveAccountPrivateKey, wallet, scoringEndpointUrl);
      if (result === false) {
        setReceivedEthStatus("ETHの残高は十分です");
      } else {
        setReceivedEthStatus("ETHを受け取り完了");
      }
    } catch (error) {
      console.error("Error transferring ether:", error);
      setReceivedEthStatus("ETHの受け取りに失敗");
    }

    // 残高の更新
    const provider = wallet.provider;
    if (provider == null) { return; }
    const balance = await provider.getBalance(wallet.address);
    setBalance(provider == null ? "0.0" : formatEther(balance));
  }

  // Update the wallet details when the component mounts or when the wallet changes
  useEffect(() => {
      initWallet();
  }, []);

  return (
    <Container size="sm" className="mt-10">
      <Paper shadow="sm" withBorder className="p-4">
        <div className='flex items-center'>
          <IconWallet size={24} />
          <Text size="lg">ウォレット</Text>
        </div>
        <Flex direction="column" className="mt-3">
          <Text size="sm" color="dimmed">アドレス:</Text>
          <Text size="sm" className="break-words">{address}</Text>
          <Text size="sm" color="dimmed" className="break-words">残高:</Text>
          <Text size="sm" className="break-words mb-3">{balance}</Text>
          <Text size="sm" color="dimmed" className="break-words">ブロックチェーンノード:</Text>
          <Text size="sm" className="break-words mb-3">{rpcUrlIndex == -1 ? "ノード未接続" : `ノード-${rpcUrlIndex}`}</Text>
        </Flex>
        <Group className="mt-3" hidden={rpcUrlIndex == -1}>
          <Button
            fullWidth
            variant="filled"
            color={wallet == undefined ? "gray" : "dark"} 
            onClick={() => getEther()}
          >
            {receivedEthStatus}
          </Button>
        </Group>
      </Paper>
      <DisplayCredential hidden={balance === "0.0"} wallet={wallet} contractAddress={contractAddress} />
      <Alert title="注意" color="yellow" className="mt-4" hidden={address != "0x0" || rpcUrlIndex == -1}>
        ブロックチェーンに接続中です
      </Alert>
      <Alert title="エラー" color="red" className="mt-4" hidden={address != "0x0" || rpcUrlIndex != -1}>
        有効なブロックチェーンノードが見つかりません
      </Alert>
    </Container>
  );
}

export default User;
