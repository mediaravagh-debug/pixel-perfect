import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { generatePosts, improvePost } from "@/lib/ai.functions";
import { POST_STYLES } from "@/lib/styles-list";

type Variant = { style: string; text: string };
type Suggestion = { category: string; current: string; suggestion: string; reason: string };

export function AIPanel({
  content,
  onApply,
  onAppend,
}: {
  content: string;
  onApply: (text: string) => void;
  onAppend: (text: string) => void;
}) {
  const generate = useServerFn(generatePosts);
  const improve = useServerFn(improvePost);

  const [tab, setTab] = useState<"generate" | "improve">("generate");
  const [idea, setIdea] = useState("");
  const [selected, setSelected] = useState<string[]>([
    "Personal story",
    "Short and punchy",
    "Lessons learned",
  ]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);

  const toggleStyle = (style: string) =>
    setSelected((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style],
    );

  const runGenerate = async () => {
    if (!idea.trim() || selected.length === 0) return;
    setBusy(true);
    try {
      const result = await generate({ data: { idea, styles: selected } });
      setVariants(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't write drafts right now.");
    } finally {
      setBusy(false);
    }
  };

  const runImprove = async () => {
    if (content.trim().length < 10) {
      toast.error("Write a little more first, then ask for improvements.");
      return;
    }
    setBusy(true);
    try {
      const result = await improve({ data: { content } });
      setSuggestions(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't review the post right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="label-mono flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent-2" /> AI Assistant
        </div>
        <div className="flex gap-1">
          {(["generate", "improve"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-2.5 py-1 font-mono text-[10px] tracking-[0.15em] uppercase transition-colors ${
                tab === t ? "bg-accent text-accent-foreground" : "text-fog-2 hover:text-paper"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-line bg-gradient-to-br from-panel-2 to-panel p-4">
        {tab === "generate" ? (
          <>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={3}
              placeholder="I made $1,300 from one newsletter email."
              className="w-full resize-none rounded-lg border border-line bg-white/[0.04] p-3 text-sm text-paper placeholder:text-fog-2 focus:border-accent/60 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {POST_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    selected.includes(style)
                      ? "border-accent/60 bg-accent/15 text-accent"
                      : "border-line text-fog-2 hover:text-paper"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
            <button
              onClick={runGenerate}
              disabled={busy}
              className="w-full rounded-md bg-accent px-4 py-2 font-display text-xs font-bold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60"
            >
              {busy ? "Writing…" : "Write drafts"}
            </button>

            {variants.map((variant, i) => (
              <div
                key={`${variant.style}-${i}`}
                className="slidein rounded-lg border border-line/70 bg-white/[0.04] p-3"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="mb-1.5 font-mono text-[10px] tracking-[0.15em] text-accent uppercase">
                  {variant.style}
                </div>
                <div className="text-sm leading-snug whitespace-pre-wrap text-paper/85">
                  {variant.text}
                </div>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => onApply(variant.text)}
                    className="rounded-md bg-accent px-3 py-1 font-display text-xs font-bold text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    Use this
                  </button>
                  <button
                    onClick={() => onAppend(variant.text)}
                    className="rounded-md border border-line px-3 py-1 text-xs text-fog transition-colors hover:text-paper"
                  >
                    Append
                  </button>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <button
              onClick={runImprove}
              disabled={busy}
              className="w-full rounded-md bg-accent-2 px-4 py-2 font-display text-xs font-bold text-accent-foreground transition-colors hover:bg-accent-2/90 disabled:opacity-60"
            >
              {busy ? "Reading your post…" : "Improve this post"}
            </button>

            {suggestions.length === 0 && !busy && (
              <p className="text-xs text-fog-2">
                You'll get specific suggestions for the hook, clarity, structure and ending — accept
                only the ones you like.
              </p>
            )}

            {suggestions.map((s, i) => (
              <div
                key={i}
                className="slidein rounded-lg border border-line/70 bg-white/[0.04] p-3"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="mb-1.5 font-mono text-[10px] tracking-[0.15em] text-accent uppercase">
                  {s.category}
                </div>
                <div className="text-xs text-fog-2 line-through">{s.current}</div>
                <div className="mt-1 text-sm leading-snug text-paper/90">{s.suggestion}</div>
                <div className="mt-1.5 text-xs text-fog-2 italic">{s.reason}</div>
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={() => {
                      if (s.current && content.includes(s.current)) {
                        onApply(content.replace(s.current, s.suggestion));
                      } else {
                        onAppend(s.suggestion);
                      }
                      setSuggestions((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                    className="rounded-md bg-accent px-3 py-1 font-display text-xs font-bold text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => setSuggestions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded-md border border-line px-3 py-1 text-xs text-fog transition-colors hover:text-paper"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
