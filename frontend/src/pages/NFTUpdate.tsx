import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers, formatEther } from 'ethers';
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import {
  Paper, Text, TextInput, Button, Container, Alert, Card,
  Group, Badge, SimpleGrid, Modal, Stack, Image, Textarea
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconRefresh, IconHistory, IconUpload, IconPhoto } from '@tabler/icons-react';
import { ipfsApiUrl, walletContext } from '../App';

// ERC5185対応コントラクトのABIを定義
const ERC5185_ABI = [
  // 標準ERC721関数
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  // ERC5185固有の関数
  "function updateTokenURI(uint256 tokenId, string newURI)",
  "function getMetadataHistory(uint256 tokenId) view returns (string[] uris, uint256[] timestamps, address[] updaters)",
  "function getMetadataUpdateCount(uint256 tokenId) view returns (uint256)",
  "function safeMint(address to, string _tokenURI) returns (uint256)",
  // ERC5185イベント
  "event MetadataUpdate(uint256 indexed tokenId)",
  "event BatchMetadataUpdate(uint256 fromTokenId, uint256 toTokenId)",
  "event MetadataUpdated(uint256 indexed tokenId, string oldURI, string newURI, address indexed updatedBy, uint256 timestamp)"
];

// NFTのデータ型
interface NFT {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  tokenURI: string;
}

// メタデータ履歴の型
interface MetadataHistoryEntry {
  uri: string;
  timestamp: number;
  updatedBy: string;
}

// ERC5185対応コントラクトのアドレス（実際のデプロイ済みアドレスに変更してください）
const ERC5185_CONTRACT_ADDRESS = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0";

