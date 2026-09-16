import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type EstadoCita = "pendiente" | "completada" | "cancelada";

export type Servicio = {
  id: string;
  nombre: string;
  precio: number;
  duracion: number;
  descripcion: string;
};

export type Barbero = { id: string; nombre: string; especialidad: string };

export type Cita = {
  id: string;
  fecha: string; // yyyy-mm-dd
  hora: string; // HH:mm
  barberoId: string;
  servicioId: string;
  cliente: string;
  telefono: string;
  estado: EstadoCita;
  origen: "web" | "manual";
};

export const SERVICIOS: Servicio[] = [
  {
    id: "corte",
    nombre: "Corte Tradicional",
    precio: 25000,
    duracion: 30,
    descripcion: "Tijera, máquina y acabado con navaja.",
  },
  {
    id: "barba",
    nombre: "Perfilado de Barba",
    precio: 15000,
    duracion: 20,
    descripcion: "Diseño, toalla caliente y aceites.",
  },
  {
    id: "combo",
    nombre: "Combo Corte + Barba",
    precio: 35000,
    duracion: 50,
    descripcion: "El favorito de la casa, ritual completo.",
  },
];

export const BARBEROS: Barbero[] = [
  { id: "carlos", nombre: "Carlos", especialidad: "Clásicos y navaja" },
  { id: "santi", nombre: "Santi", especialidad: "Fades y diseños" },
  { id: "mateo", nombre: "Mateo", especialidad: "Barbas y perfilado" },
];

export const HORAS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
];

export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function formatPesos(valor: number) {
  return `$${valor.toLocaleString("es-CO")} COP`;
}

export function formatFechaLarga(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function nombreServicio(id: string) {
  return SERVICIOS.find((s) => s.id === id)?.nombre ?? "Servicio";
}

export function nombreBarbero(id: string) {
  return BARBEROS.find((b) => b.id === id)?.nombre ?? "Sin asignar";
}

const CITAS_INICIALES: Cita[] = [
  {
    id: "c1",
    fecha: hoyISO(),
    hora: "09:00",
    barberoId: "carlos",
    servicioId: "corte",
    cliente: "Juan Pérez",
    telefono: "310 456 7821",
    estado: "completada",
    origen: "web",
  },
  {
    id: "c2",
    fecha: hoyISO(),
    hora: "10:30",
    barberoId: "santi",
    servicioId: "combo",
    cliente: "Felipe Gómez",
    telefono: "320 998 1140",
    estado: "pendiente",
    origen: "web",
  },
  {
    id: "c3",
    fecha: hoyISO(),
    hora: "11:30",
    barberoId: "mateo",
    servicioId: "barba",
    cliente: "Andrés Rincón",
    telefono: "301 220 7745",
    estado: "pendiente",
    origen: "manual",
  },
  {
    id: "c4",
    fecha: hoyISO(),
    hora: "15:00",
    barberoId: "carlos",
    servicioId: "combo",
    cliente: "Sebastián Ortiz",
    telefono: "312 777 3390",
    estado: "cancelada",
    origen: "web",
  },
  {
    id: "c5",
    fecha: hoyISO(),
    hora: "17:00",
    barberoId: "santi",
    servicioId: "corte",
    cliente: "Camilo Restrepo",
    telefono: "318 654 2201",
    estado: "pendiente",
    origen: "web",
  },
];

type Store = {
  citas: Cita[];
  agendar: (c: Omit<Cita, "id" | "estado">) => Cita;
  cambiarEstado: (id: string, estado: EstadoCita) => void;
  estaOcupado: (fecha: string, hora: string, barberoId: string) => boolean;
  barberosLibres: (fecha: string, hora: string) => Barbero[];
};

const StoreContext = createContext<Store | null>(null);

export function BarberProvider({ children }: { children: ReactNode }) {
  const [citas, setCitas] = useState<Cita[]>(CITAS_INICIALES);

  const value = useMemo<Store>(() => {
    const activas = (fecha: string, hora: string) =>
      citas.filter((c) => c.fecha === fecha && c.hora === hora && c.estado !== "cancelada");

    return {
      citas,
      agendar: (data) => {
        const nueva: Cita = { ...data, id: crypto.randomUUID(), estado: "pendiente" };
        setCitas((prev) => [...prev, nueva]);
        return nueva;
      },
      cambiarEstado: (id, estado) =>
        setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c))),
      estaOcupado: (fecha, hora, barberoId) =>
        activas(fecha, hora).some((c) => c.barberoId === barberoId),
      barberosLibres: (fecha, hora) => {
        const ocupados = activas(fecha, hora).map((c) => c.barberoId);
        return BARBEROS.filter((b) => !ocupados.includes(b.id));
      },
    };
  }, [citas]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useBarber() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useBarber debe usarse dentro de BarberProvider");
  return ctx;
}
