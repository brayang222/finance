# Handoff: Gestor Financiero Personal ("Patrimonio")

## Overview
Web app de finanzas personales para gestionar, en un solo lugar: **inversiones en bolsa (BVC), criptomonedas, ingresos y egresos, y cuentas / patrimonio total**. Moneda principal **COP (peso colombiano)**. Interfaz en **español**, estética sobria tipo banca privada, con **modo oscuro y claro** y **modo privacidad** (ocultar saldos). Responsive: sidebar en escritorio, barra inferior en móvil.

## About the Design Files
El archivo `Patrimonio.dc.html` de este paquete es una **referencia de diseño creada en HTML** — un prototipo que muestra el aspecto y el comportamiento buscados, **no código de producción para copiar tal cual**. La tarea es **recrear este diseño en el entorno del codebase destino** (React, Vue, Next.js, etc.) usando sus patrones, librerías y sistema de estado establecidos. Si aún no existe un entorno, elige el stack más apropiado (recomendado: **React + TypeScript + Vite**, con una librería de charts como Recharts o visx, e `Intl` nativo para formateo de moneda).

> Nota técnica: el prototipo está escrito como un "Design Component" con una plantilla + una clase de lógica. Ignora ese envoltorio; interésate por la **estructura, los estilos inline (que son los valores reales de diseño), los datos de ejemplo y la lógica de cálculo/estado**, que se documentan abajo.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciados e interacciones son finales. Recrear la UI de forma fiel usando las librerías/patrones del codebase. Los **datos son de ejemplo** (mock) — deben reemplazarse por datos reales de un backend/API.

---

## Design Tokens

### Color (CSS custom properties, cambian con el tema)
Se aplican como variables en el contenedor raíz y se referencian con `var(--x)`.

**Modo oscuro (default):**
| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#0e0f13` | Fondo de la app |
| `--panel` | `#15171c` | Fondo de tarjetas / sidebar |
| `--panel2` | `#1b1e25` | Fondos secundarios (inputs, chips activos, avatares) |
| `--line` | `#262a33` | Bordes y separadores |
| `--fg` | `#eceef1` | Texto principal |
| `--muted` | `#9ba1ab` | Texto secundario |
| `--dim` | `#5f6672` | Texto terciario / labels de eje |
| `--pos` | `#5cae87` | Verde: ganancias / ingresos |
| `--neg` | `#d67c78` | Rojo: pérdidas / egresos |
| `--accent` | `#eceef1` | Acción primaria (botón "Registrar", nav activo, línea de gráfico) |
| `--accentFg` | `#0e0f13` | Texto sobre `--accent` |
| `--chip` | `#20242c` | Fondo de chips/pills |

**Modo claro:**
| Token | Hex |
|---|---|
| `--bg` | `#f5f4f1` |
| `--panel` | `#ffffff` |
| `--panel2` | `#efeeea` |
| `--line` | `#e6e4de` |
| `--fg` | `#1b1d20` |
| `--muted` | `#6c727a` |
| `--dim` | `#a2a7ad` |
| `--pos` | `#2f8f6a` |
| `--neg` | `#c05a54` |
| `--accent` | `#1b1d20` |
| `--accentFg` | `#f5f4f1` |
| `--chip` | `#f0efeb` |

**Acento opcional (tweak `colorAccent`):** override de `--accent` y de la línea de gráficos por: Oro `#b3924f`, Azul `#4f7cff`, Verde `#3ea678`. Default "Neutro" = `--accent` del tema.
**Rampa monocromática del donut (allocation):** `#8a8f98, #a6abb2, #6a707a, #c0c3c8, #565c66, #767c86, #9aa0a8`. El segmento cripto en la barra de composición usa `#8a8f98`.

