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
  type Cita,
  type EstadoCita,
} from "@/lib/barber-store";

const PIN = "1234";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel del día — BarberStudio" },
      {
        name: "description",
        content:
          "Panel interno de BarberStudio: agenda del día, estados de citas y registro de walk-ins.",
      },
      { property: "og:title", content: "Panel del día — BarberStudio" },
      {
        property: "og:description",
        content: "Agenda del día, estados de citas y citas rápidas para el equipo.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const badge: Record<EstadoCita, string> = {
  pendiente: "bg-warning/15 text-warning border-warning/40",
  completada: "bg-success/15 text-success border-success/40",
  cancelada: "bg-destructive/15 text-destructive border-destructive/40",
};

function Admin() {
  const [pin, setPin] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState("");

  if (!abierto) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <h1 className="gold-text text-4xl">BARBERSTUDIO</h1>
        <p className="mt-1 text-sm text-muted-foreground">Acceso solo para el equipo.</p>
        <form
          className="mt-6 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (pin === PIN) setAbierto(true);
            else setError("PIN incorrecto.");
          }}
        >
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="PIN"
            className="w-full rounded-lg border border-input bg-secondary px-4 py-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-primary"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button className="w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-gold">
            Entrar
          </button>
          <p className="text-center text-xs text-muted-foreground">PIN de demostración: 1234</p>
          <Link to="/" className="block text-center text-xs text-muted-foreground underline">
            Volver a la reserva
          </Link>
        </form>
      </main>
    );
  }

  return <Agenda />;
}

