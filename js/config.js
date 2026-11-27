// ============================================================
//  CONFIGURACIÓN DEL PILOTO — editar solo este archivo
// ============================================================

export const CONFIG = {
  // Objeto de configuración de Firebase (Consola Firebase → Configuración del proyecto → Tus apps → Web).
  // Mientras sea null, la app funciona en MODO DEMO: los datos se guardan en este navegador
  // y solo se comparten entre pestañas del mismo computador.
  firebase: null,
  // Ejemplo:
  // firebase: {
  //   apiKey: "AIza...",
  //   authDomain: "mi-proyecto.firebaseapp.com",
  //   projectId: "mi-proyecto",
  //   appId: "1:123:web:abc",
  // },

  // API key de Google Cloud con "Routes API" habilitada. Vacío = Distribución ingresa los minutos a mano.
  googleMapsApiKey: "",

  // Ubicación del Centro de Distribución (destino de todos los camiones).
  // REEMPLAZAR por las coordenadas exactas del CD (clic derecho en Google Maps → copiar coordenadas).
  destino: {
    nombre: "Centro de Distribución Coquimbo",
    lat: -29.9533,
    lng: -71.3436,
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