### Tipografía (Google Fonts)
- **Display / cifras grandes / títulos:** `Spectral` (serif), pesos 300/400/500/600. Usada en balances, títulos de página y valores hero. `letter-spacing: -0.01em a -0.02em`.
- **UI / cuerpo / labels:** `IBM Plex Sans`, pesos 400/500/600. Fuente base (`font-size: 14px; line-height: 1.45`).
- **Tabular / tickers / montos en tablas:** `IBM Plex Mono`, pesos 400/500.
- Todos los números en columnas/valores usan `font-variant-numeric: tabular-nums`.

Escala aproximada: hero patrimonio `clamp(34px,5vw,52px)`; valor detalle `32px`; valores KPI `26–28px`; títulos de sección `14px/500`; labels `12.5px`; micro-labels de eje/uppercase `11–11.5px, letter-spacing 0.04–0.08em, text-transform uppercase`.

### Radios, sombras, espaciado
- Border radius: tarjetas grandes `16–20px`; tarjetas KPI `16px`; inputs/botones `10–11px`; chips/pills `999px`; iconos-avatar `8–13px`.
- Bordes: `1px solid var(--line)` en casi todo.
- Sombra: solo el modal — `0 30px 80px rgba(0,0,0,0.45)`; backdrop del modal `rgba(0,0,0,0.55)` + `backdrop-filter: blur(5px)`.
- Header sticky con `backdrop-filter: blur(10px)` y fondo `color-mix(in srgb, var(--bg) 82%, transparent)`.
- Espaciado interno tarjetas: `18–24px`. Gaps de grids: `14px`. Padding del contenido: `26px 28px 40px`, contenido centrado `max-width: 1180px`.
- Ancho sidebar escritorio: `250px`. Breakpoint móvil: `window.innerWidth < 880`.

---

## Screens / Views
Navegación por estado `view`: `resumen | inversiones | cripto | detalle | transacciones | cuentas`. Sidebar (escritorio) y bottom-nav (móvil) comparten los mismos destinos. Un indicador de barra vertical (`2.5px`, color `--accent`) marca el ítem activo; texto activo `--fg`, inactivo `--muted`.

### 1. Resumen (dashboard)
- **Propósito:** vista general del patrimonio y del mes.
- **Layout:** columna con gap `18px`.
  - **Hero (full width):** label "Patrimonio total", valor grande (Spectral), chip de variación (↑/↓ % con color pos/neg) + monto absoluto + "· últimos 12 meses". A la derecha, un sparkline de área (SVG, `340×90`, gradiente de `--line-accent` a transparente).
  - **Grid de KPIs** (`repeat(auto-fit, minmax(230px,1fr))`): Inversiones · bolsa, Cripto, Efectivo y bancos, Ingresos · [mes], Egresos · [mes]. Cada uno con label, valor (Spectral) y sub-línea (P/G o conteo).
  - **Gráfico "Evolución del patrimonio":** control segmentado de rango (1M / 6M / 1A / Todo) arriba a la derecha; SVG `800×250` con área + línea (spline Catmull-Rom), 3 líneas de grid horizontales punteadas con label de valor (formato corto `$XX,XM`), punto final resaltado, y ticks de eje X.
  - **Fila de dos tarjetas** (`minmax(300px,1fr)`): **Asignación del portafolio** (donut SVG `150×150`, stroke `16px`, centro con total corto + leyenda con % por activo) y **Ingresos vs. egresos** (barras verticales por mes, dos barras por mes con colores `--pos`/`--neg`, altura relativa al máximo).
  - **Movimientos recientes:** lista de los 6 más recientes (icono ↑/↓, descripción, categoría · cuenta, fecha, monto con signo y color). Enlace "Ver todas →" navega a Transacciones.

### 2. Inversiones (portafolio bolsa)
- **Propósito:** ver posiciones en la Bolsa de Valores de Colombia.
- **Layout:** 3 tarjetas resumen (Valor del portafolio, Costo invertido, Rendimiento P/G con %) + tabla.
- **Tabla "Posiciones en bolsa · BVC":** columnas Activo (avatar mono + ticker en mono + nombre), Cantidad, Precio, Valor, Rend. (% arriba + monto con signo abajo, color por signo), 7 días (sparkline `90×28`). Fila clickeable → Detalle (con `selFrom='inversiones'`). Header de tabla en uppercase `--dim`; filas separadas por `1px var(--line)`.

