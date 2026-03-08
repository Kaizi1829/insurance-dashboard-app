# Dashboard comercial para agencia de seguros

Proyecto base en **Next.js + Tailwind + Recharts** para construir un dashboard empresarial de seguimiento comercial.

## Qué incluye

- Dashboard principal ARGOS
- Selector de año y mediador
- Tarjetas KPI
- Gráficos de evolución y producción por ramos
- Panel de rápel anual y cuatrimestral
- Panel de grados
- Vista de histórico anual
- Formulario base para CRUD de datos mensuales
- Estructura preparada para conectar con PostgreSQL / Supabase
- Esquema SQL incluido

## Arquitectura propuesta

### Frontend
- `app/page.tsx`: dashboard principal ARGOS
- `app/data/page.tsx`: alta / edición de datos
- `app/objectives/page.tsx`: configuración de objetivos
- `components/*`: tarjetas, filtros, badges, gráficos

### Dominio y lógica
- `lib/types.ts`: tipado del dominio
- `lib/calculations.ts`: cálculo de agregados, rápeles, grados y alertas
- `lib/mock-data.ts`: dataset de ejemplo

### Backend/API
- `app/api/metrics/route.ts`: endpoint GET/POST de métricas
- `app/api/objectives/route.ts`: endpoint de objetivos
- `sql/schema.sql`: modelo de datos PostgreSQL/Supabase

## Modelo de datos

### Tabla `monthly_metrics`
Guarda un registro por:
- año
- mes
- mediador

Incluye todos los KPIs mensuales y la producción por ramo.

### Tabla `annual_objectives`
Guarda por año:
- regras de rápel anual
- reglas de rápel cuatrimestral
- grados

## Reglas implementadas

### Rapel anual
Se evalúa sobre:
- Vida acumulada
- Salud acumulada
- Crecimiento medio
- Devolución media de recibos

### Rapel cuatrimestral
Se calcula en tres bloques:
- Enero - Abril
- Mayo - Agosto
- Septiembre - Diciembre

### Grados
Se evalúan sobre métricas configurables.

## Cómo arrancarlo

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`

## Cómo pasar de demo a producción

1. Crear proyecto en Supabase
2. Ejecutar `sql/schema.sql`
3. Añadir las variables del `.env.example` a `.env.local`
4. Sustituir en las rutas API el uso de `mockMetrics` por lecturas/escrituras reales con `getSupabaseAdmin()`
5. Añadir autenticación si el panel va a tener acceso multiusuario

## Recomendaciones de evolución

- Añadir login con Supabase Auth
- Añadir validación con Zod
- Añadir tablas avanzadas con filtros y exportación a Excel
- Añadir carga masiva desde ARGOS en CSV/Excel
- Añadir drill-down por ramo y mediador
- Añadir alertas de tendencia por email o WhatsApp interno
