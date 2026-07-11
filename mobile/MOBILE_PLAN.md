# Plan de Implementación — App Móvil

Plan para construir la app móvil desde cero consumiendo el REST API documentado en [API.md](API.md).

---

## 1. Stack

| Capa | Elección | Por qué |
|---|---|---|
| Runtime | **React Native + Expo (SDK 54+)** | Mismo React que el web, hot reload, build sin Xcode/Android Studio. |
| Lenguaje | TypeScript | Reutilizamos tipos del backend. |
| Navegación | **Expo Router** (file-based) | Igual mental model que Next App Router. |
| HTTP + cache | **TanStack Query v5** | Caching, revalidación, mutations con optimistic updates gratis. |
| Storage seguro | `expo-secure-store` | Guarda el JWT. |
| Storage local | `@react-native-async-storage/async-storage` | Cache de `/api/data` offline. |
| Cola offline | **MMKV** o AsyncStorage + lib mini propia (misma idea que `lib/offlineQueue.ts` del web). |
| UI base | **NativeWind** (Tailwind para RN) | Reusamos la paleta y tokens del web. |
| Formularios | React Hook Form + Zod | Validación compartible con el backend. |
| Iconos | `lucide-react-native` | Ya usados en el web. |
| Charts | `victory-native` | Barras/donas para dashboard. |
| Notificaciones | `expo-notifications` | Alertas de presupuesto/recurrentes. |
| Auth Google (opcional) | `expo-auth-session` | Solo si queremos SSO móvil. |

Skipped: Redux, MobX — TanStack Query cubre estado de servidor; para UI local, `useState` basta.

---

## 2. Estructura del proyecto

```
mobile/
├── app/                          # Expo Router (file-based)
│   ├── _layout.tsx               # Root: providers (QueryClient, Auth, Theme)
│   ├── (auth)/                   # Stack sin bottom tabs
│   │   ├── login.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/                   # Bottom navigation
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Dashboard (resumen)
│   │   ├── transactions.tsx      # Ingresos/egresos
│   │   ├── investments.tsx       # Stocks + Crypto + HYS
│   │   ├── budgets.tsx           # Presupuestos + metas
│   │   └── profile.tsx           # Config + shares + logout
│   ├── transaction/[id].tsx      # Detalle/edición transacción
│   ├── account/[id].tsx          # Detalle cuenta bancaria
│   ├── goal/[id].tsx             # Detalle meta
│   ├── recurring/[id].tsx        # Detalle recurrente
│   └── history.tsx               # Bitácora completa
├── lib/
│   ├── api.ts                    # Cliente HTTP con Bearer
│   ├── auth.ts                   # login/logout, storage del token
│   ├── queries.ts                # Hooks TanStack Query (useFinances, useAccounts…)
│   ├── mutations.ts              # Hooks de POST/PATCH/DELETE
│   ├── offlineQueue.ts           # Encolar mutaciones si no hay red
│   └── format.ts                 # formatCurrency, formatDate
├── components/                   # UI reutilizable (Button, Card, Sheet…)
├── theme/tokens.ts               # Colores y tipografía
└── app.json                      # Expo config
```

---

## 3. Arquitectura

### 3.1 Cliente HTTP (`lib/api.ts`)

```ts
const BASE = process.env.EXPO_PUBLIC_API_URL!; // https://tu-dominio.com/api

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync("token");
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (res.status === 401) { await logout(); throw new Error("Sesión expirada"); }
  if (!res.ok) throw new Error((await res.json()).error ?? "Error");
  if (res.status === 204) return undefined as T;
  return res.json();
}
```

### 3.2 Auth flow

1. Splash → lee `token` de SecureStore.
2. Si existe → llama `GET /api/data` (side-effect: valida el token, hidrata cache).
3. Si no existe / 401 → `(auth)/login`.
4. Login → `POST /api/auth/token` → guarda token → navega a `(tabs)`.

### 3.3 Estado + cache

