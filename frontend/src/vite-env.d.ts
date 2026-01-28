/// <reference types="vite/client" />

interface Token {
  tokenId: number;
  owner: string;
  name: string;
  to: string;
  from: string;
  description: string | null;
  imageUrl: string | null;
}

interface TransferLog {
  token_id: string;
  from_address: string;
  to_address: string;
  block_number: number;
  contract_address: string;
  gas_price: number;
  gas_used: number;
  transaction_hash: string;
  token_uri: string;
}

interface UserCredential {
  tokenId: number;
  userName: string;
  address: string;
  trustScore: number;
}
