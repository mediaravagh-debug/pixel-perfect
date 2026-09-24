import { useCallback, useEffect, useState } from "react";

export type PostStatus = "draft" | "published" | "idea";

export interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  status: PostStatus;
  createdAt: number;
  updatedAt: number;
  impressions: number;
  reactions: number;
  comments: number;
}

const KEY = "proof.posts.v1";

export const makeId = () => Math.random().toString(36).slice(2, 10);

export function firstLine(content: string) {
  const line = content.split("\n").find((l) => l.trim().length > 0);
  return line ? line.trim().slice(0, 80) : "Untitled post";
}

export function emptyPost(status: PostStatus = "draft"): Post {
  const now = Date.now();
  return {
    id: makeId(),
    title: "",
    content: "",
    status,
    createdAt: now,
    updatedAt: now,
    impressions: 0,
    reactions: 0,
    comments: 0,
  };
}

const seed = (): Post[] => {
  const now = Date.now();
  const hour = 3600_000;
  return [
    {
      id: "seed-draft-1",
      title: "",
      content:
        "Pricing is a story, not a table.\n\nWe spent six weeks A/B testing numbers before we realised the numbers were never the problem. The page never told anyone who the product was for.\n\nWe rewrote three sentences. Conversion moved 22%.",
      status: "draft",
      createdAt: now - 6 * hour,
      updatedAt: now - 2 * hour,
      impressions: 0,
      reactions: 0,
      comments: 0,
    },
    {
      id: "seed-pub-1",
      title: "",
      content:
        "Why we killed our onboarding email.\n\nIt had a 41% open rate and taught nobody anything. We replaced it with a single in-product checklist and activation went up 18% in a fortnight.\n\nThe lesson: the best email is often the one you don't send.",
      status: "published",
      createdAt: now - 72 * hour,
      updatedAt: now - 72 * hour,
      impressions: 12400,
      reactions: 318,
      comments: 47,
    },
    {
      id: "seed-pub-2",
      title: "",
      content:
        "Stop writing LinkedIn posts. Start writing letters.\n\nOne person. One problem. One sentence you'd actually say out loud.",
      status: "published",
      createdAt: now - 120 * hour,
      updatedAt: now - 120 * hour,
      impressions: 35800,
      reactions: 902,
      comments: 131,
    },
    {
      id: "seed-idea-1",
      title: "",
      content:
        "The 3-line founder confession — the thing I got wrong in year one and still think about.",
      status: "idea",
      createdAt: now - 24 * hour,
      updatedAt: now - 24 * hour,
      impressions: 0,
      reactions: 0,
      comments: 0,
    },
    {
      id: "seed-idea-2",
      title: "",
      content: "Poll: what's the worst onboarding experience you've ever sat through?",
      status: "idea",
      createdAt: now - 30 * hour,
      updatedAt: now - 30 * hour,
      impressions: 0,
      reactions: 0,
      comments: 0,
    },
  ];
};

function read(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      window.localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Post[];
  } catch {
    return [];
  }
}

function write(posts: Post[]) {
  window.localStorage.setItem(KEY, JSON.stringify(posts));
  window.dispatchEvent(new Event("proof:posts"));
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    setPosts(read());
    const sync = () => setPosts(read());
    window.addEventListener("proof:posts", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("proof:posts", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const save = useCallback((post: Post) => {
    const all = read();
    const idx = all.findIndex((p) => p.id === post.id);
    const next = { ...post, updatedAt: Date.now() };
    if (idx >= 0) all[idx] = next;
    else all.unshift(next);
    write(all);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((p) => p.id !== id));
  }, []);

  const get = useCallback((id: string) => read().find((p) => p.id === id), []);

  return { posts, save, remove, get };
}

export function timeAgo(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function stats(content: string) {
  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.round(words / 220));
  return { chars, words, minutes };
}
