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

/** "46", "e46", "E-46", " e - 46 " → "E-46". Vacío si no hay número. */
export function normalizarCamion(valor) {
  const n = valor.trim().toUpperCase().replace(/^E\s*-?\s*/, "").trim();
  return n ? `E-${n}` : "";
}

/** Número sin el prefijo, para rellenar el campo al modificar. */
export const numeroCamion = (camion) => String(camion ?? "").replace(/^E-/, "");

/** Campo de texto con el prefijo fijo "E-" delante. */
export function campoCamion(valor = "") {
  const caja = el("div", "con-prefijo");
  const input = el("input");
  input.required = true;
  input.maxLength = 15;
  input.inputMode = "numeric";
  input.placeholder = "46";
  input.value = valor;
  caja.append(el("span", "prefijo", "E-"), input);
  return { caja, input };
}

export function boton(texto, clase = "boton-chico", tipo = "button") {
  const b = el("button", clase, texto);
  b.type = tipo;
  return b;
}

/**
 * Lista de avisos con botones Modificar / Eliminar.
 * `editor(l, cerrar)` devuelve el nodo que reemplaza a la fila mientras se edita.
 */
export function listaAvisos(ul, { vacio, titulo, detalle, editor, onEliminar }) {
  let items = [];
  let editando = null;

  function render() {
    // No interrumpir una edición abierta (salvo que el aviso haya desaparecido).
    if (editando && items.some((l) => l.id === editando)) return;
    editando = null;
    ul.replaceChildren(...(items.length ? items.map(fila) : [el("li", "vacio", vacio)]));
  }

  function fila(l) {
    const li = el("li", "aviso");
    const info = el("div", "info");
    info.append(el("strong", null, titulo(l)), el("span", "detalle", detalle(l)));
    const acciones = el("div", "acciones");
    const bMod = boton("Modificar");
    const bEli = boton("Eliminar", "boton-chico peligro");
    bMod.addEventListener("click", () => {
      editando = l.id;
      li.classList.add("editando");
      li.replaceChildren(
        editor(l, () => {
          editando = null;
          render();
        })
      );
    });
    bEli.addEventListener("click", async () => {
      if (!confirm(`¿Eliminar el aviso "${titulo(l)}"?`)) return;
      bEli.disabled = true;
      try {
        await onEliminar(l);
      } catch (err) {
        console.error(err);
        alert(`No se pudo eliminar: ${err.message}`);
        bEli.disabled = false;
      }
    });
    acciones.append(bMod, bEli);
    li.append(info, acciones);
    return li;
  }

  return {
    actualizar(nuevos) {
      items = nuevos;
      render();
    },
    render,
  };
}
