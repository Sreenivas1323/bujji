import { secret } from "../config.ts";
import type { Item, Source } from "../types.ts";

const API = "https://www.googleapis.com/youtube/v3";

/** Your latest uploads with live view/like/comment counts. Needs a free YOUTUBE_API_KEY. */
export function youtubeMine(channelId: string): Source {
  return {
    name: "youtube",
    async collect() {
      const key = secret("YOUTUBE_API_KEY");
      if (!key) throw new Error("YOUTUBE_API_KEY is not set (Google Cloud console → YouTube Data API v3).");
      const get = async (path: string) => {
        const res = await fetch(`${API}/${path}&key=${key}`);
        if (!res.ok) throw new Error(`youtube: HTTP ${res.status}`);
        return res.json() as Promise<any>;
      };
      const channel = await get(`channels?part=contentDetails&id=${channelId}`);
      const uploads = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploads) throw new Error(`youtube: channel ${channelId} not found`);
      const recent = await get(`playlistItems?part=contentDetails&maxResults=10&playlistId=${uploads}`);
      const ids = recent.items.map((i: any) => i.contentDetails.videoId).join(",");
      const videos = await get(`videos?part=snippet,statistics&id=${ids}`);
      return videos.items.map(
        (v: any): Item => ({
          section: "my-posts",
          source: "youtube",
          title: v.snippet.title,
          text: v.snippet.description.slice(0, 300),
          url: `https://youtu.be/${v.id}`,
          at: new Date(v.snippet.publishedAt),
          stats: {
            views: Number(v.statistics.viewCount ?? 0),
            likes: Number(v.statistics.likeCount ?? 0),
            comments: Number(v.statistics.commentCount ?? 0),
          },
        }),
      );
    },
  };
}
