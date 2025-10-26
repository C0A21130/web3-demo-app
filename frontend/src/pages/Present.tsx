import { useState, useContext, useEffect } from 'react';
import { formatEther } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { Paper, Text, TextInput, Button, Container, Alert, Flex} from '@mantine/core';
import { contractAddress, walletContext } from '../App';
import putToken from '../components/putToken';
import transferToken from '../components/transferToken';
import verifyScore from '../components/scoring/verifyScore';
import CreatePhoto from '../components/present/createPhoto';
import UserList from '../components/present/userList';

const Present = () => {
  const [myAddress, setMyAddress] = useState('0x000');
  const [myBalance, setMyBalance] = useState('0.0');
  const [tokenName, setTokenName] = useState('');
  const [address, setAddress] = useState('0x000');
  const [photo, setPhoto] = useState<File | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [credentials, setCredentials] = useState<UserCredential[]>([]);
  const [presentStatus, setPresentStatus] = useState<"画像作成中" | "感謝を送信する" | "感謝を送信中" | "感謝を送信失敗" | "感謝を送信完了" >("画像作成中");
  const [wallet] = useContext(walletContext);
  const navigate = useNavigate();

  // ウォレット情報を更新する
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

    // IPFSとの接続確認(TODO: 実装予定)
    const connectStatus = false;
    setConnecting(connectStatus);
    // もしIFPSと接続できない場合は、画像作成画面を非表示にする
    if (!connectStatus && presentStatus === "画像作成中") {
      setPresentStatus("感謝を送信する");
    }
  }

  // 送信前に検証を行う
  const isValid = async (): Promise<boolean> => {
    if (wallet == undefined) { return false; }

    // 会員証が発行されているか検証する(TOODO: SBT実装予定)
    const isValidCredential = true;
    if (!isValidCredential) {
      if (!window.confirm("送信先のアドレスは会員証を持っていません。本当に取引して問題ないですか？")) { return false; }
    }

    // 自身と取引相手の信用スコアを確認する
    const validScoreResult = await verifyScore(wallet, address, contractAddress);
    if(!validScoreResult.isAuthorized) {
      window.alert("取引相手からの承認が得られませんでした。取引を中止します。");
      return false;
    } else if (!validScoreResult.isVerified) {
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
      const tx = await putToken(wallet, contractAddress, tokenName);
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
          <UserList wallet={wallet} credentials={credentials} setCredentials={setCredentials} setAddress={setAddress} contractAddress={contractAddress} />
        </Flex>
      </Paper>
      
      {/* アラート一覧 */}
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
