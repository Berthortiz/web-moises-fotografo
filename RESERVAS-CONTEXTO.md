# Contexto: Formulario de reservas — Moisés Magariño

**Estado:** implementado y compilando (`npm run build` ✅).  
**Fecha:** 24 nov 2026.  
**Objetivo:** formulario de reservas de fotografía con validación Zod, animaciones GSAP, prefill del servicio desde cada página de galería y envío por WhatsApp (con opción de backend).

---

## 1. Decisión de arquitectura

Se eligió una **página dedicada** en lugar de un modal:

- Ruta: `/reservas/`.
- Motivo: el formulario es multi-paso, usa teclado global (`Enter` / `↑`), calendario, grid de 24 horas y animaciones GSAP. Un modal añadiría focus trap, scroll lock, cierre por `Esc`, altura móvil y conflictos de teclado.
- El componente React puede reutilizarse dentro de un modal más adelante si hace falta.

El formulario es una **isla React** (`client:load`) dentro de Astro, con el patrón de `forms-dynamic`:

- Config declarativa de pasos.
- Orquestador que maneja estado, navegación, validación y submit.
- Validación Zod por paso + revalidación total al confirmar.
- Transiciones GSAP entre pasos.
- Primitivas UI internas (`Button`, `Input`, `Textarea`, `RadioGroup`, `Calendar`, `Progress`).

---

## 2. Stack y dependencias añadidas

Se añadió integración React y dependencias del formulario:

```bash
npm install @astrojs/react@^7.1.9 react@^19 react-dom@^19 zod@^4.6.7 clsx@^2.1.1 tailwind-merge@^3.7.1 oxc-transform-react@0.156.0
npm install -D @types/react@^19 @types/react-dom@^19
```

- `@astrojs/react` se registró en `astro.config.mjs`.
- `oxc-transform-react` quedó fijado a `0.156.0` por el peer dependency de `@astrojs/react@7`.
- Ya existían: `astro`, `tailwindcss` (v4 por Vite), `gsap`.
- No se usó `@gsap/react`; las animaciones se hacen con `gsap` + `useEffect`.

> Nota: el proyecto es Astro estático (sin adapter SSR). Por eso el prefill del servicio se lee **en cliente** desde `window.location.search`.

### Paso crítico: `vite.optimizeDeps.include` para hidratar React en `astro dev`

> **CRÍTICO (no eliminar de `astro.config.mjs`):** sin esta configuración, el formulario se renderiza en HTML pero **no hidrata en desarrollo** (`astro dev`). Los botones aparecen como HTML estático sin eventos de React (al pulsar cualquier servicio no se selecciona ni se habilita “Siguiente →” y `<astro-island>` conserva el atributo `ssr`).

**Causa:** en Astro 7 + `@astrojs/react@7` + React 19, `@astrojs/react-renderer/dist/client.js` importa `createRoot` y `hydrateRoot` desde `react-dom/client`. En `astro dev`, Vite sirve `/node_modules/react-dom/client.js` como CommonJS crudo sin pre-empaquetarlo en `.vite/deps/`, provocando el error:

```text
[astro-island] Error hydrating /src/components/BookingForm/BookingForm.jsx
SyntaxError: The requested module '/node_modules/react-dom/client.js' does not provide an export named 'createRoot'
```

*(En `npm run build` no aparecía porque el bundler de producción convierte CJS a ESM automáticamente.)*

**Solución aplicada en `astro.config.mjs`:**

```js
vite: {
  plugins: [tailwindcss()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ],
  },
}
```

Con esto Vite pre-optimiza el runtime de React y `react-dom/client` a ESM, `<astro-island>` hidrata sin errores y la interacción + prefill funcionan correctamente en desarrollo.

---

## 3. Flujo y campos del formulario

Orden de pasos en `src/components/BookingForm/schema/bookingFormConfig.ts`:

