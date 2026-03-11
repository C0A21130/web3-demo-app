# web3-demo-app

本アプリケーションではEthereum系ブロックチェーンを活用したアプリケーションの基盤構築とデモンストレーションを目的としている
NFT交換システムでは最もシンプルなNFT交換を実現する。
本サービスでは研究室内の貢献に応じてNFTを発行・転送をする。
例として自分の研究以外の活動として「研究メンバーのために論文を探してあげる」ことなどの研究の手伝いをすることがある。
このような場合に、感謝と同時にNFTを送ることで研究室の貢献度を可視化する。

![Application](/docs/images/app.png)

## システムアーキテクチャ

開発環境のシステム構成について紹介する。まずスマートコントラクトのソースコードを開発・テストする。
ブロックチェーンの仮想環境に対して、開発したスマートコントラクトをデプロイする。デプロイしたスマートコントラクトをフロントエンドから呼び出すことで、取引が実行される。

![develop environment](/docs/images/system-architecture.png)

- Hardhat：Ethereumのスマートコントラクト開発を効率的に行うための開発環境。Solidityコードをコンパイルやスマートコントラクトコードのテストによる検証が可能である。
  - Node：スマートコントラクトを実行するための仮想ブロックチェーン環境。
  - Ignition：スマートコントラクトをデプロイメントする。
- Vite：フロントエンドの開発環境
- ethers.js：Ethereumブロックチェーンとのやり取りを簡単に行えるJavaScriptライブラリ。ブロックチェーンとやり取りをして、スマートコントラクトを呼び出す。
  - Wallet：ウォレット管理やトランザクション署名機能を提供する。

### 本番環境による運用

本番環境ではブロックチェーンは、Hardhatの仮想的なブロックチェーンではなくGoQuorum等のEthereum系ブロックチェーンや画像保存用のIPFSによるファイルシステムの設定が必要である。

