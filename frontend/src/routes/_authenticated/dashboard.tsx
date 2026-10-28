import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Activity, Boxes, Database, Gauge, LayoutDashboard, Leaf, Play, Search, Server, Settings, ScrollText, Globe, Loader2, Trophy } from "lucide-react";

import { HeroGradient } from "@/components/bench/HeroGradient";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/bench/UserMenu";
import { Kpi, N8nStatus, Panel, Terminal, VoiceVerdict } from "@/components/bench/widgets";
import { DOC_PRESETS, HISTORY, MODELS, demoBenchmark, runBenchmark, tokensPerJoule, type BenchmarkResponse, type ModelResult } from "@/lib/benchmark";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "BenchEngine — Panel de control" },
      { name: "description", content: "Compara modelos locales (Gemma 4, Llama 3.3, Qwen 2.5) por Joules, Watts y tokens por joule." },
      { property: "og:title", content: "BenchEngine — Panel de control" },
      { property: "og:description", content: "Benchmarks de eficiencia energética para LLMs locales y cuantizaciones Q4 vs Q8." },
    ],
  }),
  component: Dashboard,
});

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Gauge, label: "Benchmarks" },
  { icon: Boxes, label: "Modelos" },
  { icon: Database, label: "Datasets" },
  { icon: ScrollText, label: "Logs" },
  { icon: Settings, label: "Ajustes" },
];

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }, cursor: { fill: "var(--accent)" } };
const label = (m: ModelResult) => `${m.name} ${m.quant}`;

