import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Mail, ShieldCheck, Pause, Play, Volume2, Workflow, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Panel({ title, action, className, children }: { title?: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("glass rounded-xl", className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h3 className="font-display text-sm font-medium tracking-tight">{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, unit, delta, good, data }: { label: string; value: string; unit?: string; delta: string; good: boolean; data: number[] }) {
  const d = data.map((v, i) => ({ i, v }));
  const id = `g-${label.replace(/\W/g, "")}`;
  return (
    <div className="glass hover-lift rounded-xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <div>
          <p className="font-display text-2xl font-medium tabular-nums">
            {value}
            {unit && <span className="ml-1 text-sm text-muted-foreground">{unit}</span>}
          </p>
          <p className={cn("mt-1 font-mono text-xs", good ? "text-success" : "text-destructive")}>{delta}</p>
        </div>
        <div className="h-10 w-24">
          <ResponsiveContainer>
            <AreaChart data={d}>
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area dataKey="v" type="monotone" stroke="var(--highlight)" strokeWidth={1.5} fill={`url(#${id})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* MojoAuth passwordless widget */
export function AuthWidget() {
  const [user, setUser] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  if (user)
    return (
      <button onClick={() => setUser(null)} className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-accent" title="Cerrar sesión">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        <span className="max-w-32 truncate">{user}</span>
      </button>
    );
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow">
        <Mail className="h-3.5 w-3.5" /> Entrar sin contraseña
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-lg border border-border bg-popover p-4 shadow-xl">
          <p className="font-display text-sm">Magic link · MojoAuth</p>
          <p className="mt-1 text-xs text-muted-foreground">Te enviaremos un enlace / OTP a tu correo.</p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!/\S+@\S+\.\S+/.test(email)) { toast.error("Correo inválido"); return; }
              toast.success(`Enlace enviado a ${email}`);
              setUser(email);
              setOpen(false);
            }}
          >
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="h-8 flex-1 rounded-md border border-border bg-input px-2 text-xs outline-none focus:border-ring" />
            <button className="h-8 rounded-md bg-primary px-3 text-xs text-primary-foreground">Enviar</button>
          </form>
          <button
            onClick={() => {
              setUser("Jueces · Demo");
              setOpen(false);
            }}
            className="mt-3 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Modo Demo / Jueces →
          </button>
        </div>
      )}
    </div>
  );
}

/* n8n status */
export function N8nStatus({ busy }: { busy: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs" title="Webhook: /webhook/bench-run">
      <Workflow className="h-3.5 w-3.5 text-highlight" />
      <span className="text-muted-foreground">n8n</span>
      <span className={cn("h-1.5 w-1.5 rounded-full", busy ? "animate-pulse bg-warning" : "bg-success")} />
      <span className="font-mono">{busy ? "orquestando" : "webhook listo"}</span>
    </div>
  );
}

/* ElevenLabs Voice Verdict */
export function VoiceVerdict({ text, audio }: { text?: string | undefined; audio?: string | undefined }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { ref.current?.pause(); window.speechSynthesis?.cancel(); }, []);
  const stop = () => { ref.current?.pause(); window.speechSynthesis?.cancel(); setPlaying(false); };
  const play = () => {
    if (!text) return;
    if (playing) return stop();
    setPlaying(true);
    if (audio) {
      const a = new Audio(`data:audio/mpeg;base64,${audio}`);
      ref.current = a;
      a.onended = () => setPlaying(false);
      a.play().catch(() => speak());
    } else speak();
  };
  const speak = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-MX";
    u.onend = () => setPlaying(false);
    window.speechSynthesis.speak(u);
  };
  return (
    <Panel title="Voice Verdict" action={<span className="font-mono text-[10px] text-muted-foreground">ElevenLabs{audio ? "" : " · fallback TTS"}</span>}>
      <div className="flex items-center gap-4 p-4">
        <button onClick={play} disabled={!text} aria-label="Reproducir veredicto" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow disabled:opacity-40">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <div className="flex h-10 flex-1 items-center gap-[3px]">
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i} className={cn("w-[3px] flex-1 rounded-full bg-highlight", playing ? "animate-wave" : "opacity-40")} style={{ height: `${20 + ((i * 37) % 80)}%`, animationDelay: `${(i % 8) * 0.08}s` }} />
          ))}
        </div>
        <Volume2 className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="px-4 pb-4 text-xs leading-relaxed text-muted-foreground">{text ?? "Ejecuta un benchmark para generar el veredicto."}</p>
    </Panel>
  );
}

export function Terminal({ logs }: { logs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight }); }, [logs]);
  return (
    <Panel
      title="Terminal Logs"
      action={
        <button onClick={() => { navigator.clipboard.writeText(logs.join("\n")); toast.success("Logs copiados"); }} className="flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground">
          <Copy className="h-3 w-3" /> Copy
        </button>
      }
    >
      <div ref={ref} className="h-56 overflow-auto p-4 font-mono text-[11.5px] leading-6">
        {logs.map((l, i) => (
          <div key={i} className={cn(l.includes("winner") ? "text-success" : l.startsWith("[warn]") ? "text-warning" : "text-muted-foreground", i === logs.length - 1 && "text-highlight")}>
            {l}
          </div>
        ))}
        <span className="inline-block h-3.5 w-2 animate-pulse bg-highlight align-middle" />
      </div>
    </Panel>
  );
}
