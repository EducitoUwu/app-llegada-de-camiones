// Capa de datos: Firebase Firestore si está configurado, si no, modo demo con localStorage.
// Cada registro: { id, tipo: "recarga"|"recepcion", camion?, origen?, pallets?, eta (ms), expiraEn (ms) }
import { CONFIG } from "./config.js";

export const modoDemo = !CONFIG.firebase;

const FB = "https://www.gstatic.com/firebasejs/11.0.2";
let backendPromise;

function backend() {
  backendPromise ??= modoDemo ? Promise.resolve(demoBackend()) : firebaseBackend();
  return backendPromise;
}

/** Guarda una llegada. `datos.eta` en milisegundos. */
export async function agregarLlegada(datos) {
  const expiraEn = datos.eta + CONFIG.minutosGracia * 60_000;
  const b = await backend();
  await b.agregar({ ...datos, expiraEn });
}

/** Modifica campos de una llegada. Si cambia `eta`, se recalcula `expiraEn`. */
export async function actualizarLlegada(id, cambios) {
  const c = { ...cambios };
  if (c.eta != null) c.expiraEn = c.eta + CONFIG.minutosGracia * 60_000;
  const b = await backend();
  await b.actualizar(id, c);
}

export async function eliminarLlegada(id) {
  const b = await backend();
  await b.eliminar(id);
}

/** Llama a `cb(lista)` cada vez que cambian las llegadas vigentes. Devuelve función para cancelar. */
export function suscribirLlegadas(cb) {
  let cancelar = () => {};
  let cancelado = false;
  backend().then((b) => {
    if (!cancelado) cancelar = b.suscribir(cb);
  });
  return () => {
    cancelado = true;
    cancelar();
  };
}

/** Filtra las vencidas y ordena por hora estimada. */
export function vigentes(lista, ahora = Date.now()) {
  return lista.filter((l) => l.expiraEn > ahora).sort((a, b) => a.eta - b.eta);
}

// ---------------------------------------------------------------- Firebase
async function firebaseBackend() {
  const { initializeApp } = await import(`${FB}/firebase-app.js`);
  const fs = await import(`${FB}/firebase-firestore.js`);
  const db = fs.getFirestore(initializeApp(CONFIG.firebase));
  const col = fs.collection(db, "llegadas");

  return {
    async agregar(d) {
      await fs.addDoc(col, {
        ...d,
        eta: fs.Timestamp.fromMillis(d.eta),
        expiraEn: fs.Timestamp.fromMillis(d.expiraEn),
        creadoEn: fs.serverTimestamp(),
      });
    },
    async actualizar(id, c) {
      const datos = { ...c };
      if (c.eta != null) datos.eta = fs.Timestamp.fromMillis(c.eta);
      if (c.expiraEn != null) datos.expiraEn = fs.Timestamp.fromMillis(c.expiraEn);
      await fs.updateDoc(fs.doc(col, id), datos);
    },
    async eliminar(id) {
      await fs.deleteDoc(fs.doc(col, id));
    },
    suscribir(cb) {
      // Solo trae lo no vencido; los documentos viejos los borra la política TTL de Firestore.
      const q = fs.query(col, fs.where("expiraEn", ">", fs.Timestamp.now()));
      return fs.onSnapshot(
        q,
        (snap) =>
          cb(
            snap.docs.map((doc) => {
              const x = doc.data();
              return { ...x, id: doc.id, eta: x.eta.toMillis(), expiraEn: x.expiraEn.toMillis() };
            })
          ),
        (err) => console.error("Error leyendo Firestore:", err)
      );
    },
  };
}

// ---------------------------------------------------------------- Demo (localStorage)
function demoBackend() {
  const KEY = "ccu-llegadas-demo";
  const leer = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) ?? [];
    } catch {
      return [];
    }
  };
  const oyentes = new Set();

  window.addEventListener("storage", (e) => {
    if (e.key === KEY) oyentes.forEach((cb) => cb(leer()));
  });

  const guardar = (lista) => {
    localStorage.setItem(KEY, JSON.stringify(lista));
    oyentes.forEach((cb) => cb(lista));
  };

  return {
    async agregar(d) {
      guardar([...vigentes(leer()), { ...d, id: crypto.randomUUID() }]);
    },
    async actualizar(id, c) {
      guardar(leer().map((l) => (l.id === id ? { ...l, ...c } : l)));
    },
    async eliminar(id) {
      guardar(leer().filter((l) => l.id !== id));
    },
    suscribir(cb) {
      oyentes.add(cb);
      cb(leer());
      return () => oyentes.delete(cb);
    },
  };
}
