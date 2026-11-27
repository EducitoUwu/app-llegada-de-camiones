import { CONFIG } from "./config.js";
import { actualizarLlegada, agregarLlegada, eliminarLlegada, suscribirLlegadas, vigentes } from "./store.js";
import { avisoDemo, boton, el, faltan, hora, listaAvisos, mensaje } from "./comun.js";

avisoDemo();

const botones = document.getElementById("botones");
const msg = document.getElementById("mensaje");
const lista = document.getElementById("lista");
document.getElementById("minutos-cl").textContent = CONFIG.minutosCL;

async function enviar(pallets, b) {
  const todos = botones.querySelectorAll("button");
  todos.forEach((x) => (x.disabled = true));
  try {
    const eta = Date.now() + CONFIG.minutosCL * 60_000;
    await agregarLlegada({ tipo: "recepcion", pallets, eta });
    mensaje(msg, `Enviado: camión con ${pallets} pallets llega aprox. a las ${hora(eta)}.`);
  } catch (err) {
    console.error(err);
    mensaje(msg, `Error al enviar: ${err.message}`, "error");
  } finally {
    // Pequeña pausa para evitar doble toque accidental.
    setTimeout(() => todos.forEach((x) => (x.disabled = false)), 1500);
    b.blur();
  }
}

for (const n of CONFIG.palletsOpciones) {
  const b = boton(`${n} pallets`, "boton-grande");
  b.addEventListener("click", () => enviar(n, b));
  botones.append(b);
}

// ============================================================ Avisos enviados (modificar / eliminar)
/** Al modificar, se elige la nueva cantidad de pallets. */
function editorRecepcion(l, cerrar) {
  const caja = el("div", "editor");
  caja.append(el("span", "detalle", `Cambiar cantidad (actual: ${l.pallets} pallets):`));
  const acciones = el("div", "acciones");
  for (const n of CONFIG.palletsOpciones) {
    const b = boton(`${n} pallets`, n === l.pallets ? "boton-chico primario" : "boton-chico");
    b.addEventListener("click", async () => {
      if (n === l.pallets) return cerrar();
      b.disabled = true;
      try {
        await actualizarLlegada(l.id, { pallets: n });
        mensaje(msg, `Aviso modificado a ${n} pallets.`);
        cerrar();
      } catch (err) {
        console.error(err);
        alert(`No se pudo modificar: ${err.message}`);
        b.disabled = false;
      }
    });
    acciones.append(b);
  }
  const bCancelar = boton("Cancelar");
  bCancelar.addEventListener("click", cerrar);
  acciones.append(bCancelar);
  caja.append(acciones);
  return caja;
}

const avisos = listaAvisos(lista, {
  vacio: "Ningún aviso enviado todavía.",
  titulo: (l) => `${l.pallets} pallets`,
  detalle: (l) => `Enviado ${hora(l.eta - CONFIG.minutosCL * 60_000)} · llega ${hora(l.eta)} (${faltan(l.eta)})`,
  editor: editorRecepcion,
  onEliminar: async (l) => {
    await eliminarLlegada(l.id);
    mensaje(msg, `Aviso de ${l.pallets} pallets eliminado.`);
  },
});

let datos = [];
const render = () => avisos.actualizar(vigentes(datos).filter((l) => l.tipo === "recepcion"));
suscribirLlegadas((d) => {
  datos = d;
  render();
});
setInterval(render, 30_000);
