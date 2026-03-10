import { isAddress, verifyMessage } from "ethers";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { SessionPayload } from "./types.js";
import { config } from "./config.js";

export function parseNonceFromMessage(message: string): string | null {
  const matched = message.match(/nonce\s*:\s*([a-fA-F0-9]+)/i);
  if (!matched) return null;
  return matched[1];
}

export function verifySignature(address: string, message: string, signature: string): boolean {
  if (!isAddress(address)) return false;
  const recovered = verifyMessage(message, signature);
  return recovered.toLowerCase() === address.toLowerCase();
}

export function signSession(address: string): string {
  const payload: SessionPayload = {
    sub: address.toLowerCase(),
    chainId: config.chainId,
  };

  const options: SignOptions = {
    expiresIn: config.jwtExpiresInSeconds,
  };

  return jwt.sign(payload, config.jwtSecret, options);
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as SessionPayload;
  } catch {
    return null;
  }
}
