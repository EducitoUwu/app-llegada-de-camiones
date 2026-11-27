# Llegada de camiones — Piloto CD Coquimbo

Página web con 3 pantallas para saber qué camiones vienen al Centro de Distribución (CD):

| Pantalla | Quién la usa | Qué hace |
|---|---|---|
| `distribucion.html` | Distribución | Ingresa N° de camión + ubicación actual → calcula hora estimada de llegada con Google Routes (o minutos a mano) |
| `cl.html` | Centro Logístico | Toca la cantidad de pallets (10, 28 u otra) → llega en 5 min fijos |
| `cd.html` | Centro de Distribución | Pantalla solo de visualización (ideal en un TV). Se actualiza sola y cada camión desaparece 10 min después de su hora estimada |

Es HTML + JavaScript puro (sin instalar nada, sin build). Los datos se comparten en tiempo real con **Firebase Firestore** (plan gratuito).

Todos los parámetros (coordenadas del CD, minutos del CL, margen para camiones, tiempo en pantalla, botones de pallets) están en **`js/config.js`**.

---

## 1. Probar localmente (modo demo)

Sin configurar nada, la app funciona en **modo demo**: los datos se guardan en el navegador y se comparten entre pestañas del mismo computador.

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000` y abrir las 3 pantallas en pestañas distintas.

> No sirve abrir el archivo con doble clic (`file://`): los módulos JS necesitan un servidor.

## 2. Configurar Firebase (para usarlo en varios equipos)

1. Entrar a <https://console.firebase.google.com> → **Agregar proyecto** (se puede desactivar Analytics).
2. **Compilación → Firestore Database → Crear base de datos** → ubicación `southamerica-east1` (São Paulo) → modo producción.
3. En la pestaña **Reglas**, pegar el contenido de [`firestore.rules`](firestore.rules) y **Publicar**.
4. **Configuración del proyecto (⚙️) → Tus apps → Web (`</>`)** → registrar la app → copiar el objeto `firebaseConfig` y pegarlo en `js/config.js` en el campo `firebase`.
5. (Recomendado) Borrado automático de registros viejos: en Google Cloud Console → **Firestore → Tiempo de actividad (TTL)** → crear política para el grupo de colecciones `llegadas`, campo `expiraEn`. Si no se hace, la app igual los oculta; solo quedan guardados.

## 3. Configurar Google Maps (cálculo de ETA)

1. En <https://console.cloud.google.com> (puede ser el mismo proyecto de Firebase) → **APIs y servicios → Biblioteca** → habilitar **Routes API**. Pide asociar una cuenta de facturación, pero hay un cupo mensual gratuito que un piloto no supera.
2. **Credenciales → Crear credenciales → Clave de API**. Luego **editarla**:
   - *Restricciones de aplicación*: **Sitios web** → agregar el dominio donde se publique (ej. `https://tuusuario.github.io/*`) y `http://localhost:8000/*`.
   - *Restricciones de API*: solo **Routes API**.
3. (Recomendado) **APIs y servicios → Routes API → Cuotas** → bajar el límite diario (ej. 300 solicitudes/día) para que nunca se cobre.
4. Pegar la clave en `js/config.js` → `googleMapsApiKey`.
5. Poner las coordenadas exactas del CD en `destino` (clic derecho sobre el CD en Google Maps → copiar coordenadas).

Si no hay clave o la ruta falla, la pantalla de Distribución pide los minutos estimados a mano.

La ubicación se puede escribir como dirección (`Ruta 5 km 470`, `Av. Balmaceda 1500, La Serena`) o pegar coordenadas (`-29.90, -71.25`).

## 4. Publicar gratis

**GitHub Pages** (lo más simple, ya está en GitHub):
repo → **Settings → Pages** → *Source*: `Deploy from a branch` → `main` / `(root)` → Save. Queda en `https://<usuario>.github.io/<repo>/`.

Alternativas igual de gratuitas: Netlify o Cloudflare Pages (arrastrar la carpeta), o `firebase deploy` con Firebase Hosting.

## Notas del piloto

- Las claves de Firebase y Google en el frontend son públicas por diseño; la seguridad está en las **reglas de Firestore** y en las **restricciones de la API key**.
- Cualquiera con el link puede ingresar datos. Para el piloto está bien; si se formaliza, agregar inicio de sesión (Firebase Auth) y coordinar con TI de CCU.
- No ingresar datos personales (nombres de choferes, RUT, clientes).
- El tiempo de Google es para auto; se le suma un 15% por ser camión (`factorCamion`).
