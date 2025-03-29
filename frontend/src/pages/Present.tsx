import { useState, useContext, useEffect } from 'react';
import { formatEther } from 'ethers';
import { Paper, Text, TextInput, Button, Container } from '@mantine/core';
import { walletContext } from '../App';
import fetchTokens from '../components/fetchTokens';
import putToken from '../components/putToken';
import transferToken from '../components/transferToken';

const Present = () => {
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const [myAddress, setMyAddress] = useState('0x000');
  const [myBalance, setMyBalance] = useState('0.0');
  const [tokenName, setTokenName] = useState('');
  const [address, setAddress] = useState('');
  const [sentContributions, setSentContributions] = useState<Token[]>([]);
  const [receivedContributions, setReceivedContributions] = useState<Token[]>([]);
  const [presentStatus, setPresentStatus] = useState<"感謝を送信する" | "感謝を送信中" | "感謝を送信失敗" | "感謝を送信完了" >("感謝を送信する");
  const [wallet] = useContext(walletContext);

  const updateWalletDetails = async () => {
    // Set the address of the wallet
    if (wallet == undefined) { return; }
    setMyAddress(wallet.address);
    // Get the balance of the wallet
    const provider = wallet.provider;
    if (provider == null) { return; }
    const balance = await provider.getBalance(wallet.address);
    setMyBalance(formatEther(balance));
    // Fetch the tokens
    const sent = await fetchTokens(wallet, contractAddress, "sent");
    setSentContributions(sent);
    const received = await fetchTokens(wallet, contractAddress, "receive");
    setReceivedContributions(received);
  }

  // Present a contribution token
  const presentToken = async () => {
    setPresentStatus("感謝を送信中");
    if (wallet == undefined || presentStatus == "感謝を送信中") { return; }
    try {
      const tx = await putToken(wallet, contractAddress, tokenName);
      const tokenId = tx.logs[0].args[2];
      await transferToken(wallet, contractAddress, address, tokenId);
      await setPresentStatus("感謝を送信完了");
    } catch (error) {
      console.error("Error presenting token:", error);
      await setPresentStatus("感謝を送信失敗");
    }
    updateWalletDetails();
  }

  useEffect(() => {
    updateWalletDetails();
  }, [wallet]);

  return (
    <Container size="sm" className="mt-10">
      <Paper shadow="sm" withBorder className='p-4'>
        <Text size="lg" className="mt-3">My Address:</Text>
        <Text size="sm" className="break-words mb-3">{myAddress}</Text>
        <Text size="lg" className="mt-3">My Balance:</Text>
        <Text size="sm" className="break-words mb-3">{myBalance} ETH</Text>

        <TextInput
          label="Token Name"
          placeholder="貢献の内容や感謝の理由を記入してください"
          required
          value={tokenName}
          onChange={(event) => setTokenName(event.target.value)}
        />
        <TextInput
          label="Address"
          placeholder="送信先のアドレスを指定してください"
          required
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          className="mt-4"
        />
        <Button variant="filled" color="blue" fullWidth className="mt-4" onClick={() => presentToken()}>
          {presentStatus}
        </Button>
      </Paper>

      <Paper shadow="sm" withBorder className="mt-4 p-4">
        <Text size="lg" className="mt-3">送った貢献</Text>
        {sentContributions.map((item, index) => (
          <div key={index} className="mt-2">
            <Text size="sm">{`${item.name} #${item.tokenId}`}</Text>
            <Text size="sm" color="dimmed">Address: {item.owner}</Text>
          </div>
        ))}
      </Paper>

      <Paper shadow="sm" withBorder className="mt-4 p-4">
        <Text size="lg" className="mt-3">受け取った貢献</Text>
        {receivedContributions.map((item, index) => (
          <div key={index} className="mt-2">
            <Text size="sm">{`${item.name} #${item.tokenId}`}</Text>
            <Text size="sm" color="dimmed">Address: {item.owner}</Text>
          </div>
        ))}
      </Paper>
    </Container>
  );
}

export default Present;
