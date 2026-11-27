import { CONFIG } from "./config.js";
import { agregarLlegada } from "./store.js";
import { avisoDemo, el, hora, mensaje } from "./comun.js";

avisoDemo();

const botones = document.getElementById("botones");
const formOtro = document.getElementById("form-otro");
const inOtro = document.getElementById("otro");
const msg = document.getElementById("mensaje");
document.getElementById("minutos-cl").textContent = CONFIG.minutosCL;

async function enviar(pallets, boton) {
  const todos = document.querySelectorAll("button");
  todos.forEach((b) => (b.disabled = true));
  try {
    const eta = Date.now() + CONFIG.minutosCL * 60_000;
    await agregarLlegada({ tipo: "recepcion", pallets, eta });
    mensaje(msg, `Enviado: camión con ${pallets} pallets llega aprox. a las ${hora(eta)}.`);
  } catch (err) {
    console.error(err);
    mensaje(msg, `Error al enviar: ${err.message}`, "error");
  } finally {
    // Pequeña pausa para evitar doble clic accidental.
    setTimeout(() => todos.forEach((b) => (b.disabled = false)), 1500);
    boton?.blur();
  }
}

for (const n of CONFIG.palletsOpciones) {
  const b = el("button", "boton-grande", `${n} pallets`);
  b.type = "button";
  b.addEventListener("click", () => enviar(n, b));
  botones.append(b);
}

formOtro.addEventListener("submit", (e) => {
  e.preventDefault();
  const n = parseInt(inOtro.value, 10);
  if (!(n > 0)) return;
  enviar(n);
  formOtro.reset();
});
