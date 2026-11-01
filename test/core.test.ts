import { describe, expect, test } from "bun:test";
import { render } from "../src/digest.ts";
import { chunks } from "../src/outputs/telegram.ts";
import type { Item } from "../src/types.ts";

describe("telegram chunks", () => {
  test("keeps short text whole", () => {
    expect(chunks("hello\n\nworld")).toEqual(["hello\n\nworld"]);
  });
  test("splits long text under the limit without losing anything", () => {
    const text = Array.from({ length: 50 }, (_, i) => `para ${i} `.repeat(30)).join("\n\n");
    const parts = chunks(text);
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) expect(p.length).toBeLessThanOrEqual(4000);
    expect(parts.join("\n\n")).toBe(text);
  });
});

describe("render", () => {
  const at = new Date("2026-11-01T08:00:00Z");
  const items: Item[] = [
    { section: "messages", source: "whatsapp", title: "Ravi", author: "Ravi", text: "Dinner Friday?", at },
    { section: "my-posts", source: "youtube", title: "My video", text: "", url: "https://youtu.be/x", at, stats: { views: 1200 } },
  ];
  test("groups by section and includes stats and links", () => {
    const out = render(items, []);
    expect(out).toContain("## MESSAGES");
    expect(out).toContain("whatsapp · Ravi · Ravi: Dinner Friday?");
    expect(out).toContain("{views: 1200} <https://youtu.be/x>");
    expect(out).not.toContain("PREVIOUS RUN");
  });
  test("adds previous numbers for the user's own posts", () => {
    const out = render(items, [{ ...items[1]!, stats: { views: 800 } }]);
    expect(out).toContain('https://youtu.be/x {"views":800}');
  });
});
