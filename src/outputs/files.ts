import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Item } from "../types.ts";

const day = (d: Date) => d.toISOString().slice(0, 10);

export function saveRun(dir: string, now: Date, items: Item[], digest?: string): string {
  mkdirSync(join(dir, "data"), { recursive: true });
  writeFileSync(join(dir, "data", `${day(now)}.json`), JSON.stringify(items, null, 2));
  const path = join(dir, `${day(now)}.md`);
  if (digest) writeFileSync(path, digest);
  return path;
}

/** The most recent earlier run's items, so the brief can say "up 40% since yesterday". */
export function previousRun(dir: string, now: Date): Item[] {
  const dataDir = join(dir, "data");
  if (!existsSync(dataDir)) return [];
  const last = readdirSync(dataDir)
    .filter((f) => f.endsWith(".json") && f < `${day(now)}.json`)
    .sort()
    .at(-1);
  if (!last) return [];
  const raw = JSON.parse(readFileSync(join(dataDir, last), "utf8")) as (Item & { at: string })[];
  return raw.map((i) => ({ ...i, at: new Date(i.at) }));
}