Un único hook global: `useAppData()` envuelve `useQuery(["data"], () => api("/data"))`. Todas las pantallas se hidratan de ahí. Mutations invalidan la key `["data"]` para revalidar.

Alternativa (recomendada para v2): keys granulares por dominio (`["finances"]`, `["accounts"]`, etc.) para revalidar solo lo tocado.

### 3.4 Offline queue

Espejo del `lib/offlineQueue.ts` del web:

```ts
type QueuedOp = { id: string; method: string; path: string; body: unknown };

// enqueue: si NetInfo.isConnected === false → guardar en MMKV
// flushQueue: al recuperar conexión, iterar y ejecutar en orden
```

Se registra un listener `NetInfo.addEventListener` en el root layout que dispara `flushQueue` al reconectar.

### 3.5 Design tokens (`theme/tokens.ts`)

Copiar del web:
- **Dark mode default**, con toggle desde `/profile`.
- Paleta: `bg #0a0a0a`, `card #171717`, `border #262626`, `text #fafafa`, `muted #737373`, `accent #22c55e` (verde ingreso), `danger #ef4444` (egreso).
- Tipografía: sistema (SF Pro / Roboto).

---

## 4. Pantallas y mapeo a endpoints

### 4.1 `(auth)/login`
**UI:** Logo centrado. Input identificador (email o teléfono) + input password + botón "Entrar". Enlace "Crear cuenta" (opcional, si habilitas registro).
**Endpoints:** `POST /api/auth/token`.
**Componentes:** `Input`, `Button`, `ErrorBanner`.

### 4.2 `(auth)/onboarding` (opcional)
**UI:** 3 pasos: elegir módulos (stocks, crypto, HYS, metas), moneda base, aceptar.
**Endpoints:** `PATCH /api/config` con `{ onboardingDone: true, showStocks, showCrypto, showHys, showGoals }`.

### 4.3 `(tabs)/index` — Dashboard
**UI:**
- Header con saldo total (suma de cuentas + HYS + inversiones convertidas a COP con TRM).
- Chip "Actualizar TRM" (llama `POST /api/prices/trm`).
- Tarjetas horizontales scrollables: patrimonio por cuenta.
- Sección "Este mes": ingresos vs egresos (barra/donut).
- Sección "Metas": progreso de metas próximas.
- Sección "Últimos movimientos" (5 más recientes).

**Endpoints:** `GET /api/data` (todo), `POST /api/prices/refresh`, `POST /api/prices/trm`.

### 4.4 `(tabs)/transactions` — Ingresos/Egresos
**UI:**
- FAB inferior verde (ingreso) + rojo (egreso).
- Filtros arriba: mes/año, categoría, cuenta.
- Lista agrupada por fecha (día).
- Swipe left para editar, swipe right para borrar.
- Modal / bottom sheet al crear: monto, tipo, descripción, categoría (autocomplete con `/api/categories`), cuenta, fecha.

**Endpoints:** `GET/POST /api/finances`, `PATCH/DELETE /api/finances/[id]`, `POST /api/finances/import`, `GET /api/categories`, `GET /api/accounts`.

### 4.5 `transaction/[id]` — Detalle transacción
**UI:** Form pre-llenado con monto/tipo/categoría/cuenta/fecha. Botón guardar (PATCH), botón eliminar.

### 4.6 `(tabs)/investments` — Inversiones + HYS
**UI (tabs internos):**
- **Stocks:** lista de posiciones (ticker, qty, precio actual vs compra, %). Botón "Refrescar precios". FAB para nueva compra.
- **Crypto:** igual, con precios en COP vía CoinGecko.
- **HYS:** balance actual (con interés proyectado a hoy), tasa TEA, botón "Depositar" / "Retirar" / "Cambiar tasa". Lista de movimientos scrollable con swipe edit/delete.