- Blockchain: [blockchain.md](/docs/blockchain/blockchian.md)
- IPFS: [Web3 Infrastructure for Ipfs](https://github.com/c0a22098ea/web3-infrastructure)

## ディレクトリ構成

このプロジェクトは、スマートコントラクトとフロントエンドを組み合わせた Web3アプリケーションである。

```bash
.
├── README.md
├── .nvmrc                 # node.jsのバージョンを設定
├── contracts
│   ├── README.md          # スマートコントラクトの仕様書
│   ├── artifacts          # スマートコントラクトのコンパイル後に作成されバイナリやABIが保存される
│   ├── contracts          # スマートコントラクトのソースコード
│   ├── hardhat.config.ts  # Hardhatの設定
│   ├── ignition           # スマートコントラクトのデプロイに関するソースコード
│   ├── package-lock.json
│   ├── package.json       # npmやプロジェクトの設定を管理
│   ├── test               # スマートコントラクトのテストコード
│   ├── tsconfig.json
│   └── types              # スマートコントラクトのコンパイル後に作成される型を定義したファイル
├── docs # ドキュメントを保存
└── frontend
    ├── README.md
    ├── abi                # スマートコントラクトのABIファイルを保存する
    ├── dist               # ビルド後のフロントエンドファイルを保存
    ├── eslint.config.js
    ├── index.html
    ├── jest.config.js     # テストツールJestの設定ファイル
    ├── package-lock.json
    ├── package.json       # npmやプロジェクトの設定を管理
    ├── src                # フロントエンドのソースコード
    ├── test               # フロントエンドのテストコード
    ├── tsconfig.app.json
    ├── tsconfig.json      # TypeScriptをJavaScriptにトランスパイルするための設定ファイル 
    ├── tsconfig.node.json
    └── vite.config.mts    # Viteの設定ファイル
```

- **`contracts/`**  
  スマートコントラクトの開発やテストを行う。Hardhatを使用して開発
  - [スマートコントラクトの仕様書](/contracts/README.md)
  
- **`frontend/`**  
  フロントエンドのシステムに関するソースコード。`Vite`を使用してシステムを構築し、`ethers.js`でスマートコントラクトの呼び出しをしている
  - [フロントエンドの仕様書](/frontend/README.md)

- **`docs/`**: このアプリケーションに関する仕様書を配置
   - [起動・動作確認README（任意ログイン + SBT）](/docs/README_startup_optional_login_ja.md)
   - [NFTの仕様書](/docs/token.md)
   - [IPFSを活用した画像アップロードの仕様書](/docs/ipfs.md) 
   - [SBTを用いた会員証の仕様](/docs/SBT.md)
   - [信用スコアによるアクセス制御の仕様書](/docs/scoring.md)
   - [ウォレットの仕様書](/docs/wallet.md)
   - [ブロックチェーン環境の仕様書](/docs/blockchain/blockchian.md)
   - [監視環境の仕様書](/docs/monitoring/monitoring.md)

## セットアップ

**1. プロジェクトの初期化**

以下にアプリケーションを仮想ブロックチェーンの環境で起動する方法について説明する。

0. nvmのインストール。
   すでにインストール済みの場合は次のステップに進む。
   詳しいインストール方法は[nvmリポジトリのInstalling and Updating](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)を参照する。

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
   source ~/.bashrc
   ```

   バージョンは`.nvm`ファイルを参照して変更してください

   ```bash
   nvm install vX.Y.Z
   ```

   例)
  
   ```bash
   nvm install v24.13.0
   ```

1. リポジトリをクローンし、nodeのバージョンを設定する。

   ```bash
   git clone https://github.com/C0A21130/web3-demo-app.git
   cd web3-demo-app
   nvm use
   ```

2. npmライブラリにおける必要な依存関係をインストールする。

   ```bash
   # For the contracts directory
   cd contracts
   npm install
   ```

   ```bash
   # For the frontend directory
   cd ../frontend
   npm install
   ```

3. 仮想のブロックチェーンを起動する。

   ```bash
   cd ../contracts
   npx hardhat node
   ```

4. 別のターミナルを開いて、スマートコントラクトをデプロイする。

   ```bash
   cd contracts
   npx hardhat compile
   npx hardhat ignition deploy ignition/modules/localhost.ts --network localhost
   ```

5. [App.tsx](/frontend/src/App.tsx) によるパラメータの設定

   各種エンドポイントやコントラクトアドレスを設定する
   - `rpcUrls`: ブロックチェーンのRPC URL
   - `scoringEndpointUrl`: 信用スコアリングシステムのURL
   - `ipfsApiUrl`: IPFSのKubo RPC API(ポート番号は含まない)
   - `contractAddress`:
      - NFTのコントラクトアドレス
      - デプロイ後表示されるコントラクトアドレスを設定する
   - `credentialContractAddress`: 
      - SBTのコントラクトアドレス
      - デプロイ後表示されるコントラクトアドレスを設定する
   - `receiveAccountPrivateKey`: 
      - Hardhat node起動時に表示される秘密鍵の設定
      - Hardhatを利用しない場合は指定せず信用スコアリングシステムの送金プログラムを利用する

   例)

   ```typescript:App.tsx
   export const rpcUrls = ["http://localhost:8545"];
   export const scoringEndpointUrl: string = "";
   export const ipfsApiUrl = "http://localhost";
   export const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
   export const credentialContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
   export const receiveAccountPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
   ```

6. 別のターミナルを開いて、フロントエンドのサーバーを起動する。
   ブラウザで[http://localhost:5173](http://localhost:5173)を開いてアプリケーションを利用する

   ```bash
   cd frontend
   npm run dev
   ```

※もし秘密鍵やユーザー名を確認・初期化する場合は、LocalStorageを消去する。
ブラウザの開発者ツール(F12)を開き、Applicationタブを開きClear ALLをクリックする。
![Clear Secret Key](/docs/images/clear.png)

## CI/CD

このプロジェクトではCI/CDにGitHub Actionsを使用している。
設定ファイルは次の場所 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)にある。

