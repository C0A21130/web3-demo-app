import { randomBytes } from "crypto";
import type { NonceRecord } from "./types.js";

const nonceStore = new Map<string, NonceRecord>();

export function createNonce(address: string, ttlMs: number): string {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = Date.now() + ttlMs;
  nonceStore.set(address.toLowerCase(), { nonce, expiresAt });
  return nonce;
}

export function consumeNonce(address: string, nonce: string): boolean {
  const key = address.toLowerCase();
  const record = nonceStore.get(key);
  nonceStore.delete(key);

  if (!record) return false;
  if (Date.now() > record.expiresAt) return false;
  return record.nonce === nonce;
}
