import { modoDemo } from "./store.js";

export const hora = (ms) =>
  new Date(ms).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

/** "12 min", "1 h 05 min" o "Llegando" si ya pasó la hora. */
export function faltan(ms, ahora = Date.now()) {
  const min = Math.ceil((ms - ahora) / 60_000);
  if (min <= 0) return "Llegando";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")} min`;
}

/** Crea un elemento con texto seguro (sin innerHTML para datos del usuario). */
export function el(tag, clase, texto) {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
}

export function avisoDemo() {
  if (!modoDemo) return;
  const a = el(
    "div",
    "aviso-demo",
    "MODO DEMO: los datos solo se comparten entre pestañas de este navegador. Configura Firebase en js/config.js para usarlo en varios equipos."
  );
  document.body.prepend(a);
}

export function mensaje(nodo, texto, tipo = "ok") {
  nodo.textContent = texto;
  nodo.className = `mensaje ${tipo}`;
}
