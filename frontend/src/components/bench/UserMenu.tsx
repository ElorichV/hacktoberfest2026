import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck } from "lucide-react";
import { getMojoSession } from "@/lib/benchmark";

export function UserMenu() {
  const [name, setName] = useState<string>("Auditor MojoAuth");
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const mojo = getMojoSession();
    if (mojo?.email) {
      setName(mojo.email);
    }
  }, []);

  const signOut = async () => {
    window.localStorage.removeItem("mojo_session");
    await qc.cancelQueries();
    qc.clear();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="glass hover-lift flex items-center gap-2 rounded-full py-1 pl-2 pr-3 text-xs" title="Auditor verificado con MojoAuth">
        <ShieldCheck className="h-3.5 w-3.5 text-success" />
        <span className="max-w-40 truncate">{name}</span>
      </div>
      <button onClick={signOut} title="Cerrar sesión" aria-label="Cerrar sesión" className="glass hover-lift grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-foreground">
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
