export type Section = "messages" | "friends" | "my-posts" | "trends";

/** One thing that happened in your social space, normalized across platforms. */
export interface Item {
  section: Section;
  /** Where it came from, e.g. "whatsapp", "bluesky", "r/SideProject". */
  source: string;
  author?: string;
  /** Chat name for messages, post/video title for feeds. */
  title?: string;
  text: string;
  url?: string;
  at: Date;
  /** Engagement numbers: likes, views, replies, reposts... */
  stats?: Record<string, number>;
}

export interface Source {
  name: string;
  collect(since: Date): Promise<Item[]>;
}
