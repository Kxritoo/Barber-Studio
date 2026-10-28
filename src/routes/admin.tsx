import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  BARBEROS,
  HORAS,
  SERVICIOS,
  formatFechaLarga,
  formatPesos,
  hoyISO,
  nombreServicio
} from "@/lib/barber-store";
import { supabase } from "@/lib/supabase";

const PIN = "1234";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel del día — BarberStudio" },
      {
        name: "description",
        content:
          "Panel interno de BarberStudio: agenda del día, estados de turnos y registro de walk-ins.",
      },
      { property: "og:title", content: "Panel del día — BarberStudio" },
      {
        property: "og:description",
        content: "Agenda del día, estados de turnos y turnos rápidos para el equipo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const badge: Record<string, string> = {
  Pendiente: "bg-warning/15 text-warning border-warning/40",
  Completada: "bg-success/15 text-success border-success/40",
  Cancelada: "bg-destructive/15 text-destructive border-destructive/40",
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
  const [citas, setCitas] = useState<any[]>([]);
  const [barberosDB, setBarberosDB] = useState<any[]>([]);
  const [fecha, setFecha] = useState(hoyISO());
  const [filtroBarbero, setFiltroBarbero] = useState("todos");
  const [modal, setModal] = useState(false);

  const cargarDatosAdmin = async () => {
    const { data: turnosData } = await supabase.from("turnos").select("*");
    if (turnosData) setCitas(turnosData);

    const { data: barberosData } = await supabase.from("barberos").select("*");
    if (barberosData) setBarberosDB(barberosData);
  };

  useEffect(() => {
    cargarDatosAdmin();
  }, []);

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from("turnos")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (!error) {
      cargarDatosAdmin();
    }
  };

  const nombreBarberoUuid = (uuid: string) => {
    const b = barberosDB.find((item) => item.id === uuid);
    return b ? b.nombre : "Barbero";
  };

  const delDia = useMemo(() => {
    return citas
      .filter((c) => c.fecha === fecha)
      .filter((c) => {
        if (filtroBarbero === "todos") return true;
        const localBarber = BARBEROS.find((b) => b.id === filtroBarbero);
        const dbBarber = barberosDB.find((b) => b.nombre.toLowerCase() === localBarber?.nombre.toLowerCase());
        return c.barbero_id === dbBarber?.id;
      })
      .sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  }, [citas, fecha, filtroBarbero, barberosDB]);

  const pendientes = delDia.filter((c) => c.estado === "Pendiente").length;
  const porCobrar = delDia
    .filter((c) => c.estado === "Pendiente")
    .reduce((total, c) => total + (c.precio ?? 0), 0);
  const totalGanado = delDia
    .filter((c) => c.estado === "Completada")
    .reduce((total, c) => total + (c.precio ?? 0), 0);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 pb-28">
      <header className="flex items-start justify-between py-6">
        <div>
          <p className="text-xs tracking-[0.3em] text-primary">PANEL DEL DÍA</p>
          <h1 className="text-3xl capitalize">{formatFechaLarga(fecha)}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{delDia.length} turnos · {pendientes} pendientes</span>
            <span className="rounded-full border border-primary/50 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Por cobrar {formatPesos(porCobrar)}
            </span>
            <span className="rounded-full border border-success/40 bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
              Total ganado {formatPesos(totalGanado)}
            </span>
          </div>
        </div>
        <Link to="/" className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
          Vista cliente
        </Link>
      </header>

      <PruebaIABasica citas={citas} barberos={barberosDB} onCambio={cargarDatosAdmin} />

      <div className="card-surface mt-5 space-y-3 p-4">
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
            No hay turnos para este filtro.
          </p>
        )}
        {delDia.map((c) => (
          <TarjetaCita
            key={c.id}
            cita={c}
            nombreBarb={nombreBarberoUuid(c.barbero_id)}
            onEstado={cambiarEstado}
          />
        ))}
      </div>

      <button
        onClick={() => setModal(true)}
        className="fixed bottom-5 left-1/2 w-[min(90%,36rem)] -translate-x-1/2 rounded-xl bg-primary py-4 text-base font-bold text-primary-foreground shadow-gold"
      >
        + Turno rápido / Walk-in
      </button>

      {modal && (
        <ModalCitaRapida
          fecha={fecha}
          barberosDB={barberosDB}
          onClose={() => {
            setModal(false);
            cargarDatosAdmin();
          }}
        />
      )}
    </main>
  );
}

