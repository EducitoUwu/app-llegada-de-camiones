// ============================================================
//  CONFIGURACIÓN DEL PILOTO — editar solo este archivo
// ============================================================

export const CONFIG = {
  // Objeto de configuración de Firebase (Consola Firebase → Configuración del proyecto → Tus apps → Web).
  // Mientras sea null, la app funciona en MODO DEMO: los datos se guardan en este navegador
  // y solo se comparten entre pestañas del mismo computador.
  firebase: {
    apiKey: "AIzaSyAW46gSNOel1uRfETNaHPfsiMKsUz89f9A",
    authDomain: "llegada-camiones-ccu.firebaseapp.com",
    projectId: "llegada-camiones-ccu",
    storageBucket: "llegada-camiones-ccu.firebasestorage.app",
    messagingSenderId: "848430653278",
    appId: "1:848430653278:web:eaef259e19b115d6a3b9cf",
  },

  // Cálculo de ETA. Se usa la primera clave que esté puesta (OpenRouteService primero).
  // Si ninguna está puesta, Distribución ingresa los minutos a mano.
  //  - OpenRouteService: gratis, sin tarjeta, perfil camión. https://openrouteservice.org/dev/#/signup
  //  - Google Routes API: con tráfico real, requiere facturación en Google Cloud.
  orsApiKey: "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFjYmMxZjM2OGUzMDQ5Y2ZiMjNlNjdjNTM1ZTVjM2ZjIiwiaCI6Im11cm11cjY0In0=",
  googleMapsApiKey: "",

  // Ubicación del Centro de Distribución (destino de todos los camiones).
  // REEMPLAZAR por las coordenadas exactas del CD (clic derecho en Google Maps → copiar coordenadas).
  destino: {
    nombre: "Centro de Distribución Coquimbo",
    lat: -29.9716787,
    lng: -71.26806,
  },

  // Texto que se agrega a las direcciones para que no se confundan con otras ciudades.
  sufijoDireccion: ", Región de Coquimbo, Chile",

  // Minutos fijos desde el Centro Logístico (CL) al CD.
  minutosCL: 5,

  // Ajuste al tiempo calculado. 1.15 = +15%.
  // Google calcula con tiempos de auto (por eso +15%); OpenRouteService ya usa velocidades de camión
  // pero sin tráfico. Ajustar según lo que se observe en el piloto.
  factorCamion: { ors: 1.1, google: 1.15 },

  // Minutos que un camión sigue en pantalla después de su hora estimada (luego desaparece solo).
  minutosGracia: 10,

  // Botones rápidos de pallets en la pantalla del CL.
  palletsOpciones: [10, 28],
};