| # | id | Tipo | Requerido | Notas |
|---|---|---|---:|---|
| 1 | `service` | `select_single` | Sí | Bodas, Real Estate, Eventos y Conciertos, Photoshoot. Va primero. |
| 2 | `name` | `text_input` | Sí | Regla Zod `name`. |
| 3 | `email` | `text_input` | Sí | `inputType="email"`, regla `email`. |
| 4 | `phone` | `text_input` | Sí | `inputType="tel"`, regla `phone`. |
| 5 | `datetime` | `date_picker` | Sí | Fecha + hora. Horas de `00:00` a `23:00` (24 franjas). |
| 6 | `city` | `text_input` | Sí | “Ciudad / lugar del evento”. |
| 7 | `message` | `textarea_input` | No | Máx. 500 caracteres, indicaciones especiales. |
| 8 | `summary` | `summary_step` | — | Revisión, edición y confirmación. |

### Comportamiento

- Una pregunta a la vez.
- `Enter` avanza; `↑` retrocede (con guardas para inputs, textareas, botones, enlaces y calendario).
- Al seleccionar un servicio, auto-avance a los 250 ms.
- El resumen permite editar cada respuesta y revalida todo antes de confirmar.
- El progreso muestra “Paso X de Y”.

### Fechas

- Por defecto se **deshabilitan fechas pasadas**.
- Si se quisiera permitir literalmente cualquier fecha:
  - poner `minDate: null` en el paso `datetime` de `bookingFormConfig.ts`;
  - quitar la validación `value >= todayISO()` en `validation/buildStepSchema.js`.
- Las horas se generan así:

```ts
const HOURS_24 = Array.from(
  { length: 24 },
  (_, hour) => `${String(hour).padStart(2, "0")}:00`,
);
```

---

## 4. Prefill del servicio desde la página de servicio

### Fuente única

`src/data/services.ts`:

```ts
export const BOOKING_SERVICES = [
  { id: "bodas", label: "Bodas", gallerySlug: "bodas" },
  { id: "real-estate", label: "Real Estate", gallerySlug: "real-estate" },
  { id: "eventos-conciertos", label: "Eventos y Conciertos", gallerySlug: "eventos" },
  { id: "photoshoot", label: "Photoshoot", gallerySlug: "photoshoot" },
] as const;
```

- `id` es el valor canónico de la URL y del formulario.
- `gallerySlug` conecta con las páginas generadas en `src/pages/galeria/[category].astro`.
- Ojo con el mapeo: la galería usa `eventos`, el formulario usa `eventos-conciertos`.

### Botón en cada página de servicio

En `src/pages/galeria/[category].astro`:

- Se busca el servicio reservable por `category.slug`.
- Si existe, se muestra un `ButtonShine` con:
  - `href="/reservas/?service=<id>"`
  - texto `Reservar <label>`.

Solo aparece en categorías reservables: `bodas`, `real-estate`, `eventos`, `photoshoot`.

### Lectura del parámetro

- En `reservas.astro` se intenta leer `Astro.url.searchParams.get("service")` (útil en dev/SSR).
- Como el sitio es estático, el valor real se lee en cliente:

```js
useEffect(() => {
  if (typeof window === "undefined") return;
  const fromUrl = new URLSearchParams(window.location.search).get("service");
  // valida contra las opciones del paso `service`
  // setea answers.service y prefilledService
}, [steps]);
```

- Si el servicio es válido, queda preseleccionado y se muestra:
  “Servicio preseleccionado desde la galería: … Puedes cambiarlo si lo deseas.”
- Si el usuario cambia el servicio, la nota desaparece.
- No se auto-avanza al cargar con prefill.

---

## 5. Validación con Zod

Archivos:

- `src/components/BookingForm/validation/validators.js`
  - Reglas `name`, `phone`, `email`, `text`, `free`.
  - Mensajes en español.
- `src/components/BookingForm/validation/buildStepSchema.js`
  - Convierte un paso de config en schema Zod.
  - `text_input` y `textarea_input`: regla nombrada + `min`/`max` + opcional.
  - `select_single`: valor dentro de opciones.
  - `date_picker`: fecha parseable, no pasada, hora requerida.
  - `summary_step`: siempre válido.
