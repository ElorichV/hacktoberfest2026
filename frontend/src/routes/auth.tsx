import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, ShieldCheck, KeyRound } from "lucide-react";
import { z } from "zod";
import { HeroGradient } from "@/components/bench/HeroGradient";
import { Logo } from "@/components/bench/Logo";
import { getMojoSession } from "@/lib/benchmark";

const BACKEND_URL = "http://localhost:8000";

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => z.object({ mode: z.enum(["signin", "signup"]).optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "BenchEngine — Acceso Passwordless con MojoAuth" },
      { name: "description", content: "Inicia sesión sin contraseña con MojoAuth Email OTP para desbloquear el Candado de Auditoría Energética." },
      { property: "og:title", content: "BenchEngine — MojoAuth Passwordless Login" },
      { property: "og:description", content: "Accede al panel de benchmarks de IA local con Gemma 4." },
    ],
  }),
  component: AuthPage,
});

const field = "h-11 w-full rounded-lg border border-border bg-input/60 px-3 text-sm outline-none transition focus:border-ring focus:shadow-glow";

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("axel@hackathon.dev");
  const [otp, setOtp] = useState("");
  const [stateId, setStateId] = useState<string | null>(null);
  const [hint, setHint] = useState<string>("");

  useEffect(() => {
    if (getMojoSession()?.email) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [navigate]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Ingresa un correo válido");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al solicitar OTP");
      setStateId(data.state_id || "sandbox_local");
      setHint(data.message || `Código OTP enviado a ${email}`);
      if (data.demo_otp_hint) setOtp(data.demo_otp_hint);
      toast.success(data.message || `Código OTP enviado a ${email}`);
    } catch {
      setStateId("sandbox_local");
      setOtp("123456");
      setHint(`Modo local activo: usa el código 123456 para verificar ${email}`);
      toast.info("Modo local de MojoAuth activo: código 123456 prellenado");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Ingresa el código OTP");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, state_id: stateId ?? "sandbox_local", otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Código OTP inválido");
      window.localStorage.setItem(
        "mojo_session",
        JSON.stringify({
          email: data.auditor_email || email,
          audit_token: data.audit_token || "mojo_verified",
          provider: data.provider || "MojoAuth",
        }),
      );
      toast.success(`Candado desbloqueado · Bienvenido ${email}`);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error((err as Error).message || "No se pudo verificar el código OTP");
    } finally {
      setBusy(false);
    }
  };

  const quickDemoLogin = () => {
    window.localStorage.setItem(
      "mojo_session",
      JSON.stringify({
        email: email || "jueces@hacktoberfest.dev",
        audit_token: "mojo_demo_judges",
        provider: "MojoAuth Sandbox",
      }),
    );
    toast.success("Sesión de auditoría iniciada (MojoAuth)");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <HeroGradient className="absolute inset-0 h-full w-full opacity-70" />
      <div className="absolute inset-0 bg-background/40" />
      <div className="fade-up glass-strong neon-border relative w-full max-w-md rounded-3xl p-8">
        <Link to="/lobby" className="block text-center"><Logo className="text-base" /></Link>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs text-highlight">
          <ShieldCheck className="h-4 w-4" />
          <span>Candado de Auditoría Energética · MojoAuth</span>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Autenticación passwordless por Email OTP para autorizar y firmar corridas de inferencia local en Gemma 4.
        </p>

        {!stateId ? (
          <form onSubmit={sendOtp} className="mt-6 space-y-3">
            <label className="block text-xs text-muted-foreground">Correo del Auditor</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className={field}
            />
            <button
              disabled={busy}
              className="neon-btn hover-lift flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Enviar código OTP con MojoAuth
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-3">
            <div className="rounded-lg border border-border bg-input/40 p-2.5 text-xs text-muted-foreground">
              {hint}
            </div>
            <label className="block text-xs text-muted-foreground">Código OTP de 6 dígitos</label>
            <input
              required
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={8}
              className={`${field} font-mono tracking-widest text-center text-base`}
            />
            <button
              disabled={busy}
              className="neon-btn hover-lift flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Verificar OTP y entrar al Dashboard
            </button>
            <button
              type="button"
              onClick={() => setStateId(null)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
            >
              ← Cambiar correo ({email})
            </button>
          </form>
        )}

        <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />acceso rápido para evaluación<span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={quickDemoLogin}
          className="glass hover-lift flex h-10 w-full items-center justify-center gap-2 rounded-lg text-xs text-muted-foreground hover:text-foreground"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          Entrar como Juez / Demo (MojoAuth Instantáneo)
        </button>
      </div>
    </div>
  );
}
