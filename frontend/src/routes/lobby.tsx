import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Cpu, Leaf, Volume2, VolumeX, Zap } from "lucide-react";
import { HeroGradient } from "@/components/bench/HeroGradient";
import { Logo } from "@/components/bench/Logo";
import { startSpatialAudio } from "@/lib/spatial-audio";

export const Route = createFileRoute("/lobby")({
  head: () => ({
    meta: [
      { title: "BenchEngine — Lobby" },
      { name: "description", content: "Conoce BenchEngine: mide cuánta energía consume cada modelo de IA local y elige el más verde." },
      { property: "og:title", content: "BenchEngine — Lobby" },
      { property: "og:description", content: "Green AI local benchmarking para el Hacktoberfest 2026 CDMX." },
    ],
  }),
  component: Lobby,
});

const STORY = [
  { icon: Zap, t: "Cada token cuesta energía", d: "Un modelo local consume Watts reales. BenchEngine los mide, segundo a segundo." },
  { icon: Cpu, t: "Q4 contra Q8", d: "Compara cuantizaciones de Gemma, Llama y Qwen en tu propia máquina." },
  { icon: Leaf, t: "Elige el más verde", d: "Tokens por joule: la métrica que corona al modelo más eficiente." },
];

function Lobby() {
  const [audio, setAudio] = useState(false);
  const stopRef = useRef<null | (() => void)>(null);
  useEffect(() => () => stopRef.current?.(), []);

  const toggle = () => {
    if (audio) { stopRef.current?.(); stopRef.current = null; setAudio(false); }
    else { stopRef.current = startSpatialAudio(); setAudio(true); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <HeroGradient className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background" />
      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Logo className="text-sm" />
        <div className="flex items-center gap-2">
          <button onClick={toggle} aria-pressed={audio} className="glass hover-lift flex items-center gap-2 rounded-full px-4 py-2 text-xs">
            {audio ? <Volume2 className="h-4 w-4 text-success" /> : <VolumeX className="h-4 w-4" />}
            {audio ? "Audio espacial activo" : "Activar audio espacial"}
          </button>
          <Link to="/auth" className="neon-btn hover-lift rounded-full px-4 py-2 text-xs font-medium">Entrar</Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-16 text-center md:pt-28">
        <p className="fade-up font-mono text-[11px] tracking-[0.4em] text-highlight">HACKTOBERFEST 2026 · CDMX</p>
        <h1 className={`fade-up mt-6 font-display text-6xl font-semibold leading-none md:text-8xl ${audio ? "immense" : ""}`} style={{ animationDelay: "120ms" }}>
          <Logo className="justify-center" />
        </h1>
        <p className="fade-up mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl" style={{ animationDelay: "260ms" }}>
          En un universo de modelos cada vez más grandes, alguien tiene que medir la luz que consumen.
          BenchEngine convierte cada inferencia en <span className="neon-shimmer font-medium">Joules, Watts y verdad</span>.
        </p>
        <div className="fade-up mt-10 flex flex-wrap justify-center gap-3" style={{ animationDelay: "400ms" }}>
          <Link to="/auth" className="neon-btn hover-lift flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium">
            Comenzar <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/auth" search={{ mode: "signup" }} className="glass hover-lift rounded-full px-6 py-3 text-sm">Crear cuenta</Link>
        </div>

        <div className="mt-24 grid w-full gap-4 md:grid-cols-3">
          {STORY.map((s, i) => (
            <div key={s.t} className="fade-up glass neon-border hover-lift rounded-2xl p-6 text-left" style={{ animationDelay: `${520 + i * 120}ms` }}>
              <s.icon className="h-5 w-5 text-highlight" />
              <h3 className="mt-4 font-display text-lg font-medium">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