- `src/components/BookingForm/validation/configSchema.js`
  - Guardia de estructura de la config.
  - Valida tipos de paso, IDs únicos, un solo `summary_step` al final, opciones mínimas y `times` no vacíos.
  - `assertConfig(config)` se ejecuta en dev desde `BookingForm`.

Campos extra soportados por la config: `label`, `autoComplete`, `inputType`, `placeholder`, `submitLabel`, `submitNote`, `minDate`.

---

## 6. Animaciones GSAP

`src/components/BookingForm/hooks/useStepTransition.js`:

- Mantiene dos slots durante la transición:
  - `[data-slot="prev"]` → paso saliente.
  - `[data-slot="curr"]` → paso entrante.
- Timeline de 0.35 s, `power2.out`.
- Sale/entra según `direction` (`+1` avance, `-1` retroceso).
- Stagger de elementos `[data-stagger]` del paso entrante.
- Cleanup con `tl.revert()`.
- Soporta `prefers-reduced-motion`: desactiva la animación.
- El slot saliente lleva `inert`, `aria-hidden` y `pointer-events-none` para no robar foco.

`SuccessScreen.jsx`:

- Dibuja el check SVG con `strokeDasharray` / `strokeDashoffset`.
- Anima textos `[data-success-text]` en stagger.
- Usa `gsap.context` con cleanup.

---

## 7. Envío

### Por defecto: WhatsApp

En `bookingFormConfig.ts`:

```ts
submitMode: "whatsapp",
whatsappNumber: WHATSAPP_NUMBER,
```

- `WHATSAPP_NUMBER` se exportó desde `src/utils/whatsapp.ts` (`14075906377`).
- Al confirmar:
  1. revalida todo con Zod;
  2. construye un mensaje con `buildWhatsAppMessage(steps, answers)`;
  3. abre `https://wa.me/<número>?text=...`;
  4. muestra `SuccessScreen` con botón “Reabrir WhatsApp”.

Mensaje generado (ejemplo):

```text
*Nueva solicitud de sesión*

Servicio: Bodas
Nombre: ...
Correo: ...
Teléfono: ...
Fecha y hora: viernes, 1 de enero de 2027 · 15:00
Ciudad / lugar: ...
Indicaciones especiales: ...
```

### Alternativa: endpoint

Cambiar en `bookingFormConfig.ts`:

```ts
submitMode: "endpoint",
endpoint: "/api/reservas",
```

- Hace `POST` con:

```json
{ "answers": { "...": "..." } }
```

- Espera respuesta JSON; si `!response.ok`, muestra error.
- El endpoint debe revalidar con Zod en servidor. Actualmente **no existe** endpoint porque el proyecto es estático.

### Alternativa: React

El componente acepta `onSubmit(answers)`. Si se pasa, tiene prioridad y puede integrarse con un backend o Supabase.

---

## 8. Archivos creados

```text
src/components/BookingForm/
  BookingForm.jsx
  ProgressBar.jsx
  StepRenderer.jsx
  SuccessScreen.jsx
  formatAnswers.js
  hooks/useStepTransition.js
  schema/bookingFormConfig.ts
  steps/DatePickerStep.jsx
  steps/SelectSingleStep.jsx
  steps/SummaryStep.jsx
  steps/TextareaStep.jsx
  steps/TextInputStep.jsx
  validation/buildStepSchema.js
  validation/configSchema.js
  validation/validators.js

src/components/nexui/
  Button.jsx
  Calendar.jsx
  Input.jsx
  Progress.jsx
  Radio.jsx
  Textarea.jsx

src/data/services.ts
src/lib/cn.ts
src/pages/reservas.astro
```

## 9. Archivos modificados

