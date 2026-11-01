#!/usr/bin/env bun
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import Anthropic from "@anthropic-ai/sdk";
import { collectAll } from "./collect.ts";
import { loadConfig } from "./config.ts";
import { writeDigest } from "./digest.ts";
import { previousRun, saveRun } from "./outputs/files.ts";
import { sendTelegram } from "./outputs/telegram.ts";
import { sourcesFrom } from "./sources/index.ts";

const HELP = `bujji: your social space in one daily brief, so you can create instead of scroll.

Usage:
  bujji init                 Create bujji.config.yaml and .env from the examples
  bujji collect              Fetch everything and print what was found (no AI, nothing sent)
  bujji run                  Fetch, write the brief with Claude, save it, and send it

Options:
  -c, --config <path>        Config file (default: ./bujji.config.yaml)
      --hours <n>            Override the lookback window
      --no-send              Write the brief but don't send it anywhere
  -h, --help                 Show this help`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    config: { type: "string", short: "c", default: "bujji.config.yaml" },
    hours: { type: "string" },
    "no-send": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});
const command = positionals[0];

if (values.help || !command) {
  console.log(HELP);
  process.exit(command || values.help ? 0 : 1);
}

if (command === "init") {
  const root = fileURLToPath(new URL("..", import.meta.url));
  for (const [from, to] of [["bujji.config.example.yaml", values.config!], [".env.example", ".env"]] as const) {
    if (existsSync(to)) console.log(`exists  ${to}`);
    else {
      copyFileSync(join(root, from), to);
      console.log(`created ${to}`);
    }
  }
  console.log("\nFill in both files, then try `bujji collect`.");
  process.exit(0);
}

if (command !== "collect" && command !== "run") {
  console.error(`Unknown command "${command}".\n\n${HELP}`);
  process.exit(1);
}

const cfg = loadConfig(values.config!);
if (values.hours) cfg.lookbackHours = Number(values.hours);
const now = new Date();
const since = new Date(now.getTime() - cfg.lookbackHours * 36e5);
const sources = sourcesFrom(cfg.sources);
if (!sources.length) {
  console.error("No sources are configured. Add some under `sources:` in your config.");
  process.exit(1);
}

console.error(`Bujji is checking ${sources.length} sources since ${since.toLocaleString()}...`);
const { items, failures } = await collectAll(sources, since);
for (const f of failures) console.error(`  ✗ ${f.source}: ${f.error}`);
const counts = Object.entries(Object.groupBy(items, (i) => i.section)).map(([s, l]) => `${s}: ${l!.length}`);
console.error(`  ✓ ${items.length} items (${counts.join(", ") || "nothing new"})`);

if (command === "collect") {
  for (const i of items) {
    const stats = i.stats ? `  ${JSON.stringify(i.stats)}` : "";
    console.log(`[${i.section}] ${i.source}${i.title ? ` · ${i.title}` : ""}${i.author ? ` · ${i.author}` : ""}: ${i.text.slice(0, 120)}${stats}`);
  }
  process.exit(0);
}

if (!items.length) {
  console.error("Nothing happened in the window. No brief today.");
  process.exit(0);
}

const previous = previousRun(cfg.outputs.dir, now);
saveRun(cfg.outputs.dir, now, items);
console.error(`Writing the brief with ${cfg.llm.model}...`);
let digest: string;
try {
  digest = await writeDigest(cfg, items, previous, now);
} catch (err) {
  if (err instanceof Anthropic.AuthenticationError || (err instanceof Error && /authentication method/i.test(err.message))) {
    console.error("No Claude credentials. Set ANTHROPIC_API_KEY in .env (console.anthropic.com).");
  } else if (err instanceof Anthropic.RateLimitError) {
    console.error("Claude rate limit hit. Try again in a minute.");
  } else if (err instanceof Anthropic.APIError) {
    console.error(`Claude API error ${err.status}: ${err.message}`);
  } else {
    console.error(err instanceof Error ? err.message : err);
  }
  process.exit(1);
}
if (failures.length) {
  digest += `\n\n---\nCouldn't reach: ${failures.map((f) => f.source).join(", ")}`;
}
const path = saveRun(cfg.outputs.dir, now, items, digest);
console.error(`  ✓ saved ${path}`);

if (cfg.outputs.telegram && !values["no-send"]) {
  await sendTelegram(cfg.outputs.telegram.chatId, digest);
  console.error("  ✓ sent to Telegram");
}
console.log(digest);