function Agenda() {
  const { citas, cambiarEstado } = useBarber();
  const [fecha, setFecha] = useState(hoyISO());
  const [filtroBarbero, setFiltroBarbero] = useState("todos");
  const [modal, setModal] = useState(false);

  const delDia = useMemo(
    () =>
      citas
        .filter((c) => c.fecha === fecha)
        .filter((c) => filtroBarbero === "todos" || c.barberoId === filtroBarbero)
        .sort((a, b) => a.hora.localeCompare(b.hora)),
    [citas, fecha, filtroBarbero],
  );

  const pendientes = delDia.filter((c) => c.estado === "pendiente").length;
  const porCobrar = delDia
    .filter((c) => c.estado === "pendiente")
    .reduce((total, c) => total + (SERVICIOS.find((s) => s.id === c.servicioId)?.precio ?? 0), 0);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 pb-28">
      <header className="flex items-start justify-between py-6">
        <div>
          <p className="text-xs tracking-[0.3em] text-primary">PANEL DEL DÍA</p>
          <h1 className="text-3xl capitalize">{formatFechaLarga(fecha)}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {delDia.length} citas · {pendientes} pendientes
            <span className="rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
              Por cobrar {formatPesos(porCobrar)}
            </span>
          </p>
        </div>
        <Link to="/" className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
          Vista cliente
        </Link>
      </header>

      <div className="card-surface space-y-3 p-4">
        <label className="block text-xs text-muted-foreground">
          Fecha
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="mt-1 w-full rounded-lg border border-input bg-secondary px-3 py-3 text-base text-foreground outline-none focus:border-primary"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {[{ id: "todos", nombre: "Todos" }, ...BARBEROS].map((b) => (
            <button
              key={b.id}
              onClick={() => setFiltroBarbero(b.id)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                filtroBarbero === b.id
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {b.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {delDia.length === 0 && (
          <p className="card-surface p-6 text-center text-sm text-muted-foreground">
            No hay citas para este filtro.
          </p>
        )}
        {delDia.map((c) => (
          <TarjetaCita key={c.id} cita={c} onEstado={cambiarEstado} />
        ))}
      </div>

      <button
        onClick={() => setModal(true)}
        className="fixed bottom-5 left-1/2 w-[min(90%,36rem)] -translate-x-1/2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-gold"
      >
        + Cita rápida / Walk-in
      </button>

      {modal && <ModalCitaRapida fecha={fecha} onClose={() => setModal(false)} />}
    </main>
  );
}

function TarjetaCita({
  cita,
  onEstado,
}: {
  cita: Cita;
  onEstado: (id: string, estado: EstadoCita) => void;
}) {
  const servicio = SERVICIOS.find((s) => s.id === cita.servicioId);
  return (
    <article className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl text-primary">{cita.hora}</p>
          <p className="font-semibold">{cita.cliente}</p>
          <p className="text-xs text-muted-foreground">
            {nombreServicio(cita.servicioId)} · {nombreBarbero(cita.barberoId)} ·{" "}
            {servicio ? formatPesos(servicio.precio) : ""}
          </p>
          <a href={`tel:${cita.telefono.replace(/\s/g, "")}`} className="text-xs text-primary underline">
            {cita.telefono}
          </a>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badge[cita.estado]}`}>
          {cita.estado}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onEstado(cita.id, "completada")}
          disabled={cita.estado === "completada"}
          className="flex-1 rounded-lg border border-success/50 py-2.5 text-sm font-semibold text-success disabled:opacity-40"
        >
          Completada
        </button>
        <button
          onClick={() => onEstado(cita.id, "pendiente")}
          disabled={cita.estado === "pendiente"}
          className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted-foreground disabled:opacity-40"
        >
          Pendiente
        </button>
        <button
          onClick={() => onEstado(cita.id, "cancelada")}
          disabled={cita.estado === "cancelada"}
          className="flex-1 rounded-lg border border-destructive/50 py-2.5 text-sm font-semibold text-destructive disabled:opacity-40"
        >
          Cancelar
        </button>
      </div>
    </article>
  );
}

function ModalCitaRapida({ fecha, onClose }: { fecha: string; onClose: () => void }) {
  const { agendar, estaOcupado } = useBarber();
  const [form, setForm] = useState({
    cliente: "",
    telefono: "",
    barberoId: "carlos",
    servicioId: "corte",
    hora: "",
    fecha,
  });
  const [error, setError] = useState("");

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.cliente.trim().length < 3) return setError("Escribe el nombre del cliente.");
    if (!form.hora) return setError("Selecciona la hora.");
    if (estaOcupado(form.fecha, form.hora, form.barberoId))
      return setError("Ese barbero ya tiene una cita a esa hora.");
    agendar({ ...form, cliente: form.cliente.trim(), telefono: form.telefono.trim() || "Sin teléfono", origen: "manual" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 sm:items-center sm:p-6">
      <form
        onSubmit={guardar}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 sm:mx-auto sm:max-w-md sm:rounded-2xl"
      >
        <h2 className="text-2xl">Cita rápida</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Para clientes que llaman o llegan caminando.
        </p>
        <div className="space-y-3">
          <input
            value={form.cliente}
            onChange={(e) => setForm({ ...form, cliente: e.target.value })}
            maxLength={80}
            placeholder="Nombre del cliente"
            className="w-full rounded-lg border border-input bg-secondary px-4 py-3 outline-none focus:border-primary"
          />
          <input
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            maxLength={20}
            inputMode="tel"
            placeholder="Celular (opcional)"
            className="w-full rounded-lg border border-input bg-secondary px-4 py-3 outline-none focus:border-primary"
          />
          <select
            value={form.servicioId}
            onChange={(e) => setForm({ ...form, servicioId: e.target.value })}
            className="w-full rounded-lg border border-input bg-secondary px-4 py-3 outline-none focus:border-primary"
          >
            {SERVICIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} · {formatPesos(s.precio)}
              </option>
            ))}
          </select>
          <select
            value={form.barberoId}
            onChange={(e) => setForm({ ...form, barberoId: e.target.value })}
            className="w-full rounded-lg border border-input bg-secondary px-4 py-3 outline-none focus:border-primary"
          >
            {BARBEROS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              className="rounded-lg border border-input bg-secondary px-3 py-3 outline-none focus:border-primary"
            />
            <select
              value={form.hora}
              onChange={(e) => setForm({ ...form, hora: e.target.value })}
              className="rounded-lg border border-input bg-secondary px-3 py-3 outline-none focus:border-primary"
            >
              <option value="">Hora</option>
              {HORAS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3.5 font-semibold text-muted-foreground"
          >
            Cerrar
          </button>
          <button className="flex-1 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground">
            Guardar cita
          </button>
        </div>
      </form>
    </div>
  );
}
