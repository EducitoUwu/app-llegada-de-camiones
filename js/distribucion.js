import { CONFIG } from "./config.js";
import { agregarLlegada, suscribirLlegadas, vigentes } from "./store.js";
import { avisoDemo, el, faltan, hora, mensaje } from "./comun.js";

avisoDemo();

const form = document.getElementById("form");
const inCamion = document.getElementById("camion");
const inUbicacion = document.getElementById("ubicacion");
const inMinutos = document.getElementById("minutos");
const bloqueManual = document.getElementById("bloque-manual");
const btn = document.getElementById("enviar");
const msg = document.getElementById("mensaje");
const lista = document.getElementById("lista");

const hayGoogle = Boolean(CONFIG.googleMapsApiKey);
if (!hayGoogle) {
  bloqueManual.hidden = false;
  inMinutos.required = true;
  document.getElementById("nota-manual").textContent =
    "Sin API de Google configurada: ingresa los minutos estimados a mano.";
}

/** Acepta "-29.95, -71.34" (copiado de Google Maps) o una dirección en texto. */
function waypoint(texto) {
  const m = texto.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (m) return { location: { latLng: { latitude: +m[1], longitude: +m[2] } } };
  const tieneRegion = /chile|coquimbo|serena/i.test(texto);
  return { address: tieneRegion ? texto : texto + CONFIG.sufijoDireccion };
}

/** Devuelve { minutos, km } usando Google Routes API (con tráfico). */
async function calcularRuta(origenTexto) {
  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": CONFIG.googleMapsApiKey,
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
    },
    body: JSON.stringify({
      origin: waypoint(origenTexto),
      destination: {
        location: { latLng: { latitude: CONFIG.destino.lat, longitude: CONFIG.destino.lng } },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      regionCode: "CL",
      languageCode: "es-419",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  const ruta = data.routes?.[0];
  if (!ruta) throw new Error("No se encontró una ruta para esa ubicación.");
  const segundos = parseInt(ruta.duration, 10);
  return {
    minutos: Math.max(1, Math.round((segundos / 60) * CONFIG.factorCamion)),
    km: (ruta.distanceMeters ?? 0) / 1000,
  };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const camion = inCamion.value.trim();
  const origen = inUbicacion.value.trim();
  const manual = parseInt(inMinutos.value, 10);
  if (!camion || !origen) return;

  btn.disabled = true;
  mensaje(msg, "Calculando hora de llegada…", "info");
  try {
    let minutos, km;
    if (manual > 0) {
      minutos = manual;
    } else {
      try {
        ({ minutos, km } = await calcularRuta(origen));
      } catch (err) {
        console.error(err);
        bloqueManual.hidden = false;
        inMinutos.focus();
        mensaje(msg, `No se pudo calcular la ruta (${err.message}). Ingresa los minutos a mano y vuelve a enviar.`, "error");
        return;
      }
    }
    const eta = Date.now() + minutos * 60_000;
    await agregarLlegada({ tipo: "recarga", camion, origen, eta, minutos, km: km ?? null });
    mensaje(
      msg,
      `Camión ${camion} enviado: llega aprox. a las ${hora(eta)} (${minutos} min${km ? `, ${km.toFixed(1)} km` : ""}).`
    );
    form.reset();
    if (hayGoogle) bloqueManual.hidden = true;
    inCamion.focus();
  } catch (err) {
    console.error(err);
    mensaje(msg, `Error al guardar: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
  }
});

// Lista de camiones de recarga ya informados (para no duplicar).
let datos = [];
function render() {
  const items = vigentes(datos).filter((l) => l.tipo === "recarga");
  lista.replaceChildren(
    ...(items.length
      ? items.map((l) => {
          const li = el("li");
          li.append(el("strong", null, `Camión ${l.camion}`), el("span", null, ` — ${l.origen}`), el("span", "derecha", `${hora(l.eta)} · ${faltan(l.eta)}`));
          return li;
        })
      : [el("li", "vacio", "Ningún camión informado todavía.")])
  );
}
suscribirLlegadas((d) => {
  datos = d;
  render();
});
setInterval(render, 30_000);
