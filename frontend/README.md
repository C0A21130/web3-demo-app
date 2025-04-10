# Frontend Development

## User Interface

1. Home：
     ホーム画面では、発行されたNFT(Non-Fungible Token)一覧を確認することができる。
     発行されたNFTのトークン名やオーナー、感謝を受け取ったユーザーの確認が可能である。
     ![Home UI](../images/home.png)

2. Present：
     プレゼント画面では、NFTを利用した感謝の送信を行う。
     トークン名と送信先のアドレス(もしくはユーザー名)を指定して送信する。
     まずトークンを発行し、発行されたトークンを転送することで感謝の送信を行う。
     ![Present UI](../images/present.png)

3. User：
     ユーザー画面では、ウォレットの作成やETHの受け取り、ユーザー名の登録することができる。
     ![User UI](../images/user.png)


## Contract Call

フロントエンドでは、大きく分けて2つの機能に分けられる。
以下にクラス図を示す。

![Frontend](../images/frontend.png)

### Wallet

`frontend/src/components/getWallet.ts`はウォレットを作成する関数である。
ブロックチェーンに接続し、署名を行うためのモジュールであるウォレットを[ethers.jsのWallet](https://docs.ethers.org/v6/api/wallet/)クラスを用いて実装している。
秘密鍵はシード値から生成され、ブラウザのローカルストレージに保存される。

![Wallet](../images/wallet.png)

ウォレットは、以下の流れで作成される。

1. ローカルストレージに保存されている秘密鍵を確認します。
2. 秘密鍵が存在する場合、その秘密鍵を使用してウォレットを生成します。
3. 秘密鍵が存在しない場合、新しいウォレットを生成し、その秘密鍵をローカルストレージに保存します。
4. ウォレットをEthereumプロバイダーに接続して返します。

### Token

1. トークンの取得
     `frontend/src/components/fetchToken.ts`はトークンを一覧として取得する関数である。
     まずスマートコントラクトにおけるTransferイベントのログ(トークンID、送信元アドレス、送信先アドレス)を取得する。
     取得したトークンのログからNFTのトークンのIDを取得し、トークン名等の情報(トークンの所有者、トークン名)を取得する。
     トークンの取得の方法は以下が存在する。
    - すべてのトークンを取得。
    - ウォレットから送信されたトークンを取得。
    - ウォレットが受信したトークンを取得。

2. トークンの発行
     `frontend/src/components/putToken.ts`は指定されたウォレットとスマートコントラクトを使用して新しいNFTトークンを発行する関数である。
     ウォレットの残高を確認し、十分なETHがあるかをチェックする。
     その後、スマートコントラクトの`safeMint`関数を呼び出してNFTを発行する。

3. トークンの転送
     `frontend/src/components/transferToken.ts`は、指定されたウォレットとスマートコントラクトを使用してNFTトークンを転送する関数である。
     ウォレットの残高を確認し、十分なETHがあるかをチェックする。
     その後、スマートコントラクトの`safeTransferFrom`関数を呼び出してNFTを発行する。

## Set Up

### Start the Development Server

ブロックチェーンを起動する。
```bash
cd contracts
npx hardhat node
```

別のターミナルを開いて、コンパイルしたスマートコントラクトをブロックチェーンへデプロイする。
```bash
cd contracts
npx hardhat compile
npx hardhat ignition deploy ignition/modules/SsdlabToken.ts --network localhost
```

デプロイが成功すると以下のような出力がされるため、SsdlabTokenModule#SsdlabTokenのコントラクトアドレスをメモする。
```
Hardhat Ignition
Deploying [ SsdlabTokenModule ]
Batch #1
  Executed SsdlabTokenModule#SsdlabToken
  Executed SsdlabTokenModule#Test
[ SsdlabTokenModule ] successfully deployed
Deployed Addresses
SsdlabTokenModule#SsdlabToken - 0x5FbDB2315678afecb367f032d93F642f64180aa3
SsdlabTokenModule#Test - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```
`frontend/App.tsx`のファイルを開いてコントラクトアドレス(contractAddress)を書き換える。

別のターミナルを開いて、フロントエンドのサーバーを起動する。
ブラウザで[http://localhost:5173](http://localhost:5173)を開いてアプリケーションを表示する。
```bash
cd frontend
npm run dev
```

もし秘密鍵やユーザー名を初期化する場合は、LocalStorageを消去する。
ブラウザの開発者ツール(F12)を開き、Applicationタブを開きClear ALLをクリックする。
![Clear Secret Key](../images/clear.png)

### Run Tests

テストコードは`frontend/test`に存在する。

```bash
npm run test
```

### Build the Frontend

```bash
cd frontend
npm run build
```

生成されたファイルは `frontend/dist/` に配置される。
