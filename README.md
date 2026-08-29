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

Modo claro, oscuro y según sistema, con la preferencia persistida entre sesiones.

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
├── theme/        claro/oscuro/sistema (persistido), tema de Material UI
├── i18n/         español, por namespace/módulo (common, auth, dashboard, ...)
└── pages/        LoginPage, RegisterPage, HomePage, páginas de cada módulo
```

Login con JWT real contra `nexora-api` (B7): access token corto + refresh token que se rota automáticamente cuando una petición responde 401. Los tokens se guardan en `localStorage` — simplificación conocida de un SPA sin backend-for-frontend (expuesto a XSS); el access token dura poco para acotar el riesgo.

## Estado del proyecto

**W1 (arquitectura base)** y **W2 (dashboard)** completos: login/registro reales contra `nexora-api`, layout con navegación, tema claro/oscuro/sistema persistido, i18n en español, y el dashboard completo (patrimonio neto, disponible, deuda/crédito de tarjetas, resumen del mes con selector de periodo, gastos/ingresos por categoría, evolución de patrimonio y de gastos a 6 meses, próximos pagos, MSI activos y últimos movimientos — cada gráfica con su vista de tabla equivalente). El resto de los módulos (Cuentas, Movimientos, Tarjetas, Categorías, Notificaciones) son pantallas "próximamente" por ahora. Ver [`plan.md`](./plan.md) para el plan de desarrollo completo (roadmap, MVP y reglas de la app).

### Gráficas (dashboard)

El dashboard sigue la skill `dataviz`: cada gráfica compara **magnitud**, no identidad — un solo color (azul) en todas, nunca una paleta categórica por categoría (eso gastaría el canal de identidad en algo que el largo de la barra ya muestra). Etiquetas directas siempre visibles donde hay espacio, crosshair + tooltip en la línea, tooltip por barra en las de barras, y **toggle de vista de tabla** en cada tarjeta (ningún valor depende solo de hover o de color para poder leerse). Paleta y specs en `src/components/dataviz/`.

## Repositorios relacionados

- [`nexora-api`](https://github.com/1franky/nexora-api) — backend/API central que esta app consume
- [`nexora-android`](https://github.com/1franky/nexora-android) — aplicación Android, comparte el mismo contrato de API