function TarjetaCita({
  cita,
  nombreBarb,
  onEstado,
}: {
  cita: any;
  nombreBarb: string;
  onEstado: (id: string, estado: string) => void;
}) {
  return (
    <article className="card-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl text-primary">{cita.hora?.substring(0, 5)}</p>
          <p className="font-semibold">{cita.cliente_nombre}</p>
          <p className="text-xs text-muted-foreground">
            {cita.servicio} · {nombreBarb} · {formatPesos(cita.precio)}
          </p>
          {cita.cliente_telefono && (
            <a href={`tel:${cita.cliente_telefono}`} className="text-xs text-primary underline">
              {cita.cliente_telefono}
            </a>
          )}
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${badge[cita.estado] || "bg-secondary text-foreground"}`}>
          {cita.estado}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onEstado(cita.id, "Completada")}
          disabled={cita.estado === "Completada"}
          className="flex-1 rounded-lg border border-success/50 py-2.5 text-sm font-semibold text-success disabled:opacity-40"
        >
          Completada
        </button>
        <button
          onClick={() => onEstado(cita.id, "Pendiente")}
          disabled={cita.estado === "Pendiente"}
          className="flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted-foreground disabled:opacity-40"
        >
          Pendiente
        </button>
        <button
          onClick={() => onEstado(cita.id, "Cancelada")}
          disabled={cita.estado === "Cancelada"}
          className="flex-1 rounded-lg border border-destructive/50 py-2.5 text-sm font-semibold text-destructive disabled:opacity-40"
        >
          Cancelar
        </button>
      </div>
    </article>
  );
}

function ModalCitaRapida({
  fecha,
  barberosDB,
  onClose,
}: {
  fecha: string;
  barberosDB: any[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    cliente: "",
    telefono: "",
    barberoFrontendId: "carlos",
    servicioId: "corte",
    hora: "",
    fecha,
  });
  const [error, setError] = useState("");

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.cliente.trim().length < 3) return setError("Escribe el nombre del cliente.");
    if (!form.hora) return setError("Selecciona la hora.");

    const localBarber = BARBEROS.find((b) => b.id === form.barberoFrontendId);
    const dbBarber = barberosDB.find((b) => b.nombre.toLowerCase() === localBarber?.nombre.toLowerCase());
    if (!dbBarber) return setError("Error identificando al barbero.");

    const servicioObj = SERVICIOS.find((s) => s.id === form.servicioId);

    const { error: dbError } = await supabase.from("turnos").insert([
      {
        fecha: form.fecha,
        hora: form.hora,
        barbero_id: dbBarber.id,
        servicio: servicioObj?.nombre || form.servicioId,
        precio: servicioObj?.precio || 0,
        cliente_nombre: form.cliente.trim(),
        cliente_telefono: form.telefono.trim() || null,
        estado: "Pendiente",
        es_walk_in: true,
      },
    ]);

    if (dbError) {
      return setError(`Error: ${dbError.message}`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 p-0 sm:items-center sm:p-6">
      <form
        onSubmit={guardar}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 sm:mx-auto sm:max-w-md sm:rounded-2xl"
      >
        <h2 className="text-2xl">Turno rápido</h2>
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
            value={form.barberoFrontendId}
            onChange={(e) => setForm({ ...form, barberoFrontendId: e.target.value })}
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
            className="flex-1 rounded-lg border border-border py-3.5 font-semibold text-muted-foreground"
          >
            Cerrar
          </button>
          <button className="flex-1 rounded-lg bg-primary py-3.5 font-bold text-primary-foreground">
            Guardar turno
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// ASISTENTE IA (GEMINI) CON CHAT Y ACCIONES
// ─────────────────────────────────────────────

type Mensaje = { rol: "user" | "ia" | "error"; texto: string };
type Accion = {
  id: string; // id del turno en Supabase
  estado: string; // nuevo estado
  resumen: string; // "Turno de X a las 10:30 (Carlos)"
  descripcion: string; // "Cancelar: Turno de X a las 10:30 (Carlos)"
};

// Orden de prioridad: si uno está saturado o no existe, prueba el siguiente.
const MODELOS_GEMINI = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"];
const ESTADOS_VALIDOS = ["Cancelada", "Completada", "Pendiente"];
const VERBOS: Record<string, string> = {
  Cancelada: "Cancelar",
  Completada: "Marcar como completado",
  Pendiente: "Volver a pendiente",
};
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Le describe a Gemini la "herramienta" que puede pedir usar.
// OJO: Gemini NO toca la base de datos. Solo PIDE la acción; la app la ejecuta
// después de que tú confirmes con un botón.
const HERRAMIENTAS = [
  {
    functionDeclarations: [
      {
        name: "cambiar_estado_turno",
        description:
          "Cambia el estado de un turno existente: cancelarlo, marcarlo como completado o devolverlo a pendiente. Úsala SOLO cuando el usuario lo pida de forma explícita.",
        parameters: {
          type: "OBJECT",
          properties: {
            turno_id: {
              type: "STRING",
              description: "El id exacto del turno, tal como aparece en la lista de TURNOS.",
            },
            nuevo_estado: {
              type: "STRING",
              enum: ESTADOS_VALIDOS,
              description: "El nuevo estado del turno.",
            },
          },
          required: ["turno_id", "nuevo_estado"],
        },
      },
    ],
  },
];

// Convierte los datos de Supabase en un texto que Gemini pueda leer
function armarContexto(citas: any[], barberos: any[]): string {
  const nombreBarbero = (id: string) =>
    barberos.find((b) => b.id === id)?.nombre ?? "Desconocido";

  // Solo turnos de los últimos 30 días en adelante, para no enviar de más
  const limite = new Date();
  limite.setDate(limite.getDate() - 30);
  const desde = limite.toISOString().slice(0, 10);

  const recientes = citas
    .filter((c) => c.fecha >= desde)
    .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
    .slice(0, 300);

  const hoy = hoyISO();
  const horaActual = new Date().toLocaleTimeString("es-CO", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const deHoy = recientes.filter((c) => c.fecha === hoy);
  const suma = (lista: any[]) => lista.reduce((t, c) => t + (c.precio ?? 0), 0);

  // Estos totales se calculan aquí, porque la IA a veces se equivoca sumando
  const resumenHoy = [
    `Turnos hoy: ${deHoy.length}`,
    `Pendientes hoy: ${deHoy.filter((c) => c.estado === "Pendiente").length}`,
    `Por cobrar hoy: ${suma(deHoy.filter((c) => c.estado === "Pendiente"))}`,
    `Ganado hoy: ${suma(deHoy.filter((c) => c.estado === "Completada"))}`,
  ].join("\n");

  const lineas = recientes.map((c) => {
    const hora = (c.hora || "").substring(0, 5);
    const atrasado =
      c.fecha === hoy && c.estado === "Pendiente" && hora && hora < horaActual
        ? " | ATRASADO: la hora ya pasó y sigue pendiente"
        : "";
    return `${c.id} | ${c.fecha} | ${hora} | ${c.cliente_nombre} | ${c.servicio} | ${nombreBarbero(c.barbero_id)} | $${c.precio ?? 0} | ${c.estado}${atrasado}`;
  });

  return `Fecha de hoy: ${hoy}
Hora actual (Colombia): ${horaActual}
Barberos: ${barberos.map((b) => b.nombre).join(", ")}

RESUMEN DE HOY:
${resumenHoy}

TURNOS (id | fecha | hora | cliente | servicio | barbero | precio | estado):
${lineas.join("\n") || "No hay turnos registrados."}`;
}

// Envía TODO el historial del chat + los datos actuales. Devuelve texto y,
// si el usuario pidió cambiar un turno, la acción que propone Gemini.
async function preguntarGemini(
  historial: Mensaje[],
  contexto: string
): Promise<{ texto: string; accion?: { id: string; estado: string } }> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("No se encuentra la llave VITE_GEMINI_API_KEY");

  const instrucciones = `Eres el asistente interno de BarberStudio, una barbería. Respondes en español, de forma breve y clara, usando SOLO los datos de abajo. Si la respuesta no está en los datos, di que no tienes esa información. No inventes turnos, clientes ni precios.

Si el usuario te pide cancelar un turno, marcarlo como completado o devolverlo a pendiente, usa la función cambiar_estado_turno con el id EXACTO del turno. Si hay más de un turno que podría coincidir, o no estás seguro de cuál es, pregunta primero. Nunca afirmes que la acción ya se hizo: el usuario debe confirmarla con un botón. Responde con una frase corta explicando qué vas a hacer.

${contexto}`;

  // Solo texto: sin mensajes de error, máximo 20 mensajes, y empezando por el usuario
  const contents = historial
    .filter((m) => m.rol !== "error" && m.texto.trim())
    .slice(-20)
    .map((m) => ({
      role: m.rol === "user" ? "user" : "model",
      parts: [{ text: m.texto }],
    }));
  while (contents.length && contents[0].role === "model") contents.shift();

  let ultimoError = new Error("No se pudo conectar con Gemini.");

  for (const modelo of MODELOS_GEMINI) {
    for (let intento = 0; intento < 3; intento++) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: instrucciones }] },
            contents,
            tools: HERRAMIENTAS,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const parts: any[] = data.candidates?.[0]?.content?.parts ?? [];
        const texto = parts
          .filter((p) => !p.thought)
          .map((p) => p.text ?? "")
          .join("")
          .trim();
        const llamada = parts.find((p) => p.functionCall)?.functionCall;

        if (llamada?.name === "cambiar_estado_turno") {
          return {
            texto,
            accion: {
              id: String(llamada.args?.turno_id ?? ""),
              estado: String(llamada.args?.nuevo_estado ?? ""),
            },
          };
        }
        return {
          texto:
            texto ||
            "Gemini no devolvió texto (puede que la respuesta fuera bloqueada).",
        };
      }

      const body = await response.json().catch(() => ({}));
      ultimoError = new Error(body?.error?.message || `Error HTTP ${response.status}`);

      // 404: ese modelo no existe, pasa al siguiente modelo
      if (response.status === 404) break;
      // Errores temporales: espera y reintenta (1s, 2s, 4s)
      if ([429, 500, 503].includes(response.status)) {
        await esperar(1000 * 2 ** intento);
        continue;
      }
      // Cualquier otro error (key inválida, etc.): falla de una vez
      throw ultimoError;
    }
  }

  throw ultimoError;
}

function PruebaIABasica({
  citas,
  barberos,
  onCambio,
}: {
  citas: any[];
  barberos: any[];
  onCambio: () => Promise<void> | void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pregunta, setPregunta] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [accion, setAccion] = useState<Accion | null>(null);
  const [ejecutando, setEjecutando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  // Baja el chat al último mensaje
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, accion, cargando, isOpen]);

  const agregar = (rol: Mensaje["rol"], texto: string) =>
    setMensajes((prev) => [...prev, { rol, texto }]);

  const enviar = async () => {
    const texto = pregunta.trim();
    if (!texto || cargando) return;

    const nuevoHistorial: Mensaje[] = [...mensajes, { rol: "user", texto }];
    setMensajes(nuevoHistorial);
    setPregunta("");
    setAccion(null);
    setCargando(true);

    try {
      const r = await preguntarGemini(nuevoHistorial, armarContexto(citas, barberos));

      if (r.accion) {
        // Verifico yo mismo que el turno exista y que el estado sea válido
        const cita = citas.find((c) => c.id === r.accion!.id);
        if (!cita || !ESTADOS_VALIDOS.includes(r.accion.estado)) {
          agregar(
            "ia",
            r.texto ||
              "No pude identificar ese turno con seguridad. ¿Me dices el nombre del cliente y la hora?"
          );
        } else {
          const nombreB = barberos.find((b) => b.id === cita.barbero_id)?.nombre ?? "Barbero";
          const resumen = `Turno de ${cita.cliente_nombre} a las ${(cita.hora || "").substring(0, 5)} (${nombreB}, ${cita.fecha})`;
          agregar("ia", r.texto || "Puedo hacer ese cambio. Confírmalo aquí abajo:");
          setAccion({
            id: cita.id,
            estado: r.accion.estado,
            resumen,
            descripcion: `${VERBOS[r.accion.estado]}: ${resumen}`,
          });
        }
      } else {
        agregar("ia", r.texto);
      }
    } catch (err: any) {
      const msg: string = err.message || "";
      agregar(
        "error",
        msg.toLowerCase().includes("high demand")
          ? "Gemini está muy ocupado en este momento. Intenta de nuevo en unos segundos."
          : `No se pudo obtener respuesta: ${msg}`
      );
    } finally {
      setCargando(false);
    }
  };

  const confirmar = async () => {
    if (!accion) return;
    setEjecutando(true);
    const { error } = await supabase
      .from("turnos")
      .update({ estado: accion.estado })
      .eq("id", accion.id);
    setEjecutando(false);

    if (error) {
      agregar("error", `No se pudo cambiar el turno: ${error.message}`);
    } else {
      agregar("ia", `✅ Listo. ${accion.resumen} ahora está: ${accion.estado}.`);
      await onCambio(); // refresca la agenda y los datos de la IA
    }
    setAccion(null);
  };

  const descartar = () => {
    if (!accion) return;
    agregar("ia", "Entendido, no hice ningún cambio.");
    setAccion(null);
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground shadow-gold transition-transform hover:scale-105"
        title="Asistente IA"
      >
        ✨
      </button>

      {/* Ventana del Chat (el historial se conserva aunque la cierres; se borra al refrescar) */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(90vw,24rem)] rounded-xl border border-primary/30 bg-card p-5 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="gold-text text-lg font-bold">Asistente IA</h3>
            <div className="flex items-center gap-3">
              {mensajes.length > 0 && (
                <button
                  onClick={() => {
                    setMensajes([]);
                    setAccion(null);
                  }}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Borrar chat
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="mb-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {mensajes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Pregúntame por los turnos, barberos o ingresos. También puedo cancelar o
                completar un turno si me lo pides (te pediré confirmación).
              </p>
            )}

            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs ${
                    m.rol === "user"
                      ? "bg-primary text-primary-foreground"
                      : m.rol === "error"
                        ? "border border-destructive/40 bg-destructive/15 text-destructive"
                        : "border border-border bg-secondary text-foreground"
                  }`}
                >
                  {m.texto}
                </div>
              </div>
            ))}

            {cargando && (
              <div className="flex justify-start">
                <div className="rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  Consultando...
                </div>
              </div>
            )}

            {/* Confirmación de acción */}
            {accion && (
              <div className="rounded-lg border border-primary/50 bg-primary/10 p-3">
                <p className="text-xs font-semibold text-foreground">{accion.descripcion}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={confirmar}
                    disabled={ejecutando}
                    className="flex-1 rounded-lg bg-primary py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                  >
                    {ejecutando ? "Aplicando..." : "Confirmar"}
                  </button>
                  <button
                    onClick={descartar}
                    disabled={ejecutando}
                    className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold text-muted-foreground disabled:opacity-50"
                  >
                    No, cancelar
                  </button>
                </div>
              </div>
            )}

            <div ref={finRef} />
          </div>

          {/* Entrada */}
          <div className="flex gap-2">
            <input
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              placeholder="Escribe tu pregunta..."
              className="min-w-0 flex-1 rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            <button
              onClick={enviar}
              disabled={cargando || !pregunta.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