const NFTUpdate = () => {
  const [wallet] = useContext(walletContext);
  const [myAddress, setMyAddress] = useState('0x000');
  const [myBalance, setMyBalance] = useState('0.0');
  const [myNFTs, setMyNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [ipfsClient, setIpfsClient] = useState<IPFSHTTPClient | null>(null);
  const [ipfsConnected, setIpfsConnected] = useState(false);

  // 更新モーダル関連
  const [updateOpened, { open: openUpdate, close: closeUpdate }] = useDisclosure(false);
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [updating, setUpdating] = useState(false);
  const [metadataHistory, setMetadataHistory] = useState<MetadataHistoryEntry[]>([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [showAlert, setShowAlert] = useState(false);

  const navigate = useNavigate();

  // タイムアウト付きフェッチ
  const fetchWithTimeout = async (url: string, options?: RequestInit, timeout = 5000): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  };

  // 初期設定
  useEffect(() => {
    const init = async () => {
      if (!wallet) {
        navigate('/user');
        return;
      }

      // ウォレット情報を設定
      setMyAddress(wallet.address);
      const provider = wallet.provider;
      if (provider) {
        const balance = await provider.getBalance(wallet.address);
        setMyBalance(formatEther(balance));
      }

      // コントラクトインスタンスを作成
      const contractInstance = new ethers.Contract(
        ERC5185_CONTRACT_ADDRESS,
        ERC5185_ABI,
        wallet
      );
      setContract(contractInstance);

      // IPFSクライアントを初期化
      try {
        const client = create({ url: `${ipfsApiUrl}:5001`, timeout: 3000 });
        await client.id();
        setIpfsClient(client);
        setIpfsConnected(true);
      } catch (error) {
        console.error("Error connecting to IPFS:", error);
        setIpfsConnected(false);
      }
    };

    init();
  }, [wallet, navigate]);

  // NFT一覧を取得
  const fetchMyNFTs = async () => {
    if (!contract || !wallet) return;
    setLoading(true);

    try {
      const nfts: NFT[] = [];
      const myAddr = wallet.address;

      // 所有NFT数を取得
      let balance: bigint = BigInt(0);
      try {
        balance = await contract.balanceOf(myAddr);
      } catch (err) {
        console.error("Error fetching balance:", err);
        balance = BigInt(0);
      }

      // 各NFTの情報を取得
      for (let i = 0; i < balance; i++) {
        try {
          const tokenId = await contract.tokenOfOwnerByIndex(myAddr, i);
          const tokenURI = await contract.tokenURI(tokenId);

          // メタデータをフェッチ
          let metadata = {
            name: `NFT #${tokenId}`,
            description: 'メタデータを取得できませんでした',
            image: ''
          };

          try {
            const response = await fetchWithTimeout(tokenURI);
            const jsonMetadata = await response.json();
            metadata = {
              name: jsonMetadata.name || `NFT #${tokenId}`,
              description: jsonMetadata.description || '',
              image: jsonMetadata.image || ''
            };
          } catch (error) {
            console.error(`Failed to fetch metadata for tokenId ${tokenId}:`, error);
          }

          nfts.push({
            tokenId: tokenId.toString(),
            tokenURI,
            ...metadata
          });
        } catch (error) {
          console.error(`Error fetching NFT at index ${i}:`, error);
        }
      }

      setMyNFTs(nfts);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  // コントラクトが設定されたらNFTを取得
  useEffect(() => {
    if (contract) {
      fetchMyNFTs();
    }
  }, [contract]);

  // 更新モーダルを開く
  const handleOpenUpdate = (nft: NFT) => {
    setSelectedNFT(nft);
    setNewName(nft.name);
    setNewDescription(nft.description);
    setNewImage(null);
    openUpdate();
  };

  // 履歴モーダルを開く
  const handleOpenHistory = async (nft: NFT) => {
    setSelectedNFT(nft);

    if (!contract) return;

    try {
      const result = await contract.getMetadataHistory(nft.tokenId);
      const [uris, timestamps, updaters] = result;

      const history: MetadataHistoryEntry[] = [];
      for (let i = 0; i < uris.length; i++) {
        history.push({
          uri: uris[i],
          timestamp: Number(timestamps[i]),
          updatedBy: updaters[i]
        });
      }
      setMetadataHistory(history);
    } catch (error) {
      console.error("Error fetching metadata history:", error);
      setMetadataHistory([]);
    }

    openHistory();
  };

  // メタデータを更新（ERC5185準拠）
  const handleUpdateMetadata = async () => {
    if (!contract || !selectedNFT || !wallet) return;
    setUpdating(true);

    try {
      let newImageURI = selectedNFT.image;

      // 新しい画像がある場合はIPFSにアップロード
      if (newImage && ipfsClient) {
        try {
          const imageAdded = await ipfsClient.add(newImage);
          newImageURI = `https://ipfs.io/ipfs/${imageAdded.path}`;
        } catch (error) {
          console.error("Error uploading image to IPFS:", error);
          throw new Error("画像のアップロードに失敗しました");
        }
      }

      // 新しいメタデータをIPFSにアップロード
      const newMetadata = {
        name: newName,
        description: newDescription,
        image: newImageURI
      };

      let metadataURI = selectedNFT.tokenURI;

      if (ipfsClient) {
        try {
          const metadataAdded = await ipfsClient.add(JSON.stringify(newMetadata));
          metadataURI = `${ipfsApiUrl}:8080/ipfs/${metadataAdded.path}`;
        } catch (error) {
          console.error("Error uploading metadata to IPFS:", error);
          throw new Error("メタデータのアップロードに失敗しました");
        }
      }

      // ERC5185のupdateTokenURI関数を呼び出し
      // これによりMetadataUpdateイベントが発行される
      const tx = await contract.updateTokenURI(selectedNFT.tokenId, metadataURI);
      await tx.wait();

      setAlertMessage(`NFT #${selectedNFT.tokenId} のメタデータが正常に更新されました（ERC5185準拠）`);
      setAlertType('success');
      setShowAlert(true);

      // NFT一覧を再取得
      await fetchMyNFTs();
      closeUpdate();
    } catch (error) {
      console.error("Error updating metadata:", error);
      setAlertMessage(`メタデータの更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      setAlertType('error');
      setShowAlert(true);
    } finally {
      setUpdating(false);
    }
  };

  // 日時をフォーマットする
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('ja-JP');
  };

  // アドレスを短縮表示
  const shortenAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // ウォレットが未接続の場合
  if (!wallet) {
    return (
      <Container size="sm" className="mt-10">
        <Paper shadow="sm" withBorder className='p-4'>
          <Text size="lg">ウォレット未接続</Text>
          <Alert title="注意" color="red" className="mt-4">
            ウォレットが接続されていません。ユーザーページからウォレットを接続してください。
          </Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" className="mt-10">
      {/* アラート */}
      {showAlert && (
        <Alert
          color={alertType === 'success' ? 'teal' : 'red'}
          title={alertType === 'success' ? '成功' : 'エラー'}
          withCloseButton
          onClose={() => setShowAlert(false)}
          className="mb-4"
          icon={<IconRefresh size={16} />}
        >
          {alertMessage}
        </Alert>
      )}

      {/* ウォレット情報 */}
      <Paper shadow="sm" withBorder className='p-4 mb-4'>
        <Text size="xl" className="mb-2">ERC5185 NFT メタデータ更新</Text>
        <Text size="sm">
          ERC5185（ERC4906）に準拠したNFTメタデータの更新を行います。
          更新時にMetadataUpdateイベントが発行され、マーケットプレイスやインデクサーが変更を検知できます。
        </Text>
        <Group className="mt-4">
          <Text size="sm">アドレス: {shortenAddress(myAddress)}</Text>
          <Text size="sm">残高: {myBalance} ETH</Text>
          <Badge color={ipfsConnected ? 'green' : 'red'}>
            IPFS: {ipfsConnected ? '接続中' : '未接続'}
          </Badge>
        </Group>
      </Paper>

      {/* NFT一覧ヘッダー */}
      <Group className="mb-4" justify="space-between">
        <Text size="lg">保有NFT一覧</Text>
        <Button
          leftSection={<IconRefresh size={16} />}
          onClick={fetchMyNFTs}
          loading={loading}
          variant="light"
        >
          更新
        </Button>
      </Group>

      {/* NFT一覧が空の場合 */}
      {myNFTs.length === 0 && !loading && (
        <Paper shadow="sm" withBorder className='p-4'>
          <Text>保有しているNFTはありません。</Text>
        </Paper>
      )}

      {/* NFT一覧 */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {myNFTs.map((nft) => (
          <Card key={nft.tokenId} shadow="sm" padding="lg" radius="md" withBorder>
            <Card.Section>
              {nft.image ? (
                <Image
                  src={nft.image}
                  height={160}
                  alt={nft.name}
                  fallbackSrc="/no-image.png"
                />
              ) : (
                <div className="h-40 bg-gray-200 flex items-center justify-center">
                  <IconPhoto size={48} color="gray" />
                </div>
              )}
            </Card.Section>

            <Group justify="space-between" mt="md" mb="xs">
              <Text fw={500}>{nft.name}</Text>
              <Badge color="blue" variant="light">
                ID: {nft.tokenId}
              </Badge>
            </Group>

            <Text size="sm" c="dimmed" lineClamp={2}>
              {nft.description}
            </Text>

            <Stack mt="md" gap="xs">
              <Button
                variant="light"
                color="blue"
                fullWidth
                leftSection={<IconRefresh size={16} />}
                onClick={() => handleOpenUpdate(nft)}
              >
                メタデータを更新
              </Button>
              <Button
                variant="outline"
                color="gray"
                fullWidth
                leftSection={<IconHistory size={16} />}
                onClick={() => handleOpenHistory(nft)}
              >
                更新履歴を確認
              </Button>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>

      {/* 更新モーダル */}
      <Modal
        opened={updateOpened}
        onClose={closeUpdate}
        title={`NFT #${selectedNFT?.tokenId} メタデータ更新（ERC5185）`}
        size="lg"
      >
        <Stack>
          <TextInput
            label="NFT名"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="NFTの名前を入力"
          />
          <Textarea
            label="説明"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="NFTの説明を入力"
            minRows={3}
          />
          <div>
            <Text size="sm" fw={500} mb={4}>新しい画像（任意）</Text>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files?.[0] || null)}
            />
            {!ipfsConnected && (
              <Text size="xs" c="red">
                IPFSに接続されていないため、新しい画像はアップロードできません
              </Text>
            )}
          </div>

          {newImage && (
            <Image
              src={URL.createObjectURL(newImage)}
              alt="Preview"
              height={100}
              fit="contain"
            />
          )}

          <Alert color="blue" title="ERC5185について">
            更新を実行すると、コントラクトから`MetadataUpdate`イベントが発行されます。
            これによりマーケットプレイスやインデクサーがメタデータの変更を検知し、キャッシュを更新できます。
          </Alert>

          <Button
            onClick={handleUpdateMetadata}
            loading={updating}
            leftSection={<IconUpload size={16} />}
          >
            メタデータを更新
          </Button>
        </Stack>
      </Modal>

      {/* 履歴モーダル */}
      <Modal
        opened={historyOpened}
        onClose={closeHistory}
        title={`NFT #${selectedNFT?.tokenId} 更新履歴`}
        size="lg"
      >
        {metadataHistory.length === 0 ? (
          <Text>更新履歴はありません。</Text>
        ) : (
          <Stack>
            {metadataHistory.map((entry, index) => (
              <Card key={index} shadow="sm" padding="sm" radius="md" withBorder>
                <Group justify="space-between">
                  <Badge color={index === metadataHistory.length - 1 ? 'green' : 'gray'}>
                    {index === metadataHistory.length - 1 ? '最新' : `v${index + 1}`}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {formatTimestamp(entry.timestamp)}
                  </Text>
                </Group>
                <Text size="sm" mt="xs" className="break-all">
                  URI: {entry.uri}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  更新者: {shortenAddress(entry.updatedBy)}
                </Text>
              </Card>
            ))}
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default NFTUpdate;
