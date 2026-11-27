import { CONFIG } from "./config.js";
import { agregarLlegada, suscribirLlegadas, vigentes } from "./store.js";
import { avisoDemo, el, faltan, hora, mensaje } from "./comun.js";

avisoDemo();

const form = document.getElementById("form");
const inCamion = document.getElementById("camion");
const inUbicacion = document.getElementById("ubicacion");
const btnBuscar = document.getElementById("buscar");
const inMinutos = document.getElementById("minutos");
const bloqueManual = document.getElementById("bloque-manual");
const btn = document.getElementById("enviar");
const msg = document.getElementById("mensaje");
const lista = document.getElementById("lista");

const proveedor = CONFIG.orsApiKey ? "ors" : CONFIG.googleMapsApiKey ? "google" : null;
const hayApi = Boolean(proveedor);
if (!hayApi) {
  bloqueManual.hidden = false;
  inMinutos.required = true;
  document.getElementById("nota-manual").textContent =
    "Sin API de rutas configurada: ingresa los minutos estimados a mano.";
}

// ============================================================ Mapa (Leaflet + OpenStreetMap)
// Punto de origen elegido: { lat, lng, etiqueta } o null.
let punto = null;
const CD = [CONFIG.destino.lat, CONFIG.destino.lng];
const mapa = L.map("mapa").setView(CD, 11);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(mapa);
L.circleMarker(CD, { radius: 9, color: "#1d7a46", fillColor: "#2e9d5b", fillOpacity: 1 })
  .addTo(mapa)
  .bindTooltip(CONFIG.destino.nombre, { permanent: false });

const marcador = L.marker(CD, { draggable: true });
marcador.on("dragend", () => {
  const { lat, lng } = marcador.getLatLng();
  fijarPunto(lat, lng, null, { centrar: false });
});
mapa.on("click", (e) => fijarPunto(e.latlng.lat, e.latlng.lng, null, { centrar: false }));

/** Pone el marcador del camión. Sin etiqueta, intenta ponerle un nombre con geocodificación inversa. */
async function fijarPunto(lat, lng, etiqueta, { centrar = true } = {}) {
  punto = { lat, lng, etiqueta: etiqueta ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
  marcador.setLatLng([lat, lng]).addTo(mapa);
  if (centrar) mapa.setView([lat, lng], 14);
  if (etiqueta) {
    inUbicacion.value = etiqueta;
    return;
  }
  inUbicacion.value = punto.etiqueta;
  if (proveedor !== "ors") return;
  const actual = punto;
  try {
    const nombre = await orsReverso(lat, lng);
    if (nombre && punto === actual) {
      punto.etiqueta = nombre;
      inUbicacion.value = nombre;
    }
  } catch (err) {
    console.warn("Geocodificación inversa falló:", err);
  }
}

function limpiarPunto() {
  punto = null;
  marcador.remove();
  mapa.setView(CD, 11);
}

// Si se edita el texto a mano, el punto anterior deja de valer.
inUbicacion.addEventListener("input", () => {
  if (punto) {
    punto = null;
    marcador.remove();
  }
});
// Enter en el campo de ubicación busca, no envía.
inUbicacion.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    buscar();
  }
});
btnBuscar.addEventListener("click", buscar);

async function buscar() {
  const texto = inUbicacion.value.trim();
  if (!texto) return;
  const c = parseCoords(texto);
  if (c) return fijarPunto(c.lat, c.lng, null);
  if (proveedor !== "ors") {
    mensaje(msg, "Toca el mapa para marcar dónde está el camión.", "info");
    return;
  }
  btnBuscar.disabled = true;
  mensaje(msg, "Buscando…", "info");
  try {
    const r = await orsGeocodificar(texto);
    await fijarPunto(r.lat, r.lng, r.etiqueta);
    mensaje(msg, "Revisa en el mapa que el punto sea correcto. Si no, toca el lugar exacto.", "info");
  } catch (err) {
    mensaje(msg, err.message, "error");
  } finally {
    btnBuscar.disabled = false;
  }
}

// ============================================================ Cálculo de ruta
/** Si el texto son coordenadas "-29.95, -71.34" (copiadas de Google Maps) devuelve {lat, lng}. */
function parseCoords(texto) {
  const m = texto.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  return m ? { lat: +m[1], lng: +m[2] } : null;
}

const conRegion = (texto) =>
  /chile|coquimbo|serena/i.test(texto) ? texto : texto + CONFIG.sufijoDireccion;

