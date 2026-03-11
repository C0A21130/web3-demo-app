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

export type BadgeIssueRequestBody = {
  address: string;
  userName: string;
};

export type BadgeIssueLog = {
  at: string;
  ok: boolean;
  to: string;
  userName: string;
  txHash?: string;
  error?: string;
};
