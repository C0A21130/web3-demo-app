import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8080),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 1800),
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
  chainId: Number(process.env.CHAIN_ID ?? 31337),
  rpcUrl: process.env.RPC_URL ?? "http://127.0.0.1:8545",
  sbtContractAddress: required("SBT_CONTRACT_ADDRESS"),
  staffIssuerPrivateKey: process.env.STAFF_ISSUER_PRIVATE_KEY ?? "",
  staffApiKey: process.env.STAFF_API_KEY ?? "",
  difyApiBase: process.env.DIFY_API_BASE ?? "https://api.dify.ai/v1",
  difyApiKey: process.env.DIFY_API_KEY ?? "",
  difyAppUserPrefix: process.env.DIFY_APP_USER_PREFIX ?? "open-campus",
  chatMockMode: (process.env.CHAT_MOCK_MODE ?? "false").toLowerCase() === "true",
  nonceTtlMs: 5 * 60 * 1000,
};