**Endpoints:**
- `GET/POST /api/stocks`, `PATCH/DELETE /api/stocks/[id]`
- `GET/POST /api/crypto`, `PATCH/DELETE /api/crypto/[id]`
- `GET /api/savings`, `POST /api/savings/init | deposit | withdraw`, `PATCH /api/savings/rate`, `PATCH/DELETE /api/savings/movements/[id]`
- `POST /api/prices/refresh`

### 4.7 `(tabs)/budgets` — Presupuestos + Metas
**UI (tabs internos):**
- **Presupuestos:** header con selector de período (semanal/mensual/anual). Barra global gastado vs tope (config global). Lista de categorías con barra por cada una (gastado vs asignado). Botón "Añadir presupuesto" abre bottom sheet: categoría + monto.
- **Metas:** grid de tarjetas con progreso circular (ahorrado/objetivo), fecha límite. Tap → detalle. FAB para nueva meta.

**Endpoints:**
- `GET /api/budgets`, `PUT /api/budgets/config`, `PUT/DELETE /api/budgets/[category]`
- `GET/POST /api/goals`, `PATCH/DELETE /api/goals/[id]`, `POST /api/goals/[id]/contribute`

### 4.8 `goal/[id]` — Detalle meta
**UI:** Card gigante con progreso, input "Aportar" con botón. Botones editar / eliminar.

### 4.9 `(tabs)/profile` — Configuración
**UI (secciones):**
- Encabezado: avatar, nombre, email.
- **Cuentas bancarias:** lista con balance y color. Tap para editar. FAB para agregar.
- **Recurrentes:** lista con próxima fecha + botón "Aplicar ahora".
- **Categorías:** grid editable.
- **Compartir acceso:** lista de shares (dadas / recibidas), input para invitar por email.
- **Historial:** botón que abre `/history`.
- **Preferencias:** toggles (módulos visibles), moneda base, Telegram ID, tema.
- **Cerrar sesión.**

**Endpoints:**
- `GET/POST /api/accounts`, `PATCH/DELETE /api/accounts/[id]`
- `GET/POST /api/recurrents`, `PATCH/DELETE /api/recurrents/[id]`, `POST /api/recurrents/[id]/apply`
- `GET/POST /api/categories`, `DELETE /api/categories/[id]`
- `GET/POST /api/shares`, `POST /api/shares/[id]/accept`, `DELETE /api/shares/[id]`
- `GET/PATCH /api/config`

### 4.10 `history` — Bitácora
**UI:** lista scrollable de `activityLogs`, agrupada por día. Ícono por tipo (ingreso / egreso / stock_buy / goal_contribute…).
**Endpoints:** `GET /api/history?limit=200`.

---

## 5. Roadmap por fases

Cada fase termina en algo demostrable. Objetivo: entregar valor al usuario ya en la Fase 2.

### Fase 0 — Infra (1–2 días)
- [ ] `npx create-expo-app mobile -t default` con TypeScript.
- [ ] Instalar NativeWind, Expo Router, TanStack Query, SecureStore, AsyncStorage, NetInfo, lucide-react-native.
- [ ] Configurar `.env.local` con `EXPO_PUBLIC_API_URL`.
- [ ] Estructurar `app/`, `lib/`, `components/`, `theme/`.
- [ ] Crear `lib/api.ts` + `lib/auth.ts`.

### Fase 1 — Auth + bootstrap (2 días)
- [ ] Splash + redirección según sesión.
- [ ] Pantalla `login`.
- [ ] Layout `(tabs)` con placeholder de las 5 pestañas.
- [ ] `useAppData()` con `GET /api/data`.
- [ ] Pantalla Profile con logout funcional.

**Deliverable:** entras, ves tu nombre y saldo total en dashboard, sales.

### Fase 2 — Transacciones (3 días)
- [ ] Lista de transacciones agrupada por día.
- [ ] Bottom sheet de creación (form ingreso/egreso).
- [ ] Editar + eliminar con swipe.
- [ ] Optimistic updates + invalidación de `["data"]`.