```text
astro.config.mjs                     → integración react() + vite.optimizeDeps.include (crítico para hidratar en dev)
package.json / package-lock.json     → dependencias nuevas
src/css/style.css                    → tokens @theme del formulario
src/pages/galeria/[category].astro   → CTA “Reservar …” con ?service=
src/utils/whatsapp.ts                → export de WHATSAPP_NUMBER
```

> Archivos que ya estaban modificados por el usuario y **no forman parte de esta implementación**: `src/components/Hero.astro`, `src/pages/index.astro`, `src/sections/ServicesSticky.astro`, `src/pages/servicios.astro`.

---

## 10. Estilos

Se añadieron tokens en `src/css/style.css` para que funcionen las utilidades Tailwind del formulario:

```css
@theme {
  --color-card: #12151a;
  --color-card-foreground: #f3f4f6;
  --color-foreground: #e5e7e9;
  --color-primary: #f3f4f6;
  --color-primary-foreground: #0d0f13;
  --color-secondary: #1a1e24;
  --color-muted-foreground: #9aa1a8;
  --color-border: #2a2f36;
  --color-input: #2a2f36;
  --color-ring: #c3c7ca;
  --color-destructive: #dc2626;
  --color-success: #16a34a;
  --radius: 0.75rem;
}
```

El formulario usa `bg-card`, `border-border`, `text-muted-foreground`, `ring-ring`, etc. Mantiene el tema oscuro del sitio.

---

## 11. Cómo probar

```bash
npm run dev
```

- Formulario vacío: `http://localhost:4321/reservas/`
- Servicio prellenado: `http://localhost:4321/reservas/?service=bodas`
- Con evento: `http://localhost:4321/reservas/?service=eventos-conciertos`
- Desde galería: entrar a `/galeria/bodas/`, `/galeria/real-estate/`, `/galeria/eventos/` o `/galeria/photoshoot/` y pulsar el botón de reserva.

Build:

```bash
npm run build
```

Verificado: 17 páginas generadas correctamente. Los avisos de `lightningcss` (`befor`) y `sitemap` (falta `site`) son preexistentes y ajenos a este formulario.

---

## 12. Pendientes / siguientes pasos posibles

- **Backend real**: crear endpoint (Node/Vercel/Netlify adapter, Supabase, Resend, etc.) y revalidar con el mismo Zod.
- **Email**: enviar copia al fotógrafo y confirmación al cliente.
- **Antispam**: honeypot + rate limit.
- **Persistencia**: guardar solicitudes en base de datos y panel de administración.
- **Modal opcional**: reutilizar `BookingForm` dentro de un modal si se necesita.
- **Más servicios**: agregar IDs en `src/data/services.ts` y enlazarlos con sus slugs de galería.
- **Permitir fechas pasadas**: `minDate: null` + quitar refine en `buildStepSchema.js`.
- **Analítica**: evento al abrir el formulario, avanzar paso y confirmar.
- **Tests**: unitarios para `buildStepSchema` y de flujo para el formulario.

---

## 13. Resumen para el siguiente agente

El formulario ya está implementado y funcionando como isla React en `/reservas/`. **Importante:** mantener `vite.optimizeDeps.include` con `react-dom/client` y los runtimes de React en `astro.config.mjs`; es un paso crítico para que la isla hidrate en `astro dev` (sin ello falla con `SyntaxError` al importar `createRoot`). La configuración vive en `src/components/BookingForm/schema/bookingFormConfig.ts`; la validación en `validation/`; las animaciones en `hooks/useStepTransition.js`; las primitivas visuales en `src/components/nexui/`. El prefill del servicio se pasa por query param (`?service=<id>`) desde los CTAs de `src/pages/galeria/[category].astro` y se resuelve en cliente por ser Astro estático. El envío por defecto abre WhatsApp con el resumen; para cambiarlo a backend, usar `submitMode: "endpoint"` o el prop `onSubmit`. Cualquier cambio de campos debe hacerse en la config y, si es un tipo nuevo, en `StepRenderer`, `buildStepSchema` y `configSchema`.
