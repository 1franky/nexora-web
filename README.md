# nexora-web

Aplicación web de **Nexora**, una plataforma de administración de finanzas personales inspirada en conceptos de herramientas como Firefly III.

Consume la API central [`nexora-api`](https://github.com/1franky/nexora-api). No implementa reglas financieras propias: toda la lógica y cálculos importantes viven en el backend.

```text
nexora-web  ──►  nexora-api  ──►  PostgreSQL
```

## Funcionalidad

- Cuentas: débito/corriente, ahorro, tarjeta de crédito, AFORE, PPR.
- Registro de ingresos, egresos y transferencias.
- Compras con tarjeta de crédito, incluyendo MSI y MCI.
- Fechas de corte y fecha límite de pago.
- Notificaciones de pagos de tarjetas.
- Dashboard con métricas y widgets personalizables.

## Stack

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Material UI

## Idioma

Disponible inicialmente en **español**, con internacionalización (i18n) desde el inicio para agregar otros idiomas más adelante.

## Tema visual

Modo claro u oscuro, con la preferencia persistida entre sesiones. La primera vez (nada guardado todavía) se resuelve una sola vez según la preferencia del sistema operativo en ese momento — no se vuelve a "seguir" cambios futuros del SO.

## Módulos

```text
Dashboard
├── Cuentas
├── Movimientos
├── Tarjetas (Tarjetas, Compras, MSI/MCI, Pagos)
├── Categorías
├── Presupuestos
├── Metas
├── Reportes
├── Notificaciones
└── Configuración
```

## Exposición y red

La app se expone en el **puerto 3006**. Es una SPA: las peticiones a `nexora-api` salen del **navegador** del usuario, no del contenedor — por eso no comparte red Docker con el compose de `nexora-api` (no hace falta, no se llaman entre contenedores).

## Desarrollo local (macOS)

Requisitos: Node 22+ (o el Docker de abajo). `nexora-api` debe estar corriendo (ver su propio README) — por defecto en `http://localhost:3005`.

```bash
npm install
cp .env.example .env   # VITE_API_BASE_URL; por defecto ya apunta a nexora-api en local

npm run dev             # http://localhost:5173, con HMR
npm run build           # type-check (tsc) + build de producción a dist/
npm run lint            # oxlint
```

## Despliegue con Docker

Mismo `compose.yaml` en desarrollo y en el VPS; lo que cambia es el `.env`. Es una imagen multi-stage: compila con Vite (`VITE_API_BASE_URL` queda incrustado en el bundle en ese paso) y sirve los estáticos resultantes con [`serve`](https://www.npmjs.com/package/serve) en el puerto 3006 — sin servidor de aplicación.

En el VPS vive en **https://nexora.franciscolopez.uk/**, apuntando a la misma `nexora-api` real que usa `nexora-android`.

```bash
docker compose up --build
# http://localhost:3006
```

> En el VPS, `VITE_API_BASE_URL` en el `.env` debe apuntar a la URL pública real de `nexora-api` (el navegador del usuario, no el contenedor, es quien la llama).

## Arquitectura (W1)

```text
src/
├── api/          cliente axios (maneja el access token y el refresh automático en 401)
├── auth/         AuthContext, tokenStore (localStorage), RequireAuth (guard de rutas)
├── app/          App, router, QueryClient
├── layout/       AppLayout (barra + navegación), AuthLayout
├── theme/        claro/oscuro (persistido), tema de Material UI
├── i18n/         español, por namespace/módulo (common, auth, dashboard, accounts, transactions, ...)
└── pages/        LoginPage, RegisterPage, DashboardPage, AccountsPage, TransactionsPage, CreditCardsPage, CreditCardDetailPage (incluye MSI/MCI)
```

Login con JWT real contra `nexora-api` (B7): access token corto + refresh token que se rota automáticamente cuando una petición responde 401. Los tokens se guardan en `localStorage` — simplificación conocida de un SPA sin backend-for-frontend (expuesto a XSS); el access token dura poco para acotar el riesgo.

## Estado del proyecto

**W1 a W8 completos** — el roadmap original de `nexora-web` (`plan.md`, sección 9) está cerrado, y ya no queda ningún módulo "próximamente": login/registro reales contra `nexora-api`, layout con navegación, tema claro/oscuro persistido, i18n en español, el dashboard completo y personalizable, gestión de cuentas, movimientos (ingresos, gastos y transferencias, de todas las cuentas juntas o filtrados a una), tarjetas de crédito (alta, compras, pagos), compras a meses (MSI/MCI, con calendario de cuotas), reportes por rango de fechas, notificaciones (pagos y cuotas por vencer), configuración (cuenta, apariencia, idioma) y gestión completa de categorías (crear, renombrar, archivar). Desplegada en **https://nexora.franciscolopez.uk/**, contra la API real. Ver [`plan.md`](./plan.md) para el plan de desarrollo completo (roadmap, MVP y reglas de la app).

### Gráficas (dashboard)

El dashboard sigue la skill `dataviz`: cada gráfica compara **magnitud**, no identidad — un solo color (azul) en todas, nunca una paleta categórica por categoría (eso gastaría el canal de identidad en algo que el largo de la barra ya muestra). Etiquetas directas siempre visibles donde hay espacio, crosshair + tooltip en la línea, tooltip por barra en las de barras, y **toggle de vista de tabla** en cada tarjeta (ningún valor depende solo de hover o de color para poder leerse). Paleta y specs en `src/components/dataviz/`.

### Cuentas y movimientos (W3)

"Cuentas" y "Movimientos" son responsabilidades separadas: la primera crea/lista cuentas y sus saldos (cada una en su propia moneda — `formatCurrencyIn` en `dataviz/format.ts`, distinto de `formatCurrency` que el dashboard usa fijo en MXN por ser un agregado en la moneda base); la segunda es donde se ven y registran ingresos, gastos y transferencias, con un selector de cuenta (clic en una cuenta de la lista te manda aquí, con esa cuenta ya seleccionada vía `?accountId=`).

Una transferencia crea dos filas (`outgoing`/`incoming`) que comparten el mismo `type` (`TRANSFER`) — lo único que distingue cuál entra y cuál sale es `balanceEffect` (con signo), que `nexora-api` calculaba desde B2 pero no exponía en el DTO hasta un fix dedicado motivado por esta misma fase. Sin ese campo no había forma de pintar el monto en rojo/verde ni de resolver el nombre de la "cuenta relacionada" en la tabla.

La categorización desde este formulario sigue siendo mínima a propósito (elegir una categoría existente o crear una nueva con nombre + tipo implícito, sin salir del formulario) — la gestión completa (renombrar, archivar) vive en su propio módulo, ver "Categorías" más abajo.

### Tarjetas (W4)

A diferencia de Cuentas/Movimientos, aquí sí hay una página de detalle por tarjeta (`/credit-cards/:id`): una compra y un pago de tarjeta usan endpoints y formularios propios (`POST /credit-cards/{id}/purchases` con comercio, `/payments` con cuenta de origen), distintos de los de Movimientos, así que no hay UI que duplicar al separarlos — y la tarjeta necesita mostrar su propio resumen (límite, deuda, disponible, próximo corte/pago, ya calculados por el backend) que una vista genérica de movimientos no tendría dónde poner. El diálogo de pago excluye del selector de cuenta de origen a las demás tarjetas (regla de negocio: no se paga una tarjeta con otra tarjeta). Reutiliza `QuickCreateCategoryDialog` de Movimientos para categorizar una compra sin salir del formulario.

### MSI/MCI (W5)

`POST /credit-cards/{id}/installment-plans` registra la compra financiada completa (monto original + interés, si es MCI) como una única `CREDIT_CARD_PURCHASE` — el saldo de la tarjeta ya refleja el total adeudado desde el día 1 — y el backend decide `MSI` vs `MCI` según la tasa de interés (`0` = MSI), así que el formulario es uno solo con un campo de tasa opcional, sin selector de tipo. Cada plan se muestra en un acordeón (`InstallmentPlansSection`, reutilizado desde `CreditCardDetailPage`) con su resumen (cuota mensual, saldo financiado, próxima cuota, fecha de fin) y el calendario completo de cuotas.

"Marcar como pagada" en una cuota es **solo contable** — no mueve dinero entre cuentas (el dinero real ya salió, o sale, cuando pagas la tarjeta con "Pagar tarjeta"; esto solo lleva el registro de qué cuotas ya cubriste). El texto de ayuda del botón lo aclara explícitamente para no confundirlo con un pago real.

### Reportes (W6)

A diferencia del dashboard (siempre mes calendario o una ventana fija de 6 meses), "Reportes" agrega el mismo ledger de `Transaction` por un **rango de fechas libre** (`GET /api/v1/reports?from=&to=`), acotable a una cuenta o a un tipo de movimiento — filtros que también agregado en `nexora-api` en este mismo cambio, motivado por esta página. Reutiliza los mismos componentes de `dataviz` que el dashboard (gráficas de categoría y evolución mensual con su vista de tabla), y una tabla de movimientos igual a la de Movimientos pero cruzando todas las cuentas del usuario a la vez (con columna de cuenta, y cada monto en su propia moneda).

### Dashboard personalizable (W7)

Puramente frontend: `nexora-api` ya expone todas las métricas en una sola respuesta (`GET /dashboard`), así que "agregar, eliminar y reordenar widgets" (`plan.md`, sección 10) es solo cuestión de qué se renderiza y en qué orden, no de qué se pide al backend. Cada sección del dashboard (`src/components/dashboard/widgetDefinitions.ts`) es un widget independiente con un `id` y un tamaño (`quarter`/`half`); `useDashboardLayout` guarda el orden y la visibilidad en `localStorage` (mismo patrón que la preferencia de tema), y el diálogo "Personalizar" los administra con checkboxes y flechas subir/bajar — sin drag-and-drop, para no sumar una dependencia nueva solo por esto. El selector de mes queda fuera del sistema de widgets a propósito: no es contenido que se pueda ocultar, es el control que decide qué dato ven los widgets que dependen del periodo.

### Notificaciones y Configuración (W8)

Ambas consumen lo que `nexora-api` ya tenía construido desde B6, sin cambios de backend. "Notificaciones" llama a `GET /notifications` (regenera al vuelo lo que falte — pagos y cuotas por vencer — antes de responder, así que nunca hay que "refrescar" para ver algo al día), con marcar-como-leída individual y masivo; el contador de no leídas en el ícono de nav (`AppLayout`) comparte la misma `queryKey` que la página, así que entrar a "Notificaciones" no dispara una segunda consulta, solo reusa/invalida ese mismo caché. "Configuración" agrupa cuenta (solo lectura: nombre y email de `/users/me`, ya en `AuthContext`), apariencia (el mismo control de tema de `ThemeModeContext` que ya vive en la barra superior, ahora también aquí) e idioma (el selector muestra "Español" fijo — no hay nada más que ofrecer todavía, pero i18n ya está organizado por namespace desde W1 para agregar otro sin reestructurar).

### Categorías, tema y Movimientos multi-cuenta

Tres cambios independientes en la misma pasada, motivados por pruebas reales y un issue de seguimiento ([#6](https://github.com/1franky/nexora-web/issues/6)):

- **Categorías** (`/categories`, gestión completa): crear, renombrar y archivar/reactivar, agrupadas en "Gastos" e "Ingresos". Archivar no borra la categoría — sigue existiendo para lo ya categorizado y sigue en el listado — pero `nexora-api` la rechaza si se intenta usar en un movimiento nuevo; los selectores de categoría (Movimientos, Compra con tarjeta) filtran las archivadas para no ofrecerlas ahí.
- **Tema visual**: se quitó la opción "Sistema" (antes tercera opción junto a Claro/Oscuro). Un valor ya guardado se respeta tal cual; el valor legado `"system"` (o no encontrar nada guardado) se resuelve una sola vez a la preferencia del sistema operativo en ese momento y se persiste — sin quedar "siguiendo" cambios futuros del SO como antes (con un listener en vivo sobre `prefers-color-scheme`).
- **Movimientos**: la cuenta pasó de ser un requisito para poder listar a un filtro opcional — por defecto se ven los movimientos de todas las cuentas juntos (con columna de cuenta), y el selector acota igual que antes. `accountId` en `GET /transactions` de `nexora-api` pasó de obligatorio a opcional para esto. El diálogo "Nuevo movimiento" ahora elige la cuenta como parte del formulario (antes era un prop fijo, forzada por el contexto de la página) — se precarga con el filtro activo si había uno.

## Repositorios relacionados

- [`nexora-api`](https://github.com/1franky/nexora-api) — backend/API central que esta app consume
- [`nexora-android`](https://github.com/1franky/nexora-android) — aplicación Android, comparte el mismo contrato de API
