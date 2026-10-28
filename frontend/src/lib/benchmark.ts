export type Quant = "Q4" | "Q8" | "FP16";

export interface ModelResult {
  id: string;
  name: string;
  vendor: string;
  params: string;
  quant: Quant;
  joules: number; // total energy
  watts: number; // avg power
  tokens: number;
  seconds: number;
  score: number;
}

export interface BenchmarkResponse {
  runId: string;
  source: "live" | "demo";
  prompt: string;
  contextUrl?: string | undefined;
  results: ModelResult[];
  verdict: string;
  verdictAudio?: string | undefined; // base64 mp3 from ElevenLabs
  logs: string[];
}

export const tokensPerJoule = (m: ModelResult) => m.tokens / m.joules;

export const MODELS = [
  { id: "gemma4-q4", name: "Gemma 4", vendor: "Google", params: "7B", quant: "Q4" as Quant },
  { id: "gemma4-q8", name: "Gemma 4", vendor: "Google", params: "7B", quant: "Q8" as Quant },
  { id: "llama33-q4", name: "Llama 3.3", vendor: "Meta", params: "70B", quant: "Q4" as Quant },
  { id: "qwen25-q4", name: "Qwen 2.5", vendor: "Alibaba", params: "14B", quant: "Q4" as Quant },
  { id: "qwen25-q8", name: "Qwen 2.5", vendor: "Alibaba", params: "14B", quant: "Q8" as Quant },
];

export const DOC_PRESETS = [
  { label: "FastAPI", url: "https://fastapi.tiangolo.com/tutorial/" },
  { label: "Ollama API", url: "https://github.com/ollama/ollama/blob/main/docs/api.md" },
  { label: "Gemma docs", url: "https://ai.google.dev/gemma/docs" },
  { label: "n8n Webhooks", url: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" },
];

function rand(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getMojoSession(): { email: string; audit_token: string; provider?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("mojo_session");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function demoBenchmark(modelIds: string[], prompt: string, contextUrl?: string, fixedSeed?: number): BenchmarkResponse {
  const seed = fixedSeed ?? Date.now() % 1000;
  const results: ModelResult[] = MODELS.filter((m) => modelIds.includes(m.id)).map((m, i) => {
    const big = m.params === "70B" ? 3.2 : m.params === "14B" ? 1.6 : 1;
    const q = m.quant === "Q8" ? 1.45 : 1;
    const watts = +(38 * big * (m.quant === "Q8" ? 1.15 : 1) + rand(seed + i) * 8).toFixed(1);
    const seconds = +(4.2 * big * q + rand(seed + i * 3) * 1.5).toFixed(2);
    const tokens = Math.round(480 + rand(seed + i * 7) * 120);
    const score = +(68 + (m.params === "70B" ? 14 : m.params === "14B" ? 9 : 4) + (m.quant === "Q8" ? 3 : 0) + rand(seed + i) * 4).toFixed(1);
    return { ...m, watts, seconds, tokens, joules: +(watts * seconds).toFixed(1), score };
  });
  const best = [...results].sort((a, b) => tokensPerJoule(b) - tokensPerJoule(a))[0];
  const now = new Date(fixedSeed !== undefined ? 1793300000000 : Date.now());
  const ts = (o: number) => new Date(now.getTime() + o * 1000).toTimeString().slice(0, 8);
  const logs = [
    `[${ts(0)}] n8n webhook received · run orchestration started`,
    contextUrl ? `[${ts(1)}] firecrawl: scraped ${contextUrl}` : `[${ts(1)}] firecrawl: no context url, skipping`,
    ...results.map((r, i) => `[${ts(2 + i * 3)}] ollama: ${r.name} ${r.quant} → ${r.tokens} tok · ${r.joules} J · ${r.watts} W`),
    best ? `[${ts(20)}] winner: ${best.name} ${best.quant} · ${tokensPerJoule(best).toFixed(2)} tok/J` : "",
    `[${ts(21)}] elevenlabs: verdict synthesized (demo → browser TTS)`,
  ].filter(Boolean);
  return {
    runId: `run_${now.getTime().toString(36)}`,
    source: "demo",
    prompt,
    contextUrl,
    results,
    verdict: best
      ? `${best.name} en cuantización ${best.quant} es el modelo más eficiente: ${tokensPerJoule(best).toFixed(2)} tokens por joule con ${best.watts} watts promedio.`
      : "Sin resultados.",
    logs,
  };
}

export async function runBenchmark(
  endpoint: string,
  body: { models: string[]; prompt: string; context_url?: string | undefined },
): Promise<BenchmarkResponse> {
  try {
    const mojo = getMojoSession();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 90000);
    const res = await fetch(`${endpoint.replace(/\/$/, "")}/api/benchmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        auditor_email: mojo?.email ?? "",
        audit_token: mojo?.audit_token ?? "",
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { ...demoBenchmark(body.models, body.prompt, body.context_url), ...data, source: "live" };
  } catch (e) {
    const demo = demoBenchmark(body.models, body.prompt, body.context_url);
    demo.logs.unshift(`[warn] backend ${endpoint} unreachable (${(e as Error).message}) → demo fallback`);
    return demo;
  }
}

export const HISTORY = Array.from({ length: 14 }, (_, i) => ({
  run: `#${470 + i}`,
  joules: Math.round(820 - i * 18 + Math.sin(i) * 60),
  watts: +(52 - i * 0.6 + Math.cos(i) * 3).toFixed(1),
  tpj: +(0.42 + i * 0.018 + Math.sin(i * 1.3) * 0.03).toFixed(3),
}));
