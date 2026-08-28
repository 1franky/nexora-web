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

## Estado del proyecto

En fase de diseño / arranque. Ver [`plan.md`](./plan.md) para el plan de desarrollo completo (roadmap, MVP y reglas de la app).

## Repositorios relacionados

- [`nexora-api`](https://github.com/1franky/nexora-api) — backend/API central que esta app consume
- [`nexora-android`](https://github.com/1franky/nexora-android) — aplicación Android, comparte el mismo contrato de API
