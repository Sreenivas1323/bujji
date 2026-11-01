import type { Config } from "../config.ts";
import type { Source } from "../types.ts";
import { beeper } from "./beeper.ts";
import { bluesky } from "./bluesky.ts";
import { feed, reddit, youtubeChannel } from "./feeds.ts";
import { youtubeMine } from "./youtube.ts";

export function sourcesFrom(cfg: Config["sources"]): Source[] {
  const out: Source[] = [];
  if (cfg.beeper?.enabled) out.push(beeper(cfg.beeper));
  if (cfg.bluesky) out.push(bluesky(cfg.bluesky));
  if (cfg.youtube?.myChannelId) out.push(youtubeMine(cfg.youtube.myChannelId));
  for (const id of cfg.youtube?.watch ?? []) out.push(youtubeChannel(id, "friends"));
  for (const sub of cfg.reddit?.subreddits ?? []) out.push(reddit(sub));
  for (const f of cfg.rss ?? []) out.push(feed(f.name, f.url, f.section));
  return out;
}
