/// <reference types="vite/client" />

interface Token {
  tokenId: number;
  owner: string;
  name: string;
  to: string;
  from: string;
}

interface TransferLog {
  tokenId: number;
  fromAddress: string;
  toAddress: string;
  blockNumber: number;
  gasPrice: number;
  gasUsed: number;
  txHash: string;
}