**Deliverable:** flujo diario completo (registrar gasto/ingreso desde el celular).

### Fase 3 — Cuentas + Categorías (2 días)
- [ ] Lista de cuentas en Profile.
- [ ] Crear/editar/eliminar cuenta.
- [ ] CRUD de categorías.
- [ ] Autocomplete de categorías en el bottom sheet de transacciones.

**Deliverable:** setup completo del entorno financiero.

### Fase 4 — Dashboard rico (2 días)
- [ ] Cards por cuenta scrollables.
- [ ] Chart ingresos vs egresos del mes (victory-native).
- [ ] Últimos movimientos.
- [ ] Refresh de TRM.

### Fase 5 — Presupuestos + Metas (3 días)
- [ ] Vista `budgets` con selector de período y barras por categoría.
- [ ] CRUD de presupuestos + config global.
- [ ] Grid de metas con progreso circular.
- [ ] Aportar a meta desde detalle.

**Deliverable:** control de gasto y ahorro objetivo funcionando.

### Fase 6 — Inversiones (3 días)
- [ ] Vista Stocks con posiciones y refresh de precios.
- [ ] Vista Crypto igual.
- [ ] Compra desde FAB.

### Fase 7 — HYS (2 días)
- [ ] Vista con balance actual (usa `compound` local para mostrar interés en vivo).
- [ ] Depósito, retiro, cambio de tasa.
- [ ] Lista de movimientos editable.

### Fase 8 — Recurrentes + Compartidos + Historial (2 días)
- [ ] CRUD de recurrentes con botón "Aplicar ahora".
- [ ] Invitaciones de compartir (enviar / aceptar / revocar).
- [ ] Vista `history` completa.

### Fase 9 — Offline + calidad (3 días)
- [ ] Implementar `offlineQueue` con MMKV.
- [ ] Listener de reconexión para flush.
- [ ] Cache local de `GET /api/data` en AsyncStorage para arranque offline.
- [ ] Toasts de éxito/error consistentes.
- [ ] Empty states y skeletons en todas las listas.

### Fase 10 — Extras (opcional)
- [ ] Notificaciones locales para recurrentes próximos.
- [ ] Widgets iOS/Android con saldo del mes.
- [ ] Face ID / Touch ID al abrir.
- [ ] Modo claro con toggle.

---

## 6. Convenciones

- **Todo hook de datos** vive en `lib/queries.ts`. Componentes solo llaman `useX()`.
- **Todo formulario** usa React Hook Form + Zod.
- **Toasts:** un único `<Toast />` global (patrón Sonner-like).
- **Números:** siempre `formatCurrency(n, currency)` — nunca `toLocaleString` inline.
- **Fechas:** ISO `YYYY-MM-DD` para persistencia, `formatDate` para UI.

---

## 7. Deploy

- **iOS:** EAS Build → TestFlight → App Store.
- **Android:** EAS Build → Internal testing → Play Store.
- **OTA updates:** Expo Updates para push de cambios JS sin re-review.

Costo aproximado: EAS free tier alcanza para las primeras builds.

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Token expira mid-uso | Interceptor 401 → forzar re-login. En v2, endpoint `/api/auth/refresh`. |
| Neon cold start (P1001) | Reintentar 1 vez con 2s de espera desde el cliente si el status es 500 y el error menciona conexión. |
| Divergencia de balance por race conditions | Todas las mutaciones que tocan balance viven en el server; el cliente solo lee. |
| Timezone en dashboard | Guardar fechas como `YYYY-MM-DD` (día local sin hora) — ya es así. |

---

## 9. Definition of Done por pantalla

Cada pantalla se considera lista cuando:
1. Funciona con datos reales del servidor.
2. Estado de carga (skeleton o spinner).
3. Estado vacío con CTA.
4. Estado de error con retry.
5. Optimistic update en mutaciones que el usuario espera ver reflejado.
6. Probada en un iPhone y un Android reales (no solo simulador).