### 3. Cripto
- Idéntico patrón a Inversiones pero con `--crypto` holdings. 3 tarjetas (Valor en cripto, Costo invertido, Rendimiento) + tabla "Posiciones en cripto". Cantidades con hasta 4 decimales. Fila clickeable → Detalle (`selFrom='cripto'`).

### 4. Detalle de activo (acción o cripto)
- **Propósito:** profundizar en una posición.
- **Layout:** botón "← Volver" (regresa a `selFrom`); header con avatar + ticker + nombre a la izquierda y precio grande + variación del día a la derecha; gráfico de precio (SVG `800×240`, área + línea, grid + ticks); grid de 6 stats (Posición, Precio actual, Costo promedio, Valor de mercado, P/G no realizada [color por signo], Peso en portafolio); tabla "Historial de operaciones" (Fecha, Tipo [chip], Cantidad, Precio, Total).

### 5. Transacciones (ingresos/egresos)
- **Layout:** 3 tarjetas (Ingresos del mes, Egresos del mes, Balance neto [color por signo]) + zona de dos columnas.
  - **Tabla "Movimientos · [mes año]"** (ocupa 2 col): control segmentado Todos/Ingresos/Egresos; columnas Descripción (icono + desc + fecha), Categoría (chip), Cuenta, Monto (mono, con signo y color). Ordenada por fecha desc.
  - **"Gastos por categoría":** lista de categorías con monto y barra de progreso proporcional (color `--neg`, opacidad 0.85).

### 6. Cuentas (patrimonio)
- **Layout:** hero "Patrimonio total" + **barra de composición** de 3 segmentos (Bolsa `--accent`, Cripto `#8a8f98`, Efectivo y bancos `--dim`) con leyenda y montos. Debajo, grupos de cuentas por tipo (Cuentas bancarias, Comisionista de bolsa, Efectivo y billeteras), cada grupo con total y una grid de tarjetas de cuenta (avatar mono, nombre, tipo, saldo en Spectral).

---

## Interactions & Behavior
- **Navegación:** click en sidebar/bottom-nav cambia `view`. En detalle, "Volver" usa `selFrom` para regresar al origen (Inversiones o Cripto).
- **Tema:** botón sol/luna en header alterna oscuro/claro; se **persiste en `localStorage` (`gfp-theme`)** y se re-aplica al cargar. Setea también `color-scheme` en el root (para date pickers, scrollbars).
- **Privacidad:** botón ojo en header alterna `privacy`; cuando está activo, todos los saldos/montos se muestran como `••••••` (los gráficos conservan su forma, sin cifras).
- **Registrar movimiento (modal):** el botón "Registrar" abre un modal centrado con backdrop. Pestañas Ingreso/Egreso (segmented). Campos: Monto (number, prefijo `$`), Descripción (text), Categoría (select, opciones según tipo), Cuenta (select desde cuentas), Fecha (date, default hoy). Botón Guardar deshabilitado visualmente (fondo `--panel2`, texto `--dim`) hasta que `monto>0 && descripción no vacía`. Al guardar, se **inserta el movimiento al inicio de la lista** y se recalculan totales del mes, movimientos recientes y gastos por categoría en vivo. Cancelar / click en backdrop / X cierran el modal (click dentro del card hace `stopPropagation`).
- **Rango de gráfico:** el segmentado 1M/6M/1A/Todo cambia la serie del gráfico de patrimonio.
- **Filtro de transacciones:** Todos/Ingresos/Egresos filtra la tabla.
- **Responsive:** listener de `resize` actualiza `isMobile` (<880px). En móvil se oculta el sidebar y aparece un bottom-nav fijo de 5 ítems (Resumen, Bolsa, Cripto, Movs, Cuentas); el `main` gana padding inferior de `84px`. Tablas con `overflow-x:auto`.
- **Hover/focus:** botones e inputs con cursor pointer; inputs con `outline:none` y borde `--line`. (Añadir estados hover/focus explícitos según el sistema del codebase.)
- **Sin animaciones de entrada:** se retiró deliberadamente cualquier animación de opacidad de entrada en el contenido (causaba parpadeos). No reintroducir animaciones que dejen contenido en `opacity:0`.

