import { config } from "./config.js";

export async function callDifyChat(query: string, userId: string, conversationId?: string) {
  if (!config.difyApiKey) {
    throw new Error("DIFY_API_KEY is not configured");
  }

  const response = await fetch(`${config.difyApiBase}/chat-messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.difyApiKey}`,
    },
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: "blocking",
      user: `${config.difyAppUserPrefix}:${userId}`,
      conversation_id: conversationId,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Dify request failed: ${response.status} ${text}`);
  }

  return await response.json();
}
