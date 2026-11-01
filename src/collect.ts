import type { Item, Source } from "./types.ts";

export interface Collected {
  items: Item[];
  failures: { source: string; error: string }[];
}

/** Runs every source in parallel. One broken source never sinks the whole digest. */
export async function collectAll(sources: Source[], since: Date): Promise<Collected> {
  const results = await Promise.allSettled(sources.map((s) => s.collect(since)));
  const items: Item[] = [];
  const failures: Collected["failures"] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") items.push(...r.value);
    else failures.push({ source: sources[i]!.name, error: String(r.reason?.message ?? r.reason) });
  });
  items.sort((a, b) => a.at.getTime() - b.at.getTime());
  return { items, failures };
}