## State Management
Variables de estado principales:
- `view` — pantalla activa.
- `theme` — `'dark' | 'light'` (persistida en localStorage `gfp-theme`).
- `selected` — ticker del activo en detalle; `selFrom` — `'inversiones' | 'cripto'` (origen para "Volver").
- `range` — `'1M' | '6M' | '1A' | 'Todo'` para el gráfico de patrimonio.
- `txType` — `'todos' | 'ingresos' | 'egresos'` filtro de transacciones.
- `privacy` — boolean (ocultar saldos).
- `isMobile` — boolean derivado del ancho de ventana.
- `showModal`, `modalType` (`'ingreso' | 'egreso'`), `form` (`{ amount, desc, category, account, dateISO }`).

**Datos (hoy mock, reemplazar por API):**
- `accounts[]`: `{ id, name, type, kind ('Banco'|'Inversión'|'Efectivo'), mono, balance }`.
- `holdings[]` (bolsa) y `crypto[]`: `{ ticker, name, mono, qty, avg (costo promedio), price (actual), dayPct, spark[], isCrypto? }`.
- `transactions[]`: `{ id, dateISO ('YYYY-MM-DD'), desc, category, account, type ('ingreso'|'egreso'), amount }`.
- Serie histórica de patrimonio por rango (12 meses de base, escalada para terminar en el total actual).

**Cálculos clave a replicar:**
- Valor posición = `qty*price`; costo = `qty*avg`; P/G = valor−costo; %P/G = P/G/costo; peso = valor/total del portafolio correspondiente.
- Total inversiones (bolsa), total cripto, total efectivo (suma de cuentas), **patrimonio = bolsa + cripto + efectivo**.
- Ingresos/egresos/neto del mes = suma de transacciones cuyo `dateISO` cae en el mes actual.
- Formateo moneda: `Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 })`. Fechas: `Intl.DateTimeFormat('es-CO', { day:'numeric', month:'short', year:'numeric' })`.

## Charts (cómo están dibujados)
Todos son SVG hechos a mano con `viewBox` (escalan al 100% del contenedor):
- **Líneas (patrimonio, precio, sparklines):** spline suave tipo Catmull-Rom→bézier (tensión ~0.18; sparklines ~0.12). Área = línea cerrada hasta la base con gradiente vertical del color de línea a transparente.
- **Donut:** círculos concéntricos con `stroke-dasharray`/`stroke-dashoffset` acumulado; rotado −90°; pista de fondo en `--line`.
- **Barras:** dos barras por mes, altura = `valor/max*100%`.
> En el codebase real se recomienda una librería de charts (Recharts/visx) manteniendo colores, grosores (`2–2.4px` línea, `16px` donut) y estilo de grid punteado (`dasharray 2 5`, color `--line`).

## Tweaks / configuración expuesta
- `colorAccent`: `Neutro | Oro | Azul | Verde` (color de acento y línea de gráfico).
- `defaultTheme`: `Oscuro | Claro` (tema inicial).
- `privacyMode`: boolean (arrancar con saldos ocultos).

## Assets
- **Fuentes:** Google Fonts — Spectral, IBM Plex Sans, IBM Plex Mono.
- **Iconos:** SVG inline hechos a mano (nav, ojo/ojo-tachado, sol/luna, flechas ↑/↓, +, ←, ✕, monedas). No hay imágenes externas.
- **Avatares de activos/cuentas:** iniciales monoespaciadas en un cuadro (no logos). Sustituir por logos reales si se dispone de ellos.

## Files
- `Patrimonio.dc.html` — prototipo completo (todas las vistas + modal + lógica de estado y cálculo). Es la referencia principal.