const resultado = (segundos, metros) => ({
  minutos: Math.max(1, Math.round((segundos / 60) * (CONFIG.factorCamion[proveedor] ?? 1))),
  km: (metros ?? 0) / 1000,
});

// ---------- OpenRouteService / HeiGIT (perfil camión, sin tráfico) ----------
const HEIGIT = "https://api.heigit.org";

async function orsJson(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message ?? data.error ?? `HTTP ${res.status}`);
  return data;
}

async function orsGeocodificar(texto) {
  const p = new URLSearchParams({
    api_key: CONFIG.orsApiKey,
    text: conRegion(texto),
    "boundary.country": "CL",
    "focus.point.lat": CONFIG.destino.lat,
    "focus.point.lon": CONFIG.destino.lng,
    size: "1",
  });
  const data = await orsJson(`${HEIGIT}/pelias/v1/search?${p}`);
  const f = data.features?.[0];
  if (!f) throw new Error("No se encontró esa dirección. Toca el mapa donde está el camión.");
  const [lng, lat] = f.geometry.coordinates;
  return { lat, lng, etiqueta: f.properties?.label ?? texto };
}

async function orsReverso(lat, lng) {
  const p = new URLSearchParams({
    api_key: CONFIG.orsApiKey,
    "point.lat": lat,
    "point.lon": lng,
    size: "1",
  });
  const data = await orsJson(`${HEIGIT}/pelias/v1/reverse?${p}`);
  return data.features?.[0]?.properties?.label ?? null;
}

async function rutaORS(o) {
  const p = new URLSearchParams({
    api_key: CONFIG.orsApiKey,
    start: `${o.lng},${o.lat}`,
    end: `${CONFIG.destino.lng},${CONFIG.destino.lat}`,
  });
  const data = await orsJson(`${HEIGIT}/openrouteservice/v2/directions/driving-hgv?${p}`);
  const s = data.features?.[0]?.properties?.summary;
  if (!s) throw new Error("No se encontró una ruta para esa ubicación.");
  return resultado(s.duration, s.distance);
}

// ---------- Google Routes API (con tráfico) ----------
async function rutaGoogle(o, textoLibre) {
  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": CONFIG.googleMapsApiKey,
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
    },
    body: JSON.stringify({
      origin: o
        ? { location: { latLng: { latitude: o.lat, longitude: o.lng } } }
        : { address: conRegion(textoLibre) },
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
  return resultado(parseInt(ruta.duration, 10), ruta.distanceMeters);
}

// ============================================================ Envío
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const camion = inCamion.value.trim();
  const texto = inUbicacion.value.trim();
  const manual = parseInt(inMinutos.value, 10);
  if (!camion || !texto) return;

  // Coordenadas pegadas en el campo cuentan como punto.
  if (!punto && parseCoords(texto)) {
    const c = parseCoords(texto);
    await fijarPunto(c.lat, c.lng, null);
  }

  // Con OpenRouteService hace falta un punto confirmado en el mapa (su búsqueda de calles es imprecisa).
  if (!(manual > 0) && proveedor === "ors" && !punto) {
    await buscar();
    if (punto) mensaje(msg, "Revisa el punto en el mapa y presiona «Calcular y enviar» de nuevo.", "info");
    return;
  }

  btn.disabled = true;
  mensaje(msg, "Calculando hora de llegada…", "info");
  try {
    let minutos, km;
    if (manual > 0) {
      minutos = manual;
    } else {
      try {
        ({ minutos, km } =
          proveedor === "ors" ? await rutaORS(punto) : await rutaGoogle(punto, texto));
      } catch (err) {
        console.error(err);
        bloqueManual.hidden = false;
        inMinutos.focus();
        mensaje(msg, `No se pudo calcular la ruta (${err.message}). Ingresa los minutos a mano y vuelve a enviar.`, "error");
        return;
      }
    }
    const origen = punto?.etiqueta ?? texto;
    const eta = Date.now() + minutos * 60_000;
    await agregarLlegada({ tipo: "recarga", camion, origen, eta, minutos, km: km ?? null });
    mensaje(
      msg,
      `Camión ${camion} enviado: llega aprox. a las ${hora(eta)} (${minutos} min${km ? `, ${km.toFixed(1)} km` : ""}).`
    );
    form.reset();
    limpiarPunto();
    if (hayApi) {
      bloqueManual.hidden = true;
      inMinutos.required = false;
    }
    inCamion.focus();
  } catch (err) {
    console.error(err);
    mensaje(msg, `Error al guardar: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
  }
});

// ============================================================ Lista de camiones ya informados
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
