import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LOGO } from "@/components/bench/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BenchEngine — Green AI Local Benchmarking" },
      { name: "description", content: "BenchEngine: benchmarks de eficiencia energética para modelos de IA locales." },
      { property: "og:title", content: "BenchEngine — Green AI Local Benchmarking" },
      { property: "og:description", content: "Mide Joules, Watts y tokens por joule de tus LLMs locales." },
    ],
  }),
  component: Intro,
});

function Intro() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"letters" | "glow" | "wave">("letters");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("glow"), 2600);
    const t2 = setTimeout(() => setPhase("wave"), 4000);
    const t3 = setTimeout(() => navigate({ to: "/lobby" }), 5000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [navigate]);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background" onClick={() => navigate({ to: "/lobby" })}>
      <div className="intro-aura absolute inset-0" />
      <h1 className={`relative flex items-center gap-[0.15em] font-display text-4xl font-semibold md:text-7xl ${phase !== "letters" ? "intro-glow" : ""}`} aria-label={LOGO}>
        <span className="intro-letter text-highlight" style={{ animationDelay: "0ms" }}>Ǝ</span>
        <span className="w-4 md:w-8" />
        {LOGO.split("").map((c, i) => (
          <span key={i} className="intro-letter" style={{ animationDelay: `${200 + i * 170}ms`, ["--r" as string]: `${(i % 2 ? 1 : -1) * (40 + i * 9)}deg`, ["--x" as string]: `${(i - 5) * 30}px` }}>
            {c}
          </span>
        ))}
      </h1>
      {phase === "wave" && (
        <>
          <span className="shockwave" />
          <span className="shockwave" style={{ animationDelay: "150ms" }} />
          <span className="intro-flash absolute inset-0" />
        </>
      )}
      <p className="absolute bottom-8 font-mono text-[10px] tracking-[0.4em] text-muted-foreground">CLIC PARA SALTAR</p>
    </div>
  );
}
