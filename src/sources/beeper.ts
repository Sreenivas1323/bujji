import BeeperDesktop from "@beeper/desktop-api";
import type { Config } from "../config.ts";
import { secret } from "../config.ts";
import type { Item, Source } from "../types.ts";

/**
 * Reads your DMs and group chats from every network Beeper Desktop is connected to
 * (WhatsApp, Instagram, Telegram, Signal, LinkedIn, Discord, Slack, iMessage...).
 * Read-only: Bujji never sends messages. Beeper Desktop must be running.
 */
export function beeper(cfg: NonNullable<Config["sources"]["beeper"]>): Source {
  return {
    name: "beeper",
    async collect(since) {
      const accessToken = secret("BEEPER_ACCESS_TOKEN");
      if (!accessToken) throw new Error("BEEPER_ACCESS_TOKEN is not set (Beeper Desktop → Settings → Developers).");
      const client = new BeeperDesktop({ accessToken });
      const skip = new Set((cfg.skipChats ?? []).map((s) => s.toLowerCase()));
      const max = cfg.maxMessages ?? 400;
      const chats = new Map<string, { title: string; network: string }>();
      const items: Item[] = [];

      for await (const msg of client.messages.search({
        dateAfter: since.toISOString(),
        includeMuted: cfg.includeMuted ?? false,
      })) {
        if (items.length >= max) break;
        if (msg.isDeleted || msg.isHidden || !msg.text?.trim()) continue;

        let chat = chats.get(msg.chatID);
        if (!chat) {
          const c = await client.chats.retrieve(msg.chatID);
          chat = { title: c.title, network: c.network };
          chats.set(msg.chatID, chat);
        }
        if (skip.has(chat.title.toLowerCase())) continue;

        items.push({
          section: "messages",
          source: chat.network.toLowerCase(),
          title: chat.title,
          author: msg.isSender ? "me" : (msg.senderName ?? "someone"),
          text: msg.text,
          at: new Date(msg.timestamp),
          stats: msg.isUnread ? { unread: 1 } : undefined,
        });
      }
      return items;
    },
  };
}
