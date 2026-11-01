import { secret } from "../config.ts";

const LIMIT = 4000; // Telegram caps messages at 4096 characters.

/** Sends the brief to a Telegram chat via your own bot (create one with @BotFather). */
export async function sendTelegram(chatId: string, text: string): Promise<void> {
  const token = secret("TELEGRAM_BOT_TOKEN");
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set.");
  for (const chunk of chunks(text)) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk, disable_web_page_preview: true }),
    });
    if (!res.ok) throw new Error(`telegram: HTTP ${res.status} ${await res.text()}`);
  }
}

export function chunks(text: string): string[] {
  const out: string[] = [];
  let current = "";
  for (const para of text.split("\n\n")) {
    if (current && current.length + para.length + 2 > LIMIT) {
      out.push(current);
      current = "";
    }
    current = current ? `${current}\n\n${para}` : para;
    while (current.length > LIMIT) {
      out.push(current.slice(0, LIMIT));
      current = current.slice(LIMIT);
    }
  }
  if (current) out.push(current);
  return out;
}
