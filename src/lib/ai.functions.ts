import { createOpenAI } from "@ai-sdk/openai";
import { createServerFn } from "@tanstack/react-start";
import { Output, streamText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayRunIdFetch } from "./ai-gateway.server";

const STYLES = [
  "Personal story",
  "Short and punchy",
  "Educational",
  "Contrarian",
  "Storytelling",
  "Case study",
  "Lessons learned",
  "Founder/business",
] as const;

const VOICE = `You write LinkedIn posts the way a smart, specific human writes them.
Rules:
- No corporate filler, no "In today's fast-paced world", no "I'm humbled to announce".
- Short lines. Plenty of line breaks. Concrete numbers and details over adjectives.
- A hook in the first line that earns the "…see more" click.
- No hashtag spam: at most 3, only if they genuinely fit.
- Never use em dashes as a stylistic crutch, and never sound like a press release.`;

function gateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet.");
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
}

const reasoningOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

const variantSchema = z.object({
  variants: z.array(
    z.object({
      style: z.string(),
      text: z.string(),
    }),
  ),
});

export const generatePosts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        idea: z.string().min(3),
        styles: z.array(z.string()).min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const lovable = gateway();
    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      output: Output.object({ schema: variantSchema }),
      system: VOICE,
      prompt: `Idea from the user: "${data.idea}"

Write one LinkedIn post for each of these styles: ${data.styles.join(", ")}.
Each post is 60-180 words, uses real line breaks, and sounds like a specific person, not a brand.
Return one variant per requested style, in the same order, with "style" set to the exact style name.`,
      providerOptions: reasoningOptions,
    });

    const output = await result.output;
    return output.variants.slice(0, data.styles.length);
  });

const improveSchema = z.object({
  suggestions: z.array(
    z.object({
      category: z.string(),
      current: z.string(),
      suggestion: z.string(),
      reason: z.string(),
    }),
  ),
});

export const improvePost = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ content: z.string().min(10) }).parse(input))
  .handler(async ({ data }) => {
    const lovable = gateway();
    const result = streamText({
      model: lovable.responses("openai/gpt-6-astra"),
      output: Output.object({ schema: improveSchema }),
      system: VOICE,
      prompt: `Review this LinkedIn post and return 3 to 6 targeted improvements. Do NOT rewrite the whole post.

Post:
"""
${data.content}
"""

Each suggestion picks one category from: Hook, Clarity, Structure, Storytelling, Readability, Specificity, Engagement, Ending, Call to action, Length.
"current" quotes the exact text from the post that should change (or a short description of the gap if nothing exists yet).
"suggestion" is the replacement text, ready to paste in.
"reason" is one plain sentence explaining why it works.
Order suggestions by impact.`,
      providerOptions: reasoningOptions,
    });

    const output = await result.output;
    return output.suggestions.slice(0, 6);
  });

export const availableStyles = STYLES;
