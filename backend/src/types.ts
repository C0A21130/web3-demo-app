export type NonceRecord = {
  nonce: string;
  expiresAt: number;
};

export type SessionPayload = {
  sub: string;
  chainId: number;
  iat?: number;
  exp?: number;
};

export type VerifyRequestBody = {
  address: string;
  message: string;
  signature: string;
};

export type ChatRequestBody = {
  query: string;
  conversation_id?: string;
};
