import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BARBEROS,
  HORAS,
  SERVICIOS,
  formatFechaLarga,
  formatPesos,
  hoyISO,
  nombreBarbero,
  nombreServicio,
  useBarber,
} from "@/lib/barber-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BarberStudio Bogotá — Reserva tu turno online" },
      {
        name: "description",
        content:
          "Agenda tu corte o perfilado de barba en BarberStudio. Elige barbero, servicio y hora disponible en segundos. Pago en el local.",
      },
      { property: "og:title", content: "BarberStudio — Reserva tu turno" },
      {
        property: "og:description",
        content: "Corte Tradicional, Perfilado de Barba y Combo. Agenda tu hora sin llamadas.",
      },
    ],
  }),
  component: Reserva,
});

function proximosDias(cantidad: number) {
  const base = new Date();
  return Array.from({ length: cantidad }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return {
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`,
      dia: d.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", ""),
      num: d.getDate(),
    };
  });
}

function Reserva() {
  const { agendar, estaOcupado, barberosLibres } = useBarber();
  const dias = useMemo(() => proximosDias(7), []);
  const [servicioId, setServicioId] = useState("corte");
  const [barberoId, setBarberoId] = useState("cualquiera");
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [listo, setListo] = useState<{ hora: string; barbero: string } | null>(null);

  const horaDisponible = (h: string) =>
    barberoId === "cualquiera" ? barberosLibres(fecha, h).length > 0 : !estaOcupado(fecha, h, barberoId);

  const confirmar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hora) return setError("Selecciona una hora disponible.");
    if (nombre.trim().length < 3) return setError("Escribe tu nombre completo.");
    if (telefono.replace(/\D/g, "").length < 7) return setError("Escribe un teléfono válido.");
    const asignado =
      barberoId === "cualquiera" ? barberosLibres(fecha, hora)[0]?.id : barberoId;
    if (!asignado) return setError("Ese turno se acabó de ocupar, elige otra hora.");
    agendar({
      fecha,
      hora,
      barberoId: asignado,
      servicioId,
      cliente: nombre.trim(),
      telefono: telefono.trim(),
      origen: "web",
    });
    setError("");
    setListo({ hora, barbero: nombreBarbero(asignado) });
    setNombre("");
    setTelefono("");
    setHora(null);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 pb-16">
      <header className="flex items-center justify-between py-6">
        <div>
          <p className="text-xs tracking-[0.35em] text-primary">BOGOTÁ · CHAPINERO</p>
          <h1 className="gold-text text-4xl">BARBERSTUDIO</h1>
        </div>
        <Link
          to="/admin"
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground"
        >
          Personal
        </Link>
      </header>

      <section className="card-surface p-5">
        <h2 className="text-2xl">Reserva tu turno</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sin llamadas ni cuadernos: elige servicio, barbero y hora.
        </p>
      </section>

      {listo && (
        <div className="mt-4 rounded-xl border border-primary/50 bg-primary/10 p-4 text-sm">
          <p className="font-semibold text-primary">¡Turno confirmado, parcero!</p>
          <p className="mt-1 text-foreground/90">
            {formatFechaLarga(fecha)} a las {listo.hora} con {listo.barbero}. Te esperamos 5 minutos
            antes.
          </p>
        </div>
      )}

      <Bloque titulo="1. Elige tu servicio">
        <div className="space-y-3">
          {SERVICIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServicioId(s.id)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-left transition ${
                servicioId === s.id
                  ? "border-primary bg-primary/10 shadow-gold"
                  : "border-border bg-card"
              }`}
            >
              <span>
                <span className="block font-semibold">{s.nombre}</span>
                <span className="block text-xs text-muted-foreground">{s.descripcion}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{s.duracion} minutos</span>
              </span>
              <span className="shrink-0 font-semibold text-primary">{formatPesos(s.precio)}</span>
            </button>
          ))}
        </div>
      </Bloque>

      <Bloque titulo="2. ¿Con quién quieres tu turno?">
        <div className="grid grid-cols-2 gap-3">
          {[{ id: "cualquiera", nombre: "Cualquiera", especialidad: "El primero disponible" }, ...BARBEROS].map(
            (b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBarberoId(b.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  barberoId === b.id ? "border-primary bg-primary/10" : "border-border bg-card"
                }`}
              >
                <span className="block font-semibold">{b.nombre}</span>
                <span className="block text-xs text-muted-foreground">{b.especialidad}</span>
              </button>
            ),
          )}
        </div>
      </Bloque>

      <Bloque titulo="3. Fecha y hora">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {dias.map((d) => (
            <button
              key={d.iso}
              type="button"
              onClick={() => {
                setFecha(d.iso);
                setHora(null);
              }}
              className={`min-w-16 rounded-xl border px-3 py-3 text-center transition ${
                fecha === d.iso ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              <span className="block text-xs uppercase text-muted-foreground">{d.dia}</span>
              <span className="block text-lg font-semibold">{d.num}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {HORAS.map((h) => {
            const libre = horaDisponible(h);
            return (
              <button
                key={h}
                type="button"
                disabled={!libre}
                onClick={() => setHora(h)}
                className={`rounded-lg border py-3 text-sm font-semibold transition ${
                  hora === h
                    ? "border-primary bg-primary text-primary-foreground"
                    : libre
                      ? "border-border bg-card"
                      : "border-transparent bg-muted/40 text-muted-foreground line-through"
                }`}
              >
                {h}
              </button>
            );
          })}
        </div>
      </Bloque>

      <Bloque titulo="4. Tus datos">
        <form onSubmit={confirmar} className="space-y-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            placeholder="Nombre y apellido"
            className="w-full rounded-lg border border-input bg-secondary px-4 py-3 outline-none focus:border-primary"
          />
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            maxLength={20}
            inputMode="tel"
            placeholder="Celular (ej: 310 456 7821)"
            className="w-full rounded-lg border border-input bg-secondary px-4 py-3 outline-none focus:border-primary"
          />
          <div className="rounded-lg border border-border bg-secondary/60 p-3 text-xs text-muted-foreground">
            El pago se realiza directamente en el establecimiento en efectivo o Nequi/Daviplata al
            finalizar el servicio.
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            className="w-full rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-gold"
          >
            Confirmar cita · {nombreServicio(servicioId)}
          </button>
        </form>
      </Bloque>
    </main>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="mb-3 text-xl">{titulo}</h3>
      {children}
    </section>
  );
}
