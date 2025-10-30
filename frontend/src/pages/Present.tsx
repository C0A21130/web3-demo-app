import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatEther } from 'ethers';
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { Paper, Text, TextInput, Button, Container, Alert, Flex } from '@mantine/core';
import { ipfsApiUrl, walletContext, contractAddress, credentialContractAddress } from '../App';
import CreatePhoto from '../components/present/createPhoto';
import UserList from '../components/present/userList';
import putToken from '../components/putToken';
import transferToken from '../components/transferToken';
import verifyCredential from '../components/credential/verifyCredential';
import verifyScore from '../components/scoring/verifyScore';

const Present = () => {
  const [myAddress, setMyAddress] = useState('0x000');
  const [myBalance, setMyBalance] = useState('0.0');
  const [tokenName, setTokenName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [ipfsClient, setIpfsClient] = useState<IPFSHTTPClient | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [credentials, setCredentials] = useState<UserCredential[]>([]);
  const [presentStatus, setPresentStatus] = useState<"画像作成中" | "感謝を送信する" | "感謝を送信中" | "感謝を送信失敗" | "感謝を送信完了" >("画像作成中");
  const [wallet] = useContext(walletContext);
  const navigate = useNavigate();

  // 処理を遅延させる関数
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const updateWalletDetails = async () => {
    // ウォレットが未接続の場合はユーザーページへ遷移する
    if (!wallet) {
      navigate('/user'); 
      return;
    }

    // ウォレットアドレスを取得する
    if (myBalance != '0.0') { return; }
    setMyAddress(wallet.address);

    // 残高を確認する
    const provider = wallet.provider;
    if (provider == null) { return; }
    const balance = await provider.getBalance(wallet.address);
    setMyBalance(formatEther(balance));

    // IPFSとの接続を確立する
    try {
      const client = create({ url: `${ipfsApiUrl}:5001`, timeout: 3000 });
      await client.id();
      setIpfsClient(client);
      setConnecting(true);
    } catch (error) {
      console.error("Error connecting to IPFS");
      setConnecting(false);
      if (presentStatus == "画像作成中") {
        setPresentStatus("感謝を送信する");
      }
    }
  }

  // 送信前に検証を行う
  const isValid = async (): Promise<boolean> => {
    if (wallet == undefined) { return false; }
    
    // 会員証が発行されているか検証する
    const tokenId = credentials.find(cred => cred.address.toLowerCase() === address.toLowerCase())?.tokenId;
    const isValidCredential = await verifyCredential(wallet, credentialContractAddress, tokenId ? tokenId : -1, address);
    if (!isValidCredential) {
      if (!window.confirm("送信先のアドレスは会員証を持っていません。本当に取引して問題ないですか？")) { return false; }
    }

    // 自身と取引相手の信用スコアを確認する
    const isValidScore = await verifyScore(wallet, address, contractAddress);
    if (!isValidScore) {
      if (!window.confirm("取引相手の信用スコアが不足しています。本当に取引して問題ないですか？")) { return false; }
    }
    
    return true;
  }

  // 感謝を送信する(TODO: 実装予定)
  const presentToken = async () => {
    if (!await isValid()) { return; } // 検証に失敗した場合は処理を中断する

    // IPFSに画像をアップロードしてトークンを送信する(TODO: 実装予定)
    if (wallet == undefined || presentStatus != "感謝を送信する") { return; }
    setPresentStatus("感謝を送信中");
    try {
      const params = {
        wallet: wallet,
        contractAddress: contractAddress,
        name: tokenName,
        description: description,
        image: photo,
        client: ipfsClient,
        ipfsApiUrl: ipfsApiUrl
      };
      const tx = await putToken(params);
      await delay(3000);
      const tokenId = tx.logs[0].args[2];
      await transferToken(wallet, contractAddress, address, tokenId);
      await setPresentStatus("感謝を送信完了");
    } catch (error) {
      console.error("Error presenting token:", error);
      await setPresentStatus("感謝を送信失敗");
    }
    await updateWalletDetails();
  }

  useEffect(() => {
    updateWalletDetails();
  }, []);

  return (
    <Container size="sm" className="mt-10">
      {/* 感謝を送るフォーム */}
      <Paper shadow="sm" withBorder className='p-4'>
        <Text size="xl">ありがトークンを送ろう</Text>
        <Text size="lg" className="mt-3">自身のアドレス:</Text>
        <Text size="sm" className="break-words mb-3">{myAddress}</Text>
        <Text size="lg" className="mt-3">ETHの残高:</Text>
        <Text size="sm" className="break-words mb-3">{myBalance} ETH</Text>
        <TextInput
          label="トークン名"
          placeholder="貢献の内容や感謝の理由を記入してください"
          required
          value={tokenName}
          onChange={(event) => setTokenName(event.target.value)}
          className='mt-2'
        />
        {connecting && <TextInput
          label="説明"
          placeholder="トークンの説明を記入してください"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className='mt-2'
        />}

        {/* 画像作成画面 */}
        <CreatePhoto hidden={!connecting || presentStatus !== "画像作成中"} setPhoto={setPhoto} photo={photo} setPresentStatus={setPresentStatus} />
        
        {/* 送信画面 */}
        <Flex hidden={presentStatus === "画像作成中"} direction="column" className="mt-4">
          {photo && (
            <img src={photo ? URL.createObjectURL(photo) : ''} alt="Created" className="mb-4 max-w-100 h-auto" />
          )}
          
          <TextInput
            label="送信先アドレス"
            placeholder="0xから始まるアドレスを入力してください"
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
          <Button variant="filled" color="blue" fullWidth className="mt-4" onClick={() => presentToken()}>
            {presentStatus}
          </Button>
          <UserList wallet={wallet} credentials={credentials} setCredentials={setCredentials} setAddress={setAddress} contractAddress={contractAddress} credentialContractAddress={credentialContractAddress} />
        </Flex>
      </Paper>
      
      {/* アラート一覧 */}
      <Alert title="接続中" color="yellow" className="mt-4" hidden={connecting || presentStatus != "画像作成中" || wallet == undefined}>
        IPFSに接続中です...
      </Alert>
      <Alert title="注意" color="red" className="mt-4" hidden={wallet != undefined}>
        ウォレットが接続されていません。ユーザーページに移動してウォレットを接続してください。
      </Alert>
      <Alert title="注意" color="red" className="mt-4" hidden={myBalance != '0.0'}>
        残代が不足しています。貢献を送信するには、十分なETHが必要です。
      </Alert>
    </Container>
  );
}

export default Present;
