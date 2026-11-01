import { existsSync, readFileSync } from "node:fs";
import { parse } from "yaml";

export interface Config {
  you: { name: string; niche?: string; voice?: string; goals?: string };
  lookbackHours: number;
  llm: { model: string; effort: "low" | "medium" | "high" | "xhigh" | "max" };
  sources: {
    beeper?: { enabled: boolean; skipChats?: string[]; includeMuted?: boolean; maxMessages?: number };
    bluesky?: { me?: string; friends?: string[] };
    youtube?: { myChannelId?: string; watch?: string[] };
    reddit?: { subreddits: string[] };
    rss?: { name: string; url: string; section?: "friends" | "trends" }[];
  };
  outputs: {
    dir: string;
    telegram?: { chatId: string };
  };
}

const DEFAULTS = {
  lookbackHours: 24,
  llm: { model: "claude-opus-5-5", effort: "medium" },
  outputs: { dir: "./digests" },
} as const;

export function loadConfig(path: string): Config {
  if (!existsSync(path)) {
    throw new Error(`No config at ${path}. Run \`bujji init\` to create one.`);
  }
  const raw = parse(readFileSync(path, "utf8")) ?? {};
  if (!raw.you?.name) throw new Error(`${path}: "you.name" is required.`);
  return {
    ...raw,
    lookbackHours: raw.lookbackHours ?? DEFAULTS.lookbackHours,
    llm: { ...DEFAULTS.llm, ...raw.llm },
    sources: raw.sources ?? {},
    outputs: { ...DEFAULTS.outputs, ...raw.outputs },
  };
}

/** Secrets never live in the config file; they come from the environment (Bun loads .env automatically). */
export function secret(name: string): string | undefined {
  return process.env[name] || undefined;
}
