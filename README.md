# Bujji

**Your social space in one daily brief, so you can create instead of scroll.**

Bujji reads your messages, your friends' posts, your own post analytics and what's trending in your niche. Every morning it hands you one short brief: who needs a reply, what your people are up to, what's working in your content, and 3-5 ideas to make today.

> Named after Bujji, Bhairava's AI sidekick in *Kalki 2898 AD*: small, loyal, always watching your back.

> 🗳️ **The name isn't final.** Bujji, Kattappa or Eega? [Vote in the name poll](https://github.com/Sreenivas1323/bujji/issues/1) (open until November 16, 2026).

An example brief (made-up data):

```
# Bujji's brief: Sat Nov 01 2026

## The 60-second version
- Ravi wants an answer on Friday dinner; the group is waiting on you.
- Your "I quit Notion" short is at 3x your usual views. Make a follow-up.
- r/SideProject is full of "real numbers" posts today. Your launch numbers would land.

## Who needs you
...
## Make this today
1. "I tracked every hour for 30 days. 11 of them were Instagram." (60s vertical, YouTube Shorts + Reels) ...
```

## What it reads

| Source | What you get | Setup |
|---|---|---|
| **Beeper** | DMs and group chats from WhatsApp, Instagram, Telegram, Signal, LinkedIn, Discord, Slack, iMessage and more, all from one local API | [Beeper Desktop](https://www.beeper.com) running, plus an access token |
| **Bluesky** | Your posts with likes, reposts and replies; your friends' posts | Just handles. Public API, no login |
| **YouTube** | Your latest uploads with views, likes and comments; new videos from creators you follow | Free API key for your own stats; nothing for following |
| **Reddit** | Top posts of the day in your subreddits | Nothing |
| **Any RSS/Atom** | Hacker News, newsletters, blogs, and through [RSSHub](https://docs.rsshub.app) most public profiles on most platforms | A URL |

Bujji is **read-only**. It never posts, likes or sends messages.

## Quick start

Requires [Bun](https://bun.sh) 1.2+ and a [Claude API key](https://console.anthropic.com).

```sh
git clone https://github.com/Sreenivas1323/bujji && cd bujji
bun install && bun link        # puts `bujji` on your PATH

mkdir ~/bujji && cd ~/bujji
bujji init                     # creates bujji.config.yaml and .env
# fill in both files

bujji collect                  # see what Bujji finds (no AI, nothing sent)
bujji run                      # write today's brief
```

Briefs are saved to `digests/YYYY-MM-DD.md`. Add a Telegram bot in the config to get them on your phone.

### Every morning

Bujji runs on your machine, because that's where your messages are. On macOS or Linux, add a cron entry with `crontab -e`:

```
30 7 * * * cd ~/bujji && ~/.bun/bin/bujji run >> bujji.log 2>&1
```

## Privacy

- Everything is fetched on your machine. The only thing that leaves it is the text Bujji sends to Claude to write the brief, and the brief itself if you turn on Telegram.
- Use `beeper.skipChats` for conversations that must never leave your machine.
- Secrets live in `.env`; your config and briefs are git-ignored.
- Chat and feed content is passed to the model as data, never as instructions.

## Why not Instagram / X / LinkedIn feeds?

Those platforms don't offer an API for your home feed or your friends' posts, and scraping them breaks their terms and can get your account flagged. Bujji covers them where it legitimately can:

- **Messages** on all of them, through Beeper.
- **Public profiles** through RSSHub feeds.
- **Your own analytics** through official APIs (Instagram Graph API and X API connectors are on the roadmap).

## Adding a source

A source is one file that returns items:

```ts
import type { Source } from "../types.ts";

export const mySource = (): Source => ({
  name: "my-source",
  async collect(since) {
    return [{ section: "trends", source: "my-source", text: "...", at: new Date() }];
  },
});
```

Register it in `src/sources/index.ts`. PRs welcome.

## Roadmap

- [ ] Instagram Graph API and X API for your own post insights
- [ ] Mastodon, Threads, TikTok (official APIs)
- [ ] Email delivery and a small web view of past briefs
- [ ] Local models (Ollama) for fully offline briefs
- [ ] Weekly "what worked this week" report

## License

MIT