function Dashboard() {
  const [endpoint, setEndpoint] = useState("http://localhost:8000");
  const [selected, setSelected] = useState<string[]>(MODELS.map((m) => m.id));
  const [url, setUrl] = useState(DOC_PRESETS[0]!.url);
  const [prompt, setPrompt] = useState("Resume la documentación y genera un endpoint de ejemplo.");
  const [busy, setBusy] = useState(false);
  const [run, setRun] = useState<BenchmarkResponse>(() => ({ ...demoBenchmark(MODELS.map((m) => m.id), "demo", undefined, 42), logs: ["[boot] BenchEngine listo · esperando benchmark"] }));
  const [inspect, setInspect] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "metrics" | "config">("metrics");

  const ranked = useMemo(() => [...run.results].sort((a, b) => tokensPerJoule(b) - tokensPerJoule(a)), [run]);
  const winner = ranked[0];
  const current = run.results.find((r) => r.id === inspect) ?? winner;
  const chart = run.results.map((r) => ({ name: label(r), joules: r.joules, watts: r.watts, tpj: +tokensPerJoule(r).toFixed(3), id: r.id }));
  const totalJ = run.results.reduce((s, r) => s + r.joules, 0);
  const avgW = run.results.reduce((s, r) => s + r.watts, 0) / (run.results.length || 1);

  const start = async () => {
    if (!selected.length) return;
    setBusy(true);
    setRun((r) => ({ ...r, logs: [...r.logs, `[${new Date().toTimeString().slice(0, 8)}] POST ${endpoint}/api/benchmark · ${selected.length} modelos`] }));
    const res = await runBenchmark(endpoint, { models: selected, prompt, context_url: url || undefined });
    setRun(res);
    setInspect(null);
    setBusy(false);
  };

  const gemma = (q: "Q4" | "Q8") => run.results.find((r) => r.name === "Gemma 4" && r.quant === q);
  const g4 = gemma("Q4"), g8 = gemma("Q8");

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border glass-strong p-3 lg:flex">
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="font-display text-lg font-semibold text-highlight neon-text">Ǝ</span>
          <span className="font-display text-sm font-medium tracking-[0.25em]">BENCHENGINE</span>
        </div>
        <nav className="mt-4 space-y-0.5">
          {NAV.map((n, i) => (
            <a key={n.label} href="#" className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm", i === 0 ? "bg-accent text-foreground shadow-[inset_2px_0_0_var(--primary)]" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}>
              <n.icon className="h-4 w-4" /> {n.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="rounded-md border border-border p-3 text-xs">
            <p className="flex items-center gap-1.5 font-medium"><Server className="h-3.5 w-3.5" /> Backend local</p>
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <span className={cn("h-1.5 w-1.5 rounded-full", run.source === "live" ? "bg-success" : "bg-warning")} />
              {run.source === "live" ? "Conectado" : "Modo demo"}
            </p>
            <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{endpoint}</p>
          </div>
          <p className="px-2 text-[11px] text-muted-foreground">Hacktoberfest 2026 · CDMX</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-12 items-center gap-3 border-b border-border px-4">
          <div className="flex h-8 max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-input px-2.5 text-xs text-muted-foreground">
            <Search className="h-3.5 w-3.5" /> Buscar modelos, runs o tags…
            <kbd className="ml-auto rounded border border-border px-1 font-mono text-[10px]">⌘K</kbd>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <N8nStatus busy={busy} />
            <UserMenu />
          </div>
        </header>

        <main className="grid flex-1 gap-4 p-4 xl:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-4">
            {/* Hero + launch */}
            <section className="relative overflow-hidden rounded-lg border border-border bg-background">
              <HeroGradient className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
              <div className="relative grid gap-4 p-6 md:grid-cols-[1fr_1fr]">
                <div>
                  <p className="font-mono text-[11px] tracking-[0.3em] text-highlight">GREEN AI · LOCAL BENCHMARKING</p>
                  <h1 className="mt-2 font-display text-3xl font-medium tracking-tight md:text-4xl">Faster benchmarks.<br />Deeper insights.</h1>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">Mide Joules, Watts y tokens por joule de tus modelos locales. Compara Q4 vs Q8 sin salir de tu máquina.</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {MODELS.map((m) => {
                      const on = selected.includes(m.id);
                      return (
                        <button key={m.id} onClick={() => setSelected((s) => (on ? s.filter((x) => x !== m.id) : [...s, m.id]))} className={cn("rounded-md border px-2 py-1 font-mono text-[11px]", on ? "border-primary bg-primary/20 text-foreground" : "border-border text-muted-foreground")}>
                          {m.name} <span className="text-highlight">{m.quant}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2 glass rounded-xl p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium"><Globe className="h-3.5 w-3.5 text-highlight" /> Contexto vía Firecrawl</p>
                  <div className="flex flex-wrap gap-1">
                    {DOC_PRESETS.map((p) => (
                      <button key={p.label} onClick={() => setUrl(p.url)} className={cn("rounded px-2 py-0.5 text-[11px]", url === p.url ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground hover:text-foreground")}>{p.label}</button>
                    ))}
                  </div>
                  <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://docs…" className="h-8 w-full rounded-md border border-border bg-input px-2 font-mono text-[11px] outline-none focus:border-ring" />
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2} className="w-full resize-none rounded-md border border-border bg-input px-2 py-1.5 text-xs outline-none focus:border-ring" />
                  <button onClick={start} disabled={busy || !selected.length} className="flex h-9 w-full items-center justify-center gap-2 neon-btn rounded-md text-sm font-medium disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {busy ? "Ejecutando…" : "Iniciar benchmark"}
                  </button>
                </div>
              </div>
            </section>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Joules totales" value={totalJ.toFixed(0)} unit="J" delta="↓ 8.4% vs run previo" good data={HISTORY.map((h) => h.joules)} />
              <Kpi label="Watts promedio" value={avgW.toFixed(1)} unit="W" delta="↓ 3.1%" good data={HISTORY.map((h) => h.watts)} />
              <Kpi label="Mejor tokens/J" value={winner ? tokensPerJoule(winner).toFixed(2) : "—"} unit="tok/J" delta="↑ 12%" good data={HISTORY.map((h) => h.tpj)} />
              <Kpi label="Ahorro Q4 vs Q8 (Gemma 4)" value={g4 && g8 ? `${(100 - (g4.joules / g8.joules) * 100).toFixed(0)}%` : "—"} delta={g4 && g8 ? `Δ score ${(g4.score - g8.score).toFixed(1)}` : "selecciona ambos"} good={!!g4} data={[3, 4, 3, 5, 6, 5, 7, 8]} />
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title="Energía por modelo" action={<span className="font-mono text-[10px] text-muted-foreground">Joules · Watts</span>}>
                <div className="h-64 p-3">
                  <ResponsiveContainer>
                    <BarChart data={chart} onClick={(e) => e?.activePayload && setInspect(e.activePayload[0].payload.id)}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="j" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="w" orientation="right" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...tip} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="j" dataKey="joules" name="Joules" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                      <Bar yAxisId="w" dataKey="watts" name="Watts" fill="var(--highlight)" fillOpacity={0.45} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel title="Tokens por Joule" action={<span className="font-mono text-[10px] text-success">más alto = más verde</span>}>
                <div className="h-64 p-3">
                  <ResponsiveContainer>
                    <BarChart data={[...chart].sort((a, b) => b.tpj - a.tpj)} layout="vertical" onClick={(e) => e?.activePayload && setInspect(e.activePayload[0].payload.id)}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...tip} />
                      <Bar dataKey="tpj" name="tok/J" radius={[0, 3, 3, 0]}>
                        {[...chart].sort((a, b) => b.tpj - a.tpj).map((c, i) => <Cell key={c.id} fill={i === 0 ? "var(--success)" : "var(--primary)"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            {/* Results table */}
            <Panel title="Resultados del run" action={<span className="font-mono text-[10px] text-muted-foreground">{run.runId} · {run.source}</span>}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr className="border-b border-border">
                      {["#", "Modelo", "Quant", "Joules", "Watts", "Tiempo", "Tokens", "tok/J", "Score"].map((h) => <th key={h} className="px-4 py-2 font-normal">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {ranked.map((r, i) => (
                      <tr key={r.id} onClick={() => setInspect(r.id)} className={cn("cursor-pointer border-b border-border/50 hover:bg-accent/40", current?.id === r.id && "bg-accent/60")}>
                        <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-2 font-sans text-sm">{r.name} <span className="text-xs text-muted-foreground">{r.params}</span></td>
                        <td className="px-4 py-2"><span className="rounded bg-accent px-1.5 py-0.5 text-highlight">{r.quant}</span></td>
                        <td className="px-4 py-2">{r.joules}</td>
                        <td className="px-4 py-2">{r.watts}</td>
                        <td className="px-4 py-2">{r.seconds}s</td>
                        <td className="px-4 py-2">{r.tokens}</td>
                        <td className={cn("px-4 py-2", i === 0 && "text-success")}>{tokensPerJoule(r).toFixed(3)} {i === 0 && <Trophy className="ml-1 inline h-3 w-3" />}</td>
                        <td className="px-4 py-2">{r.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>

          {/* Inspector */}
          <aside className="space-y-4">
            {current && (
              <Panel>
                <div className="flex items-start justify-between p-4">
                  <div className="flex gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-md border border-border bg-accent"><Activity className="h-5 w-5 text-highlight" /></div>
                    <div>
                      <p className="font-display text-base font-medium">{current.name} · {current.quant}</p>
                      <p className="text-xs text-muted-foreground">{current.vendor} · {current.params} parámetros</p>
                    </div>
                  </div>
                  {current.id === winner?.id ? (
                    <span className="flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[11px] text-success"><Leaf className="h-3 w-3" /> Más eficiente</span>
                  ) : (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">#{ranked.findIndex((r) => r.id === current.id) + 1}</span>
                  )}
                </div>
                <div className="flex gap-4 border-b border-border px-4 text-sm">
                  {(["overview", "metrics", "config"] as const).map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={cn("-mb-px border-b-2 pb-2 capitalize", tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground")}>{t}</button>
                  ))}
                </div>
                <div className="p-4">
                  {tab === "metrics" && (
                    <>
                      <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                        {[["Joules", current.joules], ["Watts", current.watts], ["tok/J", tokensPerJoule(current).toFixed(3)], ["Score", current.score]].map(([k, v]) => (
                          <div key={k} className="rounded-md border border-border p-2"><p className="text-muted-foreground">{k}</p><p className="mt-0.5 text-base text-foreground">{v}</p></div>
                        ))}
                      </div>
                      <div className="mt-3 h-36">
                        <ResponsiveContainer>
                          <LineChart data={Array.from({ length: 24 }, (_, i) => ({ t: i, w: +(current.watts * (0.7 + Math.sin(i / 2) * 0.15 + (i / 24) * 0.25)).toFixed(1) }))}>
                            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="t" hide />
                            <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                            <Tooltip {...tip} />
                            <Line dataKey="w" name="W" stroke="var(--primary)" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-center text-[10px] text-muted-foreground">Consumo instantáneo (W) durante la inferencia</p>
                    </>
                  )}
                  {tab === "overview" && <p className="text-sm text-muted-foreground">{current.tokens} tokens en {current.seconds}s ({(current.tokens / current.seconds).toFixed(1)} tok/s). Prompt: “{run.prompt}”.</p>}
                  {tab === "config" && (
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Endpoint backend (FastAPI / Ollama / túnel)</label>
                      <input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="h-8 w-full rounded-md border border-border bg-input px-2 font-mono text-xs outline-none focus:border-ring" />
                      <p className="text-[11px] text-muted-foreground">Se llama a <span className="font-mono">POST /api/benchmark</span>. Si no responde, se usan datos de demostración.</p>
                    </div>
                  )}
                </div>
              </Panel>
            )}
            <VoiceVerdict text={run.logs.length > 1 ? run.verdict : undefined} audio={run.verdictAudio} />
            <Terminal logs={run.logs} />
          </aside>
        </main>
      </div>
    </div>
  );
}
