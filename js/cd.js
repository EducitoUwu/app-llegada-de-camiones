import { suscribirLlegadas, vigentes } from "./store.js";
import { avisoDemo, el, faltan, hora } from "./comun.js";

avisoDemo();

const colRecarga = document.getElementById("recarga");
const colRecepcion = document.getElementById("recepcion");
const cntRecarga = document.getElementById("cnt-recarga");
const cntRecepcion = document.getElementById("cnt-recepcion");
const reloj = document.getElementById("reloj");

let datos = [];

function estado(eta, ahora) {
  const min = (eta - ahora) / 60_000;
  if (min <= 0) return "llegando";
  if (min <= 10) return "pronto";
  return "lejos";
}

function tarjeta(l, ahora) {
  const t = el("article", `tarjeta ${estado(l.eta, ahora)}`);
  const izq = el("div");
  if (l.tipo === "recarga") {
    izq.append(el("div", "titulo", l.camion), el("div", "detalle", l.origen));
  } else {
    izq.append(el("div", "titulo", `${l.pallets} pallets`), el("div", "detalle", "Desde Centro Logístico"));
  }
  const der = el("div", "tiempo");
  der.append(el("div", "faltan", faltan(l.eta, ahora)), el("div", "detalle", hora(l.eta)));
  t.append(izq, der);
  return t;
}

function render() {
  const ahora = Date.now();
  reloj.textContent = new Date(ahora).toLocaleTimeString("es-CL");
  const v = vigentes(datos, ahora);
  const rec = v.filter((l) => l.tipo === "recarga");
  const rcp = v.filter((l) => l.tipo === "recepcion");

  colRecarga.replaceChildren(...(rec.length ? rec.map((l) => tarjeta(l, ahora)) : [el("p", "vacio", "Sin camiones en camino")]));
  colRecepcion.replaceChildren(...(rcp.length ? rcp.map((l) => tarjeta(l, ahora)) : [el("p", "vacio", "Sin camiones en camino")]));

  cntRecarga.textContent = rec.length;
  const pallets = rcp.reduce((s, l) => s + (l.pallets || 0), 0);
  cntRecepcion.textContent = rcp.length ? `${rcp.length} · ${pallets} pallets` : "0";
}

suscribirLlegadas((d) => {
  datos = d;
  render();
});
setInterval(render, 1000);
