import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AIPanel } from "@/components/AIPanel";
import { LinkedInPreview } from "@/components/LinkedInPreview";
import { prefixLines, toBold, toItalic } from "@/lib/format";
import { type Post, emptyPost, stats, usePosts } from "@/lib/posts";

export const Route = createFileRoute("/editor/$id")({
  head: () => ({
    meta: [
      { title: "Composer — Proof LinkedIn Editor" },
      {
        name: "description",
        content:
          "Write a LinkedIn post with a live preview of the real feed card, live counters and an AI assistant.",
      },
      { property: "og:title", content: "Composer — Proof LinkedIn Editor" },
      {
        property: "og:description",
        content: "Write, preview and improve LinkedIn posts side by side.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorPage,
});

const EMOJIS = ["🚀", "💡", "📈", "🔥", "🙌", "👇", "✅", "🧠", "☕", "🎯"];

function EditorPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { get, save } = usePosts();
  const [post, setPost] = useState<Post | null>(null);
  const [saved, setSaved] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const existing = get(id);
    setPost(existing ?? { ...emptyPost(), id });
  }, [id, get]);

  useEffect(() => {
    if (!post || !post.content.trim()) return;
    const t = setTimeout(() => {
      save(post);
      setSaved(true);
    }, 800);
    return () => clearTimeout(t);
  }, [post, save]);

  if (!post) return null;
  const { chars, words, minutes } = stats(post.content);
  const update = (patch: Partial<Post>) => {
    setSaved(false);
    setPost((p) => (p ? { ...p, ...patch } : p));
  };

  const transformSelection = (fn: (s: string) => string) => {
    const el = areaRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    if (a === b) return;
    const next = post.content.slice(0, a) + fn(post.content.slice(a, b)) + post.content.slice(b);
    update({ content: next });
  };

  const insert = (text: string) => {
    const el = areaRef.current;
    const at = el ? el.selectionStart : post.content.length;
    update({ content: post.content.slice(0, at) + text + post.content.slice(at) });
  };

  const listify = (kind: "bullet" | "number") => {
    const el = areaRef.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const chunk = a === b ? post.content : post.content.slice(a, b);
    const transformed = prefixLines(chunk, kind);
    update({
      content: a === b ? transformed : post.content.slice(0, a) + transformed + post.content.slice(b),
    });
  };

  const publish = () => {
    save({
      ...post,
      status: "published",
      impressions: post.impressions || Math.round(800 + Math.random() * 6000),
      reactions: post.reactions || Math.round(20 + Math.random() * 200),
      comments: post.comments || Math.round(2 + Math.random() * 40),
    });
    toast.success("Marked as published in your library.");
    navigate({ to: "/" });
  };

  const toolBtn =
    "size-7 grid place-items-center rounded-md text-fog hover:bg-white/5 transition-colors";

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      <div className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-accent/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-40 size-[560px] rounded-full bg-accent-2/10 blur-[130px]" />

      <div className="relative mx-auto max-w-[1440px] px-6 py-6">
        <header className="rise mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 font-display text-lg font-black text-ink">
              P
            </div>
            <div>
              <div className="font-display text-lg leading-none font-extrabold tracking-tight">
                Proof
              </div>
              <div className="label-mono">LinkedIn Composer</div>
            </div>
          </Link>
          <Link
            to="/"
            className="rounded-full border border-line px-4 py-2 text-sm text-fog transition-colors hover:text-paper"
          >
            Back to library
          </Link>
        </header>

        <div className="grid grid-cols-12 gap-5">
          <section className="rise col-span-7" style={{ animationDelay: "80ms" }}>
            <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-b from-panel-2 to-panel p-5">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-white/[0.03]" />
              <div className="relative mb-4 flex items-center justify-between">
                <div className="label-mono flex items-center gap-1.5">
                  <span>(a) {post.status}</span>
                  <span>·</span>
                  <span>{saved ? "Autosaved" : "Editing"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => transformSelection(toBold)}
                    className={`${toolBtn} font-display font-bold`}
                    title="Bold selection"
                  >
                    B
                  </button>
                  <button
                    onClick={() => transformSelection(toItalic)}
                    className={`${toolBtn} font-display italic`}
                    title="Italic selection"
                  >
                    I
                  </button>
                  <button
                    onClick={() => listify("bullet")}
                    className={`${toolBtn} font-mono text-xs`}
                    title="Bulleted list"
                  >
                    •
                  </button>
                  <button
                    onClick={() => listify("number")}
                    className={`${toolBtn} font-mono text-xs`}
                    title="Numbered list"
                  >
                    1.
                  </button>
                  <button
                    onClick={() => insert("#")}
                    className={`${toolBtn} font-mono text-xs`}
                    title="Hashtag"
                  >
                    #
                  </button>
                  <button
                    onClick={() => insert("@")}
                    className={`${toolBtn} font-mono text-xs`}
                    title="Mention"
                  >
                    @
                  </button>
                  <button
                    onClick={() => insert("https://")}
                    className={`${toolBtn} font-mono text-xs`}
                    title="Link"
                  >
                    ↗
                  </button>
                  <button
                    onClick={() => {
                      const url = window.prompt("Image URL to attach");
                      if (url) update({ imageUrl: url });
                    }}
                    className={`${toolBtn} font-mono text-xs`}
                    title="Attach image"
                  >
                    ▣
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute top-0 -left-3 bottom-0 w-px bg-accent/40" />
                <textarea
                  ref={areaRef}
                  value={post.content}
                  onChange={(e) => update({ content: e.target.value })}
                  placeholder="Start with one sharp claim…"
                  className="min-h-[340px] w-full resize-none bg-transparent font-body text-[15px] leading-relaxed text-paper/90 placeholder:text-fog-2 focus:outline-none"
                />
              </div>

              <div className="relative mt-2 flex flex-wrap gap-1">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => insert(e)}
                    className="rounded-md px-1.5 py-1 text-base transition-colors hover:bg-white/5"
                  >
                    {e}
                  </button>
                ))}
                {post.imageUrl && (
                  <button
                    onClick={() => update({ imageUrl: undefined })}
                    className="ml-auto rounded-md border border-line px-2 py-1 text-xs text-fog-2 hover:text-paper"
                  >
                    Remove image
                  </button>
                )}
              </div>

              <div className="relative mt-6 flex items-center justify-between border-t border-line/60 pt-4">
                <div className="flex items-center gap-4 font-mono text-[11px] text-fog-2">
                  <span>{chars.toLocaleString()} / 3,000 chars</span>
                  <span>·</span>
                  <span>{words} words</span>
                  <span>·</span>
                  <span>~{minutes} min read</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      save({ ...post, status: "draft" });
                      setSaved(true);
                      toast.success("Draft saved.");
                    }}
                    className="rounded-md border border-line px-3 py-1.5 text-xs text-fog transition-colors hover:text-paper"
                  >
                    Save draft
                  </button>
                  <button
                    onClick={publish}
                    className="rounded-md bg-accent px-4 py-1.5 font-display text-xs font-bold text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    Publish
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="col-span-5 flex flex-col gap-5">
            <div className="rise" style={{ animationDelay: "160ms" }}>
              <div className="label-mono mb-2 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-accent" /> Live preview
              </div>
              <LinkedInPreview content={post.content} imageUrl={post.imageUrl} />
            </div>

            <div className="rise" style={{ animationDelay: "240ms" }}>
              <AIPanel
                content={post.content}
                onApply={(text) => update({ content: text })}
                onAppend={(text) =>
                  update({ content: `${post.content.trimEnd()}\n\n${text}`.trim() })
                }
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
