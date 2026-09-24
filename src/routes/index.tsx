import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { type Post, emptyPost, firstLine, stats, timeAgo, usePosts } from "@/lib/posts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Proof — LinkedIn Post Composer" },
      {
        name: "description",
        content:
          "Write LinkedIn posts with a live feed preview, drafts, saved ideas and an AI writing assistant.",
      },
      { property: "og:title", content: "Proof — LinkedIn Post Composer" },
      {
        property: "og:description",
        content: "A calm writing tool for LinkedIn: live preview, drafts, ideas and AI help.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { posts, remove } = usePosts();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => posts.filter((p) => p.content.toLowerCase().includes(query.toLowerCase())),
    [posts, query],
  );

  const drafts = filtered.filter((p) => p.status === "draft");
  const published = filtered.filter((p) => p.status === "published");
  const ideas = filtered.filter((p) => p.status === "idea");

  const totals = posts.reduce(
    (acc, p) => ({
      impressions: acc.impressions + p.impressions,
      reactions: acc.reactions + p.reactions,
      comments: acc.comments + p.comments,
    }),
    { impressions: 0, reactions: 0, comments: 0 },
  );
  const engagement = totals.impressions
    ? (((totals.reactions + totals.comments) / totals.impressions) * 100).toFixed(1)
    : "0.0";

  const newPost = () => navigate({ to: "/editor/$id", params: { id: emptyPost().id } });

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      <div className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-accent/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 size-[560px] rounded-full bg-accent-2/10 blur-[130px]" />

      <div className="relative mx-auto max-w-[1440px] px-6 py-6">
        <header className="rise mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 font-display text-lg font-black text-ink">
              P
            </div>
            <div>
              <div className="font-display text-lg leading-none font-extrabold tracking-tight">
                Proof
              </div>
              <div className="label-mono">LinkedIn Composer</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex w-72 items-center gap-2 rounded-full border border-line bg-panel/70 px-4 py-2">
              <span className="font-mono text-xs text-fog-2">/</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search drafts, ideas, posts…"
                className="w-full bg-transparent text-sm text-paper placeholder:text-fog focus:outline-none"
              />
            </div>
            <button
              onClick={newPost}
              className="rounded-full bg-accent px-4 py-2 font-display text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              New Post
            </button>
          </div>
        </header>

        <section className="rise mb-8" style={{ animationDelay: "80ms" }}>
          <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-panel-2 to-panel p-8">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-white/[0.03]" />
            <div className="relative max-w-2xl">
              <div className="label-mono mb-3">(a) Start writing</div>
              <h1 className="font-display text-4xl leading-[1.1] font-extrabold tracking-tight text-balance">
                One idea. One proof point. One ask.
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-paper/75">
                Draft on the left, see the real feed card on the right, and let the assistant sharpen
                the hook before anyone else reads it.
              </p>
              <button
                onClick={newPost}
                className="mt-5 rounded-md bg-accent px-5 py-2 font-display text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                New Post
              </button>
            </div>
          </div>
        </section>

        <section className="rise" style={{ animationDelay: "160ms" }}>
          <div className="mb-3 flex items-center justify-between">
            <div className="label-mono">(b) Library</div>
            <div className="flex items-center gap-4 font-mono text-[11px] text-fog-2">
              <span>
                Impressions <span className="font-medium text-paper">{totals.impressions.toLocaleString()}</span>
              </span>
              <span>
                Engagement <span className="font-medium text-accent">{engagement}%</span>
              </span>
              <span>
                Published <span className="font-medium text-paper">{published.length}</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Column label="Recent Drafts" posts={drafts} onDelete={remove} empty="No drafts yet." />
            <Column label="Published" posts={published} onDelete={remove} empty="Nothing published yet." />
            <Column label="Saved Ideas" posts={ideas} onDelete={remove} empty="No saved ideas." />
          </div>
        </section>
      </div>
    </div>
  );
}

function Column({
  label,
  posts,
  empty,
  onDelete,
}: {
  label: string;
  posts: Post[];
  empty: string;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="label-mono">{label}</div>
      {posts.length === 0 && <p className="text-xs text-fog-2">{empty}</p>}
      {posts.map((post) => {
        const { chars } = stats(post.content);
        return (
          <div
            key={post.id}
            className="group rounded-xl border border-line bg-gradient-to-br from-panel-2 to-panel p-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40"
          >
            <Link to="/editor/$id" params={{ id: post.id }} className="block">
              <div className="mb-1 font-display text-lg leading-tight font-bold tracking-tight">
                {firstLine(post.content)}
              </div>
              <div className="text-xs text-fog-2">
                {post.status === "published"
                  ? `${timeAgo(post.updatedAt)} · ${post.impressions.toLocaleString()} impressions`
                  : `${timeAgo(post.updatedAt)} · ${chars} chars`}
              </div>
            </Link>
            <button
              onClick={() => onDelete(post.id)}
              className="mt-2 font-mono text-[10px] tracking-[0.15em] text-fog-2 uppercase opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
            >
              Delete
            </button>
          </div>
        );
      })}
    </div>
  );
}
