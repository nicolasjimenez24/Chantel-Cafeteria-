import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { TazaIlustracion } from "@/components/TazaIlustracion";
import { fechaHoy } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/state/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await login(usuario, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión");
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header>
        <div className="bg-forest text-white">
          <div className="max-w-6xl mx-auto px-5 md:px-8 h-9 flex items-center justify-center relative">
            <p className="text-[11.5px] font-semibold tracking-[0.12em] uppercase">Control de cafetería</p>
            <span className="absolute right-5 md:right-8 text-[11.5px] text-white/70 font-mono-num hidden sm:block">
              {fechaHoy()}
            </span>
          </div>
        </div>
        <div className="bg-panel border-b border-line">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-3">
            <div className="inline-block leading-none text-forest">
              <span className="block text-[25px] md:text-[28px] font-bold tracking-[0.06em]">CHANTEL</span>
              <span className="flex items-center gap-1.5 mt-1">
                <span className="h-px w-3 bg-forest/50" />
                <span className="text-[9.5px] font-semibold tracking-[0.32em] uppercase">Cafetería</span>
                <span className="h-px w-3 bg-forest/50" />
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="hero hero-lila">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-5 md:py-6 flex items-center gap-8">
          <div className="hero-mancha px-7 py-5 md:px-10 md:py-6 w-full md:w-auto md:max-w-[600px]">
            <h1 className="font-display text-plum text-[30px] md:text-[40px] leading-[1.05]">Iniciar sesión</h1>
            <p className="text-plum/85 text-[14.5px] md:text-[16px] mt-2 max-w-[44ch] leading-snug">
              Ingresa con tu usuario para llevar el control de la producción del día.
            </p>
          </div>
          <TazaIlustracion className="hidden md:block ml-auto w-[150px] shrink-0 drop-shadow-[0_10px_14px_rgba(15,46,34,0.25)]" />
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-5 md:px-8 pt-7 pb-12">
        <form onSubmit={enviar} className="card w-full max-w-md mx-auto md:mx-0 p-6 md:p-7" noValidate>
          <label className="block text-[12.5px] font-semibold text-ink-soft mb-1.5" htmlFor="usuario">
            Usuario
          </label>
          <input
            id="usuario"
            className="field w-full px-3 mb-4"
            style={{ height: "2.75rem" }}
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
          />

          <label className="block text-[12.5px] font-semibold text-ink-soft mb-1.5" htmlFor="password">
            Contraseña
          </label>
          <div className="relative mb-5">
            <input
              id="password"
              type={verPassword ? "text" : "password"}
              className="field w-full pl-3 pr-11"
              style={{ height: "2.75rem" }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setVerPassword((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full text-muted hover:text-plum flex items-center justify-center"
              aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {verPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-berry bg-berry-10 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full" disabled={enviando || !usuario || !password}>
            <LogIn size={16} />
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </main>
    </div>
  );
}
