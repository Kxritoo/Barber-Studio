import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

// Guárdalo en: src/components/Login.tsx
export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Escribe tu correo y tu contraseña.");
      return;
    }

    setCargando(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setCargando(false);

    if (authError) {
      setError(
        authError.message.toLowerCase().includes("invalid")
          ? "Correo o contraseña incorrectos."
          : `No se pudo iniciar sesión: ${authError.message}`
      );
    }
    // Si sale bien no hay que redirigir: /admin escucha el cambio de sesión
    // (onAuthStateChange) y muestra el panel automáticamente.
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="gold-text text-4xl">BARBERSTUDIO</h1>
      <p className="mt-1 text-sm text-muted-foreground">Acceso solo para el equipo.</p>

      <form className="mt-6 space-y-3" onSubmit={entrar}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="Correo"
          className="w-full rounded-lg border border-input bg-secondary px-4 py-3 outline-none focus:border-primary"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          placeholder="Contraseña"
          className="w-full rounded-lg border border-input bg-secondary px-4 py-3 outline-none focus:border-primary"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          disabled={cargando}
          className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-gold disabled:opacity-50"
        >
          {cargando ? "Entrando..." : "Entrar"}
        </button>
        <Link to="/" className="block text-center text-xs text-muted-foreground underline">
          Volver a la reserva
        </Link>
      </form>
    </main>
  );
}
