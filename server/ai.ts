// Optional AI features (chat recap + translation) via the Anthropic API.
// Gated on ANTHROPIC_API_KEY (server-side env, never committed). The whole app
// works with zero keys — this just unlocks "Caught you up" + translate.
const KEY = process.env.ANTHROPIC_API_KEY ?? "";
const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

export function aiConfigured(): boolean {
  return KEY.length > 0;
}

async function ask(system: string, user: string, maxTokens: number): Promise<string> {
  if (!KEY) throw new Error("AI not configured — set ANTHROPIC_API_KEY in .env.local");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: { message?: string } };
      if (j.error?.message) detail = j.error.message;
    } catch {
      /* no body */
    }
    throw new Error(detail);
  }
  const j = (await res.json()) as { content?: { text?: string }[] };
  return (j.content ?? []).map((c) => c.text ?? "").join("").trim();
}

export function recap(texts: string[]): Promise<string> {
  const joined = texts.slice(-120).join("\n").slice(0, 6000);
  return ask(
    "You summarize live-stream chat for a streamer who stepped away. Be concise and concrete. Output 4–5 short bullet points covering: the top topics, the overall mood, any $tickers or markets mentioned, and the most important unanswered questions. Start each line with '• '. No preamble, no closing.",
    `Recent chat:\n\n${joined}`,
    400,
  );
}

export function translate(text: string): Promise<string> {
  return ask(
    "You are a translator. If the text is not in English, translate it to English. If it is already English, reply with it unchanged. Reply with ONLY the translation — no quotes, no notes.",
    text.slice(0, 500),
    200,
  );
}
