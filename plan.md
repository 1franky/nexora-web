# Plan de desarrollo — nexora-web

## 1. Visión general

`nexora-web` es la aplicación web de **Nexora**, una plataforma de administración de finanzas personales inspirada en conceptos de herramientas como Firefly III. Consume la API central (`nexora-api`) y no debe duplicar reglas de negocio financieras: toda la lógica y cálculos importantes viven en el backend.

Funcionalidad que la web debe exponer al usuario:

- Cuentas de ahorro, débito/corriente, tarjetas de crédito, AFORE y PPR.
- Registro de ingresos y egresos.
- Transferencias entre cuentas.
- Compras con tarjeta de crédito, incluyendo MSI y MCI.
- Fechas de corte y fechas límite de pago.
- Notificaciones de pagos de tarjetas.
- Dashboard con métricas personalizables.

```text
nexora-web  ──►  nexora-api  ──►  PostgreSQL
```

---

## 2. Conceptos de dominio a reflejar en la UI

Estos conceptos los calcula y valida el backend; la web solo los presenta y permite capturarlos.

- **Tipos de cuenta**: débito/corriente, ahorro, tarjeta de crédito, AFORE, PPR (un usuario puede tener más de un PPR).
- **Inclusión en métricas**: cada cuenta puede incluirse/excluirse del saldo disponible y del patrimonio neto — debe ser configurable desde la UI.
- **Dinero disponible** vs. **Patrimonio neto** (activos - pasivos): son métricas distintas y deben mostrarse como tal.
- **Movimientos**: `INCOME`, `EXPENSE`, `TRANSFER`, `CREDIT_CARD_PURCHASE`, `CREDIT_CARD_PAYMENT`, `REFUND`, `ADJUSTMENT`.
  - Una transferencia nunca se muestra como ingreso + gasto.
  - Un pago de tarjeta nunca se muestra como un gasto adicional.
- **Tarjetas de crédito**: nombre, banco, últimos 4 dígitos, límite, día de corte, día límite de pago, saldo utilizado, crédito disponible.
- **MSI/MCI**: una compra financiada se relaciona con un `InstallmentPlan` con N `Installment`; la UI debe permitir ver cuotas pagadas/pendientes, saldo financiado, próxima cuota y fecha de finalización.

---

## 3. Stack propuesto

- React.
- TypeScript.
- Vite.
- React Router.
- TanStack Query.
- Material UI.

---

## 4. Idioma

Disponible inicialmente en **español**, con internacionalización (i18n) desde el inicio para poder agregar otros idiomas después.

```text
i18n
 └── es
     ├── common
     ├── dashboard
     ├── accounts
     ├── transactions
     ├── creditCards
     └── notifications
```

---

## 5. Tema visual

Debe implementar modo claro y modo oscuro, con tres opciones seleccionables por el usuario:

```text
Claro
Oscuro
Sistema
```

Al seleccionar **Sistema**, se usa la preferencia del sistema operativo. La preferencia elegida debe persistirse entre sesiones.

---

## 6. Módulos

```text
Dashboard
│
├── Cuentas
│   ├── Débito
│   ├── Ahorro
│   ├── Crédito
│   └── AFORE
│
├── Movimientos
│
├── Tarjetas
│   ├── Tarjetas
│   ├── Compras
│   ├── MSI/MCI
│   └── Pagos
│
├── Categorías
│
├── Presupuestos
│
├── Metas
│
├── Reportes
│
├── Notificaciones
│
└── Configuración
```

---

## 7. Dashboard

Widgets/métricas iniciales a soportar:

- Patrimonio neto.
- Dinero disponible.
- Ingresos del mes.
- Gastos del mes.
- Balance mensual.
- Gastos por categoría.
- Ingresos por categoría.
- Deuda de tarjetas.
- Crédito disponible.
- Próximos pagos.
- MSI activos.
- Monto mensual comprometido en MSI/MCI.
- Evolución del patrimonio.
- Evolución de gastos.
- Ahorro mensual.
- Metas de ahorro.
- AFORE.
- Últimas transacciones.

El usuario podrá: agregar, eliminar y reordenar widgets; configurar el periodo de algunas métricas; personalizar qué información desea visualizar.

---

## 8. Notificaciones

La web debe poder mostrar notificaciones basadas en eventos como:

```text
PAYMENT_DUE
PAYMENT_DUE_SOON
PAYMENT_OVERDUE
INSTALLMENT_DUE
BUDGET_EXCEEDED
UNUSUAL_EXPENSE
```

Ejemplo: *"Tu tarjeta BBVA vence en 3 días. Pago estimado: $4,850."*

---

## 9. Roadmap

### W1 — Base

- React, TypeScript, Vite.
- Arquitectura base.
- Login.
- Layout.
- Navegación.
- Internacionalización.
- Tema claro/oscuro/sistema.

### W2 — Dashboard

- Dashboard inicial (lectura).

### W3 — Cuentas y movimientos

- Cuentas.
- Movimientos.

### W4 — Tarjetas

- Tarjetas.

### W5 — MSI/MCI

- MSI/MCI.

### W6 — Reportes

- Reportes.

### W7 — Dashboard personalizable

- Widgets configurables.

### W8 — Configuración

- Notificaciones.
- Configuración.
- Preferencias.
- Idioma.
- Tema visual.

---

## 10. MVP web

- Español.
- Modo claro / oscuro / sistema.
- Dashboard.
- Cuentas: débito, ahorro, crédito, AFORE.
- Movimientos: ingreso, gasto, transferencia.
- Tarjetas: límite, corte, fecha de pago, compra, pago.
- MSI/MCI: compra, calendario de cuotas, saldo pendiente.

---

## 11. Funcionalidades posteriores al MVP

```text
Presupuestos
Metas de ahorro
Importación CSV
Importación de estados de cuenta
Reportes avanzados
Gráficas
Histórico de AFORE
Multi-moneda avanzada
Transacciones recurrentes
Exportación
2FA
```

---

## 12. Reglas importantes para esta app

1. No implementar reglas financieras duplicadas: los cálculos importantes viven en `nexora-api`.
2. Las transferencias no se contabilizan como ingresos y gastos.
3. El pago de una tarjeta no se contabiliza como gasto adicional.
4. El saldo disponible y el patrimonio neto deben mostrarse como métricas distintas.
5. Debe soportar español desde el MVP, con arquitectura preparada para más idiomas.
6. Debe soportar modo claro, oscuro y sistema desde el MVP, persistiendo la preferencia del usuario.
7. Debe consumir el mismo contrato de API (OpenAPI) que `nexora-android`.

---

## 13. Repositorios relacionados

- `nexora-api` — backend/API central que esta app consume.
- `nexora-android` — aplicación Android, comparte el mismo contrato de API.
