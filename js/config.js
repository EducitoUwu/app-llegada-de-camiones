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

  // API key de Google Cloud con "Routes API" habilitada. Vacío = Distribución ingresa los minutos a mano.
  googleMapsApiKey: "",

  // Ubicación del Centro de Distribución (destino de todos los camiones).
  // REEMPLAZAR por las coordenadas exactas del CD (clic derecho en Google Maps → copiar coordenadas).
  destino: {
    nombre: "Centro de Distribución Coquimbo",
    lat: -29.9716787,
    lng: -71.26806,
  },

  // Texto que se agrega a las direcciones para que Google no las confunda con otras ciudades.
  sufijoDireccion: ", Región de Coquimbo, Chile",

  // Minutos fijos desde el Centro Logístico (CL) al CD.
  minutosCL: 5,

  // Google calcula tiempos de auto; un camión es más lento. 1.15 = +15%.
  factorCamion: 1.15,

  // Minutos que un camión sigue en pantalla después de su hora estimada (luego desaparece solo).
  minutosGracia: 10,

  // Botones rápidos de pallets en la pantalla del CL.
  palletsOpciones: [10, 28],
};
