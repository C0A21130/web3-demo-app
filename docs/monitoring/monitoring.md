# Monitoring

ブロックチェーンの監視環境構築の方法について説明する。
本システムでは、プライベートのEthereum系ブロックチェーンの監視環境を構築する。

- ブロックチェーン環境仕様書: [blockchain.md](/docs/blockchain/blockchian.md)
- 監視環境仕様書: [monitor.md](./monitoring.md)

監視用ノードは、以下の3つのシステムで構成されている。

![Moniotoring Structure](./images/architecture.png)

1. **ブロックエクスプローラー**：
    [Quorum Explorer](https://github.com/Consensys/quorum-explorer)はQuorumブロックチェーンネットワークの監視や管理を行うためのツールである。
    ノードの稼働状況やトランザクションの進行状況、送信されたトランザクションの詳細や履歴を追跡することが可能である。
    稼働していブロックチェーンノードのJSON-RPCへアクセスしデータを取得する。
    [http://localhost:25000](http://localhost:25000/)からアクセス可能である。
2. **ノード状態監視システム**：
    Metrics Systemでは、ブロックチェーンノードやIPFSの状態を受け取り、ダッシュボードで可視化するシステムである。
    監視可能なメトリクスとしてCPUやメモリ、ディスク、ネットワーク、トランザクションの状態などが存在する。
    ブロックチェーンはGeth Clientから送信されたシステムの状態を時系列データベース(InfluxDB)に保存し、蓄積されたデータをダッシュボード(Grafana)で可視化する。
    IPFSはIPFS Kuboから収集可能なメトリクスデータを時系列データベース(prometheus)に保存し、蓄積されたデータをダッシュボード(Grafana)で可視化する。
    [http://localhost:8085](http://localhost:8085/)からアクセス可能である。
3. **ベンチマーク装置**
    スマートコントラクトの呼び出しにおける性能測定を行う。
    [Hyperledger Caliper](https://hyperledger-caliper.github.io/caliper/0.6.0/)は，ブロックチェーンネットワークのパフォーマンスを評価するためのフレームワークであり，トランザクションのスループットやレイテンシなどの指標を測定できる。
    より詳細な仕様については[caliper-benchmarks](https://github.com/C0A21130/caliper-benchmarks)を参照

## Set up

ブロックチェーン監視環境をセットアップするために必要なツールついて説明する。

| ツール | バージョン | 利用用途 |
|------------|------------|----------|
| quorum-explorer | 0.2.4 | ブロックチェーンエクスプローラー |
| InfluxDB | 2.7.1 | 時系列データベース |
| Grafana | 11.6.0 | ダッシュボード可視化ツール |
| Hyperledger Caliper | 0.6.0 | ブロックチェーン性能評価フレームワーク |

### Install nvm

バイナリファイルをダウンロードする。
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.2/install.sh | bash
```

`~/.bashrc` の設定を読み込む。
```bash
sourse ~/.bashrc
```

nvmを用いてnodeをインストール
```bash
nvm install v22.14.0
```

現在のnodeのバージョンを変更
```bash
nvm use v22.14.0
```

## 設定

ブロックチェーン監視環境の設定方法について説明する。
以下がディレクトリ構成である

```bash
.
├── docker-compose.yml
├── explorer/ 
│   ├── .env.production: 
│   └── config.json: 接続先のブロックチェーンノード等の設定ファイル
├── grafana/
└── influxdb2/
```

### ブロックチェーンエクスプローラー

エクスプローラーのノードの接続先とアプリケーションのパラメータを設定する。
まずquorum-explorerのコンテナを起動するdocker-compose.ymlを作成する。
作成例は本レポジトリの[docker-compose.yml](./docker-compose.yml)を参考にする。

`explorer/config.json` の設定ファイルを接続先のブロックチェーンノードに変更する。
変更例は本リポジトリの[config.json](./explorer/config.json)を参照する。

`.env.production` の設定ファイルからアプリケーションを設定する。
変更例は本リポジトリの[.env.production](./explorer/.env.production)を参照する。

ブロックチェーンエクスプローラーを起動する

```bash
docker-compose up -d
```

### ノード状態監視システム

まずInfluxDBとGrafanaのコンテナを起動するdocker-compose.ymlを作成する。
作成例は本レポジトリの `blockchain/docker-compose.yml` を参考にする。

コンテナを起動する。
```bash
docker-compose up -d
```

[http://localhost:8086](http://localhost:8086)にアクセスし、gethのbucketを作成する。
bucket名は`geth`とし、作成したBucketのIDをメモしておく。

![Create Bucket](./images/bucket.png)

つぎにv1におけるユーザーを設定することでこれにより外部からユーザー名・パスワードを利用してアクセスを可能にしておく。

コンテナのターミナルへアタッチする
```bash
docker-compose exec influxdb /bin/bash
```

ユーザー名とパスワードを設定する(BUCKET_IDは先ほどメモしたIDを指定する)
```bash
influx v1 auth create --username <USER_NAME> --password <PASSWORD> --read-bucket <BUCKET_ID> --write-bucket <BUCKET_ID>
```

最後にGrafanaを活用したダッシュボードの設定を行う。

まずInfluxDB([http://localhost:8085](http://localhost:8085))にアクセスしAPI Tokenの発行を行う。トークン名は自由だがかならずトークンはメモをとっておく。

![Issue Token](./images/token.png)

次に[http://localhost:8085](http://localhost:8085)にアクセスし、GrafanaのDB接続設定を行う。
Data SourceからInfluxDBを選択し追加する。
![Add InfluxDB](./images/datasource.png)

接続先のURLには[http://localhost:8085](http://localhost:8085)、Organizationはorganization、Tokenは先ほどメモしたトークンを設定する。
![Config Auth](./images/auth.png)

その後Dashbordのタブをクリックし、新しいダッシュボードを作成する。
[geth-1747104319571.json](./geth-1747104319571.json)のファイルをインポートする。 

## Reference

- InfluxDB v2 のインストールや v1 からの移行について、https://tech.aptpod.co.jp/entry/2022/03/04/130000
- InfluxDB+Grafana構築 on docker、https://qiita.com/7280ayubihs/items/ace07b14d934dca4744c
