# API REST — Finanzas Personales

Documentación de todos los endpoints REST expuestos para consumo desde clientes externos (app móvil, integraciones, scripts). Todos viven bajo `/api/*`.

- **Base URL (dev):** `http://localhost:3000/api`
- **Base URL (prod):** `https://<tu-dominio>/api`
- **Formato:** JSON en request y response.
- **Content-Type:** `application/json` en todos los `POST`/`PATCH`/`PUT`.
- **Errores:** `{ "error": "mensaje" }` con status HTTP apropiado (400/401/404/500).

---

## Autenticación

Cada endpoint (excepto `/auth/token`) acepta **cualquiera** de estas dos formas de autenticación:

1. **Bearer token JWT** (recomendado para móvil / integraciones):
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
2. **Sesión NextAuth** (cookie), útil cuando se llama desde el propio front web.

El JWT usa HS256, expira en **30 días** y se firma con `AUTH_SECRET`. El payload contiene `sub` (userId) y `email`.

### `POST /api/auth/token`
Obtiene el JWT a partir de credenciales.

- **Auth:** ninguna.
- **Body:**
  ```json
  { "identifier": "user@mail.com o 3001234567", "password": "secreta" }
  ```
  `identifier` puede ser email o número de teléfono (solo dígitos).
- **200 OK:**
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": { "id": "cmr17...", "name": "Bray", "email": "user@mail.com", "image": null }
  }
  ```
- **401:** credenciales inválidas.

Guarda el token en el cliente (Keychain / SecureStore / EncryptedSharedPreferences) y adjuntalo en el header `Authorization` en todas las llamadas siguientes.

---

## `GET /api/data`
Devuelve **todo** el estado del usuario en una sola llamada (equivalente al `loadAll` del front). Ideal para el bootstrap del cliente móvil.

- **Auth:** requerida.
- **200 OK:**
  ```json
  {
    "stocks": [...],
    "crypto": [...],
    "finances": [...],
    "hys": { "rate": 12.5, "movements": [...] } | null,
    "prices": { "AAPL": 175.3, "BTC": 145000000 },
    "targets": { "AAPL": 200 },
    "cash": { "banco": 500000 } | null,
    "config": { "theme": "dark", "onboardingDone": true, ... },
    "bankAccounts": [...],
    "activityLogs": [...],
    "budgets": [...],
    "budgetConfigs": [...],
    "categories": [...],
    "goals": [...],
    "recurrings": [...]
  }
  ```

---

## Transacciones — `finances`

Modelo: `{ id, type: "ingreso"|"egreso", amount, desc, category, date, accountId?, accountName? }`

### `GET /api/finances`
Lista todas las transacciones del usuario.

### `POST /api/finances`
Crea una transacción. **Efectos colaterales**: ajusta el balance de la cuenta bancaria, auto-guarda la categoría y crea un `activityLog`.
- **Body:** `{ type, amount, desc, category, date, accountId?, accountName? }`
- **201:** devuelve el registro creado.

### `PATCH /api/finances/[id]`
Actualiza. Revierte el balance anterior y aplica el nuevo.
- **Body:** mismo shape que POST (cualquier campo opcional).

### `DELETE /api/finances/[id]`
Elimina y revierte el balance en la cuenta.
- **204** sin body.

### `POST /api/finances/import`
Importa un array de transacciones en lote (útil para migraciones/CSV).
- **Body:** `{ items: [ { type, amount, desc, category, date, ... }, ... ] }`
- **201:** `{ imported: N }`.

---

## Cuentas Bancarias — `accounts`

Modelo: `{ id, name, bank, type, balance, color }`

### `GET /api/accounts`
Lista cuentas del usuario ordenadas por creación.

### `POST /api/accounts`
Crea cuenta. Registra actividad `account_create`.
- **Body:** `{ name, bank, type, balance, color }`

### `PATCH /api/accounts/[id]`
Actualiza campos parciales de la cuenta.

### `DELETE /api/accounts/[id]`
Elimina la cuenta. **Nota:** las transacciones históricas quedan huérfanas pero preservan `accountName`.

---

## Acciones (Bolsa) — `stocks`

Modelo: `{ id, ticker, qty, priceCOP, commission, date, accountId?, accountName? }`

### `GET /api/stocks`
Lista posiciones.

### `POST /api/stocks`
Registra compra. **Efectos**: descuenta `qty * priceCOP + commission` de la cuenta y crea `activityLog stock_buy`.
- **Body:** `{ ticker, qty, priceCOP, commission, date, accountId?, accountName? }`

### `PATCH /api/stocks/[id]` / `DELETE /api/stocks/[id]`
Actualizar / borrar. `DELETE` revierte el ajuste de balance.

---

## Cripto — `crypto`

Igual a `stocks` con endpoint `/api/crypto[/id]` y `activityLog: crypto_buy`.

---

## Metas — `goals`

Modelo: `{ id, name, target, saved, deadline?, color?, createdAt }`

### `GET /api/goals` — lista metas.
### `POST /api/goals`
- **Body:** `{ name, target, saved?, deadline?, color? }`

### `PATCH /api/goals/[id]`
- **Body:** `{ name, target, saved, deadline?, color? }`

### `DELETE /api/goals/[id]`
Registra `goal_delete` en actividad.

### `POST /api/goals/[id]/contribute`
Aporta un monto a la meta.
- **Body:** `{ amount: 50000 }`
- Incrementa `saved` y registra `goal_contribute`.

---

## Recurrentes — `recurrents`

Modelo: `{ id, type, category, desc, amount, accountId?, accountName?, frequency, nextDate, active }`
Frecuencias soportadas: `diario | semanal | quincenal | mensual | anual`.

### `GET /api/recurrents` / `POST /api/recurrents`
- **POST body:** `{ type, category, desc, amount, accountId?, accountName?, frequency, nextDate }`

### `PATCH /api/recurrents/[id]` / `DELETE /api/recurrents/[id]`

### `POST /api/recurrents/[id]/apply`
Ejecuta el recurrente: crea una transacción en `finances`, ajusta el balance de la cuenta y **avanza `nextDate`** según la frecuencia.
- **200:** `{ ok: true, nextDate: "2026-08-05" }`

---

## HYS (Cuenta de alto rendimiento) — `savings`

Modelo movimiento: `{ id, date, type: "inicio"|"deposito"|"retiro"|"rendimiento", amount, balance, rate, note? }`

### `GET /api/savings`
- **200:** `{ rate, movements: [...] }` o `null` si no está inicializada.

### `POST /api/savings/init`
Inicializa la cuenta HYS. **Borra movimientos previos** y crea el movimiento `inicio`.
- **Body:** `{ initialBalance: 1000000, rate: 12.5 }`

### `POST /api/savings/deposit`
- **Body:** `{ amount, note? }`
- Calcula el interés compuesto acumulado desde el último movimiento hasta hoy, suma el depósito y guarda el nuevo balance.

### `POST /api/savings/withdraw`
- **Body:** `{ amount, note? }`

### `PATCH /api/savings/rate`
Cambia la TEA. Antes, captura el rendimiento acumulado como un movimiento `rendimiento`.
- **Body:** `{ rate: 13.2 }`

### `PATCH /api/savings/movements/[id]` / `DELETE /api/savings/movements/[id]`
Editar o borrar un movimiento. **Recalcula (replay) todos los balances posteriores** para mantener consistencia.

---

## Presupuestos — `budgets`

Modelo `budget`: `{ userId, category, amount, period }` (uno por categoría × período).
Modelo `budgetConfig`: `{ userId, period, amount }` (tope global por período).
Períodos: `semanal | mensual | anual`.

### `GET /api/budgets`
- **200:** `{ budgets: [...], budgetConfigs: [...] }`

### `PUT /api/budgets/config`
Upsert del tope global.
- **Body:** `{ period: "mensual", amount: 2000000 }`

### `PUT /api/budgets/[category]`
Upsert del presupuesto de una categoría.
- **Body:** `{ amount: 300000, period: "mensual" }`

### `DELETE /api/budgets/[category]?period=mensual`
Elimina el presupuesto de esa categoría en ese período.

---

## Categorías — `categories`

Modelo: `{ id, name, type: "ingreso"|"egreso" }`

### `GET /api/categories` — lista.
### `POST /api/categories`
Upsert (idempotente).
- **Body:** `{ name: "Comida", type: "egreso" }`

### `DELETE /api/categories/[id]`

---

## Configuración de usuario — `config`

### `GET /api/config`
- **200:**
  ```json
  {
    "theme": "dark",
    "onboardingDone": true,
    "showStocks": true,
    "showCrypto": true,
    "showHys": true,
    "showActivity": true,
    "showGoals": true,
    "baseCurrency": "COP",
    "trm": 4200.5,
    "trmUpdatedAt": "2026-07-05T10:00:00.000Z",
    "summaryWidgets": ["net_worth", "monthly_flow"],
    "telegramId": "123456789"
  }
  ```

### `PATCH /api/config`
Actualiza parcialmente. Campos permitidos: `theme, onboardingDone, showStocks, showCrypto, showHys, showActivity, showGoals, baseCurrency, telegramId, summaryWidgets` (este último se guarda como JSON).
- **Body:** cualquier subconjunto de los campos anteriores.

---

## Precios de mercado — `prices`

### `POST /api/prices/refresh`
Actualiza precios llamando a Yahoo Finance (acciones colombianas `.CL`) y CoinGecko (cripto). Persiste en la tabla `Price`.
- **Body:** `{ stockTickers: ["ECOPETROL","PFBCOLOM"], cryptoTickers: ["BTC","ETH"] }`
- **200:** `{ updated: 4, prices: { "ECOPETROL": 2450, "BTC": 145000000 } }`

### `POST /api/prices/trm`
Consulta USD→COP en `open.er-api.com` y guarda la TRM en el config del usuario.
- **200:** `{ trm: 4200.5, updatedAt: "2026-07-05T10:00:00.000Z" }`

---

## Historial de actividad — `history`

### `GET /api/history?limit=100`
Últimos N registros de la bitácora de actividad (default 100, máx 500).
- **200:** `[ { id, action, message, meta, createdAt }, ... ]`

---

## Accesos compartidos — `shares`

Permite dar acceso de lectura del patrimonio a otro usuario.

### `GET /api/shares`
- **200:** `{ given: [invitaciones que envié], received: [invitaciones que me enviaron] }`

### `POST /api/shares`
Invita a otro usuario por email.
- **Body:** `{ guestEmail: "amiga@mail.com", role: "viewer" }`
- Idempotente (upsert por `ownerId+guestEmail`).

### `POST /api/shares/[id]/accept`
El invitado acepta la invitación.

### `DELETE /api/shares/[id]`
Revoca. Puede llamarlo el owner (para retirar) o el guest (para salirse).

---

## Ejemplos rápidos (curl)

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@mail.com","password":"secreta"}' | jq -r .token)

# Bootstrap
curl http://localhost:3000/api/data -H "Authorization: Bearer $TOKEN"

# Crear ingreso
curl -X POST http://localhost:3000/api/finances \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"ingreso","amount":1500000,"category":"Salario","date":"2026-07-05","accountId":"acc_1","accountName":"Bancolombia"}'

# Depositar en HYS
curl -X POST http://localhost:3000/api/savings/deposit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":200000,"note":"Ahorro julio"}'
```

---

## Códigos de estado

| Código | Significado |
|---|---|
| 200 | OK |
| 201 | Creado |
| 204 | OK sin contenido (DELETE) |
| 400 | Petición inválida (falta campo, JSON malo) |
| 401 | Sin autenticar o token inválido |
| 404 | Recurso no existe o no pertenece al usuario |
| 500 | Error interno |

---

## Notas para el cliente móvil

- **Guardar el token** en almacenamiento seguro y refrescarlo antes de los 30 días re-llamando a `/auth/token` con credenciales cacheadas o pidiéndolas de nuevo.
- **Bootstrap:** una sola llamada a `GET /api/data` reemplaza la carga inicial.
- **Sincronización offline:** encola mutaciones (`POST/PATCH/DELETE`) y hazlas flush al recuperar conexión. Todas las mutaciones son idempotentes a nivel de estado observable (usar el `id` del cliente cuando aplique).
- **Ajustes de balance:** los endpoints que mueven dinero (`finances`, `stocks`, `crypto`) ya actualizan el balance de la cuenta bancaria en el mismo request; no lo dupliques desde el cliente.
