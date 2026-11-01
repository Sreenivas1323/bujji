import type { Config } from "../config.ts";
import type { Item, Section, Source } from "../types.ts";

const API = "https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed";

interface FeedItem {
  post: {
    uri: string;
    author: { handle: string; displayName?: string };
    record: { text?: string; createdAt: string };
    likeCount?: number;
    repostCount?: number;
    replyCount?: number;
    quoteCount?: number;
  };
  reason?: unknown;
}

/** Bluesky's public API: your own posts (with engagement) and friends' posts. No login needed. */
export function bluesky(cfg: NonNullable<Config["sources"]["bluesky"]>): Source {
  return {
    name: "bluesky",
    async collect(since) {
      const jobs: Promise<Item[]>[] = (cfg.friends ?? []).map((h) => authorFeed(h, "friends", since));
      // Your own posts look back a week so the analysis can spot what keeps performing.
      if (cfg.me) jobs.push(authorFeed(cfg.me, "my-posts", new Date(since.getTime() - 6 * 864e5)));
      return (await Promise.all(jobs)).flat();
    },
  };
}

async function authorFeed(handle: string, section: Section, since: Date): Promise<Item[]> {
  const res = await fetch(`${API}?actor=${encodeURIComponent(handle)}&limit=50&filter=posts_no_replies`);
  if (!res.ok) throw new Error(`bluesky ${handle}: HTTP ${res.status}`);
  const { feed } = (await res.json()) as { feed: FeedItem[] };
  return feed
    .filter((f) => !f.reason && new Date(f.post.record.createdAt) > since)
    .map(({ post }) => ({
      section,
      source: "bluesky",
      author: post.author.displayName || post.author.handle,
      text: post.record.text ?? "",
      url: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split("/").pop()}`,
      at: new Date(post.record.createdAt),
      stats: {
        likes: post.likeCount ?? 0,
        reposts: post.repostCount ?? 0,
        replies: post.replyCount ?? 0,
        quotes: post.quoteCount ?? 0,
      },
    }));
}
