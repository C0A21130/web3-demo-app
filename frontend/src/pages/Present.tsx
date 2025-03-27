import { useState, useContext, useEffect } from 'react';
import { formatEther } from 'ethers';
import { Paper, Text, TextInput, Button, Container } from '@mantine/core';
import { walletContext } from '../App';
import putToken from '../components/putToken';
import transferToken from '../components/transferToken';

const Present = () => {
  const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const [myAddress, setMyAddress] = useState('0x000');
  const [myBalance, setMyBalance] = useState('0.0');
  const [tokenName, setTokenName] = useState('');
  const [address, setAddress] = useState('');
  const [wallet] = useContext(walletContext);

  // Present a contribution token
  const presentToken = async () => {
    if (wallet == undefined) { return; }
    const tx = await putToken(wallet, contractAddress, tokenName);
    const tokenId = tx.logs[0].args[2];
    await transferToken(wallet, contractAddress, address, tokenId);
  }

  useEffect(() => {
    const setWalletDetails = async () => {
      // Set the address of the wallet
      if (wallet == undefined) { return; }
      setMyAddress(wallet.address);
      // Get the balance of the wallet
      const provider = wallet.provider;
      if (provider == null) { return; }
      const balance = await provider.getBalance(wallet.address);
      setMyBalance(formatEther(balance));
    }
    setWalletDetails();
  }, [wallet]);

  return (
    <Container size="sm" className="mt-10">
      <Paper shadow="sm" withBorder>
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
          感謝を伝える
        </Button>
      </Paper>
    </Container>
  );
}

export default Present;
