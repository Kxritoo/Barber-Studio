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
      { title: "BarberStudio Medellín — Reserva tu turno online" },
      {
        name: "description",
        content:
          "Agenda tu corte o perfilado de barba en BarberStudio El Poblado. Elige barbero, servicio y hora disponible en segundos. Pago en el local.",
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

// Número de WhatsApp de la barbería (código de país + número, sin espacios ni +)
const WHATSAPP_NUMERO = "573001234567";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(
  "Hola BarberStudio, tengo una duda sobre mi turno.",
)}`;

const DIAS_SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

const TESTIMONIOS = [
  {
    nombre: "Juan Pérez",
    comentario: "Excelente servicio, quedé como nuevo. El mejor corte de El Poblado sin duda.",
  },
  {
    nombre: "Felipe Gómez",
    comentario: "Muy puntual, me atendieron a la hora exacta de mi turno. Los recomiendo.",
  },
  {
    nombre: "Andrés Rincón",
    comentario: "El combo corte + barba es brutal, y apartando por la web no pierdo ni un minuto.",
  },
];

const FAQS = [
  {
    pregunta: "¿Cómo puedo cancelar o reprogramar mi cita?",
    respuesta: "Escríbenos directamente al WhatsApp con 2 horas de anticipación.",
  },
  {
    pregunta: "¿Qué medios de pago aceptan?",
    respuesta: "Efectivo, Nequi y Daviplata en el local.",
  },
];

function proximosDias(cantidad: number) {
  const base = new Date();
  return Array.from({ length: cantidad }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    return {
      iso: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
        d.getUTCDate(),
      ).padStart(2, "0")}`,
      dia: DIAS_SEMANA[d.getUTCDay()],
      num: d.getUTCDate(),
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
          <p className="text-xs tracking-[0.35em] text-primary">MEDELLÍN · EL POBLADO</p>
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

      <Bloque titulo="Lo que dicen nuestros clientes">
        <div className="grid gap-3 sm:grid-cols-3">
          {TESTIMONIOS.map((t) => (
            <figure key={t.nombre} className="card-surface p-4">
              <div className="flex gap-0.5 text-primary" aria-label="5 de 5 estrellas">
                {Array.from({ length: 5 }, (_, i) => (
                  <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                    <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9l-5.3 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                  </svg>
                ))}
              </div>
              <blockquote className="mt-2 text-sm text-foreground/90">"{t.comentario}"</blockquote>
              <figcaption className="mt-2 text-xs font-semibold text-muted-foreground">{t.nombre}</figcaption>
            </figure>
          ))}
        </div>
      </Bloque>

      <Bloque titulo="Preguntas frecuentes">
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.pregunta} className="card-surface rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="cursor-pointer list-none text-sm font-semibold">{f.pregunta}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.respuesta}</p>
            </details>
          ))}
        </div>
      </Bloque>

      <footer className="mt-10 pb-2 text-center text-xs text-muted-foreground">
        © 2026 BarberStudio Medellín - Todos los derechos reservados
      </footer>


      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-whatsapp py-3 pl-4 pr-5 text-sm font-semibold text-whatsapp-foreground shadow-lg transition hover:brightness-110"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91A9.85 9.85 0 0 0 12.04 2Zm5.8 14.05c-.24.68-1.4 1.3-1.93 1.35-.53.06-1.02.24-3.44-.72-2.92-1.15-4.76-4.17-4.9-4.37-.15-.2-1.17-1.55-1.17-2.96 0-1.4.73-2.09 1-2.38.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.56.8 1.95.87 2.09.07.14.12.31.02.5-.1.2-.15.32-.29.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.29.75 1.24 1.61 2.01 1.11.99 2.04 1.29 2.33 1.44.29.15.46.12.63-.07.17-.2.72-.84.92-1.13.19-.29.39-.24.65-.14.27.09 1.68.79 1.97.94.29.14.48.22.55.34.07.13.07.74-.17 1.42Z" />
        </svg>
        ¿Tienes dudas? Escríbenos
      </a>
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
