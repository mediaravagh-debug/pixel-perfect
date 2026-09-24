import { useState } from "react";

import avatar from "@/assets/avatar.jpg";

const LIMIT = 210;

function renderText(text: string) {
  return text.split(/(\s+)/).map((token, i) => {
    if (/^[#@][\w-]+$/.test(token) || /^https?:\/\/\S+$/.test(token)) {
      return (
        <span key={i} className="font-semibold text-[#0a66c2]">
          {token}
        </span>
      );
    }
    return <span key={i}>{token}</span>;
  });
}

export function LinkedInPreview({
  content,
  imageUrl,
  name = "Maya Okafor",
  headline = "Head of Growth · Northwind Labs",
}: {
  content: string;
  imageUrl?: string | undefined;
  name?: string;
  headline?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const body = content.trim() || "Your post will appear here as you type.";
  const truncated = !expanded && body.length > LIMIT;
  const shown = truncated ? body.slice(0, LIMIT).trimEnd() : body;

  return (
    <div className="rounded-xl bg-white p-4 text-[#1d222b] ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <img
          src={avatar}
          alt=""
          width={88}
          height={88}
          loading="lazy"
          className="size-11 shrink-0 rounded-full object-cover"
        />
        <div className="leading-tight">
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-xs text-[#56637a]">{headline}</div>
          <div className="text-xs text-[#56637a]">Just now · 🌐</div>
        </div>
      </div>

      <div className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">
        {renderText(shown)}
        {truncated && (
          <>
            {"… "}
            <button
              onClick={() => setExpanded(true)}
              className="text-[#56637a] hover:text-[#0a66c2] hover:underline"
            >
              see more
            </button>
          </>
        )}
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt="Post attachment"
          loading="lazy"
          className="mt-3 w-full rounded-md object-cover"
        />
      )}

      <div className="mt-3 flex items-center justify-between border-b border-[#e3e7ee] pb-2 text-xs text-[#56637a]">
        <span className="flex items-center gap-1">
          <span>👍❤️💡</span> 128
        </span>
        <span>24 comments · 9 reposts</span>
      </div>

      <div className="mt-1 grid grid-cols-4 text-xs font-medium text-[#56637a]">
        {["Like", "Comment", "Repost", "Send"].map((action) => (
          <button
            key={action}
            className="rounded-md py-2 transition-colors hover:bg-[#f1f3f7] hover:text-[#1d222b]"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
}
