import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { isAddress } from "ethers";
import { config } from "./config.js";
import { signSession, verifySession, verifySignature, parseNonceFromMessage } from "./auth.js";
import { createNonce, consumeNonce } from "./store.js";
import { hasSbtCredential } from "./sbt.js";
import { callDifyChat } from "./dify.js";
import type { VerifyRequestBody, ChatRequestBody } from "./types.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, env: config.nodeEnv });
});

app.get("/auth/nonce", authLimiter, (req, res) => {
  const address = String(req.query.address ?? "").trim();
  if (!isAddress(address)) {
    return res.status(400).json({ error: "invalid_address" });
  }

  const nonce = createNonce(address, config.nonceTtlMs);
  const issuedAt = new Date().toISOString();

  const message = [
    "Open Campus Optional Login",
    `domain: ${req.hostname}`,
    `chainId: ${config.chainId}`,
    `address: ${address.toLowerCase()}`,
    `nonce: ${nonce}`,
    `issuedAt: ${issuedAt}`,
  ].join("\n");

  return res.json({ nonce, message, issuedAt, expiresInMs: config.nonceTtlMs });
});

app.post("/auth/verify", authLimiter, async (req, res) => {
  const body = req.body as VerifyRequestBody;
  const address = String(body.address ?? "").trim().toLowerCase();
  const message = String(body.message ?? "");
  const signature = String(body.signature ?? "");

  if (!isAddress(address) || !message || !signature) {
    return res.status(400).json({ error: "invalid_request" });
  }

  const nonce = parseNonceFromMessage(message);
  if (!nonce) {
    return res.status(400).json({ error: "missing_nonce" });
  }

  const nonceValid = consumeNonce(address, nonce);
  if (!nonceValid) {
    return res.status(401).json({ error: "invalid_or_expired_nonce" });
  }

  const signatureValid = verifySignature(address, message, signature);
  if (!signatureValid) {
    return res.status(401).json({ error: "invalid_signature" });
  }

  const hasBadge = await hasSbtCredential(address);
  if (!hasBadge) {
    return res.status(403).json({ error: "badge_required" });
  }

  const token = signSession(address);

  res.cookie("oc_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.nodeEnv === "production",
    maxAge: 30 * 60 * 1000,
  });

  return res.json({ ok: true, address, hasBadge: true });
});

app.get("/auth/me", (req, res) => {
  const token = req.cookies?.oc_token as string | undefined;
  if (!token) {
    return res.status(401).json({ error: "missing_token" });
  }

  const payload = verifySession(token);
  if (!payload) {
    return res.status(401).json({ error: "invalid_token" });
  }

  return res.json({ ok: true, address: payload.sub, chainId: payload.chainId });
});

app.post("/auth/logout", (_req, res) => {
  res.clearCookie("oc_token");
  return res.json({ ok: true });
});

app.post("/chat", chatLimiter, async (req, res) => {
  const token = req.cookies?.oc_token as string | undefined;
  const payload = token ? verifySession(token) : null;

  const body = req.body as ChatRequestBody;
  const query = String(body.query ?? "").trim();

  if (!query) {
    return res.status(400).json({ error: "query_required" });
  }

  const guestUser = `guest:${String(req.ip ?? "unknown")}`;
  const userId = payload?.sub ?? guestUser;

  try {
    const data = await callDifyChat(query, userId, body.conversation_id);
    return res.json({ ok: true, auth: Boolean(payload), data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "chat_failed";
    return res.status(502).json({ error: "dify_error", message });
  }
});

app.listen(config.port, () => {
  console.log(`backend listening on http://localhost:${config.port}`);
});
