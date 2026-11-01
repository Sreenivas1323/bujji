import { XMLParser } from "fast-xml-parser";
import type { Item, Section, Source } from "../types.ts";

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
const asArray = <T>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const textOf = (v: unknown): string =>
  typeof v === "string" ? v : typeof v === "object" && v && "#text" in v ? String(v["#text"]) : "";
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();

/** Any RSS or Atom feed. With RSSHub (https://docs.rsshub.app) that covers most public profiles on most platforms. */
export function feed(name: string, url: string, section: Section = "trends"): Source {
  return {
    name,
    async collect(since) {
      const res = await fetch(url, { headers: { "User-Agent": "bujji/0.1 (+https://github.com/Sreenivas1323/bujji)" } });
      if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
      const doc = xml.parse(await res.text());
      const entries = asArray(doc.rss?.channel?.item ?? doc.feed?.entry);
      return entries
        .map((e: any): Item => {
          const link = typeof e.link === "string" ? e.link : asArray(e.link).find((l: any) => l.rel !== "self")?.href;
          const body = textOf(e.description ?? e.summary ?? e.content ?? e["media:group"]?.["media:description"]);
          const views = Number(e["media:group"]?.["media:community"]?.["media:statistics"]?.views);
          return {
            section,
            source: name,
            author: textOf(e.author?.name ?? e.author ?? e["dc:creator"]) || undefined,
            title: stripHtml(textOf(e.title)),
            text: stripHtml(body).slice(0, 500),
            url: link,
            at: new Date(e.pubDate ?? e.published ?? e.updated),
            stats: Number.isFinite(views) ? { views } : undefined,
          };
        })
        .filter((i) => i.at > since);
    },
  };
}

export const reddit = (sub: string) =>
  feed(`r/${sub}`, `https://www.reddit.com/r/${sub}/top/.rss?t=day&limit=15`, "trends");

export const youtubeChannel = (channelId: string, section: Section) =>
  feed(`youtube:${channelId}`, `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, section);
