# Análisis Vertical y Horizontal del Balance General

Este módulo proporciona componentes y servicios para realizar análisis vertical y horizontal del balance general de empresas.

## Estructura de Archivos

```
AnalisisVerticalHorizontal/
├── README.md                         # Este archivo
├── index.js                          # Exportaciones centralizadas
├── FiltrosAnalisis.jsx              # Componente de filtros
├── TablaAnalisisVertical.jsx       # Tabla de resultados verticales
└── TablaAnalisisHorizontal.jsx     # Tabla de resultados horizontales

services/AnalisisVerticalHorizontal/
└── AnalisisBalanceService.jsx       # Servicio para llamadas a la API

hooks/AnalisisVerticalHorizontal/
└── useAnalisisBalance.jsx           # Hook personalizado

pages/AnalisisVerticalHorizontal/
└── AnalisisBalance.jsx              # Página principal
```

## Características

### Análisis Vertical
- Muestra la participación porcentual de cada cuenta respecto al total de su sección (Activo, Pasivo o Patrimonio)
- Denominadores configurables por sección
- Filtrado opcional por sección
- **Diferenciación visual entre cuentas submayor y detalle**
  - **Submayor**: Cuentas totalizadoras (negrita, fondo gris, etiqueta "Submayor")
  - **Detalle**: Cuentas específicas (indentadas, con conectores visuales)
- Visualización con barras de progreso (solo para cuentas detalle)
- Exportación a CSV

### Análisis Horizontal
- Compara el balance entre dos periodos diferentes
- Muestra variaciones absolutas y porcentuales
- **Diferenciación visual entre cuentas submayor y detalle**
  - **Submayor**: Totales en negrita con mayor tamaño de fuente
  - **Detalle**: Cuentas con indentación jerárquica
- Indicadores visuales de tendencia (subida/bajada)
- Resalta cambios significativos (> 10%)
- Exportación a CSV

## Roles y Permisos

### Permiso Requerido
- `analizar_balance`: Necesario para acceder a esta funcionalidad

### Comportamiento por Rol

#### Analista Financiero
- Usa automáticamente la empresa asignada al usuario
- No necesita seleccionar empresa
- Solo ve datos de su empresa

#### Administrador
- Debe seleccionar una empresa de un listado
- Puede ver datos de cualquier empresa
- Tiene acceso completo a todas las funcionalidades

## Uso

### Importar y usar la página completa

```jsx
import AnalisisBalancePage from '@/pages/AnalisisVerticalHorizontal/AnalisisBalance'

// En tus rutas
<Route
  path="analisis-balance"
  element={
    <PermissionRoute requiredPermissions={["analizar_balance"]}>
      <AnalisisBalancePage />
    </PermissionRoute>
  }
/>
```

### Usar componentes individuales

```jsx
import { 
  FiltrosAnalisis, 
  TablaAnalisisVertical, 
  TablaAnalisisHorizontal 
} from '@/components/AnalisisVerticalHorizontal'

// Usar en tu componente personalizado
```

### Usar el hook personalizado

```jsx
import { useAnalisisBalance } from '@/hooks/AnalisisVerticalHorizontal/useAnalisisBalance'

function MiComponente() {
  const {
    analisisVertical,
    analisisHorizontal,
    loading,
    error,
    obtenerAnalisisVertical,
    obtenerAnalisisHorizontal,
    exportarCSV,
    esAdministrador,
  } = useAnalisisBalance()

  // Análisis vertical
  const handleAnalisisVertical = async () => {
    const datos = await obtenerAnalisisVertical({
      periodo_id: 1,
      empresa_id: 2, // Solo si eres admin
      seccion: 'ACTIVO' // Opcional
    })
  }

  // Análisis horizontal
  const handleAnalisisHorizontal = async () => {
    const datos = await obtenerAnalisisHorizontal({
      periodo_base_id: 1,
      periodo_comp_id: 2,
      empresa_id: 3 // Solo si eres admin
    })
  }

  // Exportar
  const handleExportar = () => {
    exportarCSV(analisisVertical.lineas, 'vertical', 'mi_analisis.csv')
  }
}
```

## Endpoints de API

### Análisis Vertical
```
GET /api/analisis/balance/vertical
Parámetros:
  - periodo_id: number (requerido)
  - empresa_id: number (requerido para admin)
  - seccion: string (opcional: 'ACTIVO', 'PASIVO', 'PATRIMONIO')
```

### Análisis Horizontal
```
GET /api/analisis/balance/horizontal
Parámetros:
  - periodo_base_id: number (requerido)
  - periodo_comp_id: number (requerido)
  - empresa_id: number (requerido para admin)
```

## Estructura de Datos

### Respuesta Análisis Vertical
```json
{
  "success": true,
  "data": {
    "empresa_id": 1,
    "periodo_id": 2,
    "totales": {
      "ACTIVO": 1000000.00,
      "PASIVO": 600000.00,
      "PATRIMONIO": 400000.00
    },
    "lineas": [
      {
        "catalogo_cuenta_id": 5,
        "codigo": "1.1",
        "nombre": "Caja y Bancos",
        "seccion": "ACTIVO",
        "monto": 150000.00,
        "denominador": 1000000.00,
        "porcentaje": 0.15
      }
    ]
  }
}
```

### Respuesta Análisis Horizontal
```json
{
  "success": true,
  "data": {
    "empresa_id": 1,
    "periodo_base_id": 1,
    "periodo_comp_id": 2,
    "lineas": [
      {
        "catalogo_cuenta_id": 5,
        "codigo": "1.1",
        "nombre": "Caja y Bancos",
        "seccion": "ACTIVO",
        "monto_base": 100000.00,
        "monto_comp": 150000.00,
        "variacion_abs": 50000.00,
        "variacion_pct": 0.50
      }
    ]
  }
}
```

## Personalización

### Diferenciación de Cuentas: Submayor vs Detalle

El sistema diferencia automáticamente entre cuentas de submayor y detalle:

#### Detección Automática
1. **Por campo `es_calculada`**: Si el backend envía este campo, se usa directamente
2. **Por patrón de código**: Si no existe el campo, se detecta por el patrón. Soporta dos formatos:

**Formato Numérico (4 dígitos):**
- **MAYOR** (Submayor): Termina en "000" → `1000`, `2000`, `3000`
- **SUB_MAYOR** (Submayor): Termina en "00" → `1100`, `1200`, `2100`
- **DETALLE**: Termina en "0" → `1110`, `1120`, `1210`
- **MOVIMIENTO**: No termina en "0" → `1111`, `1234`, `1235`

**Formato con Puntos:**
- **MAYOR** (Submayor): Un solo dígito → `1`, `2`, `3`
- **SUB_MAYOR** (Submayor): Dos niveles → `1.1`, `1.2`, `2.1`
- **DETALLE**: Tres o más niveles → `1.1.1`, `1.1.2`, `1.2.1`
- **MOVIMIENTO**: Cuatro o más niveles → `1.1.1.01`, `1.1.1.02`

#### Estilos Visuales

**Cuentas Mayor (Nivel 1):**
- Fondo gris claro (`bg-gray-50`)
- Texto en negrita
- Etiqueta morada "Mayor" (`bg-purple-100`)
- Sin indentación
- Monto en tamaño de fuente más grande
- Sin barra de progreso (en análisis vertical)

**Cuentas Submayor (Nivel 2):**
- Fondo gris claro (`bg-gray-50`)
- Texto en negrita
- Etiqueta azul "Submayor" (`bg-blue-100`)
- Indentación mínima o nivel 1
- Monto en tamaño de fuente más grande
- Sin barra de progreso (en análisis vertical)

**Cuentas Detalle:**
- Fondo blanco
- Texto normal
- Indentación según nivel (16px por nivel)
- Conector visual `└─` antes del nombre
- Monto en tamaño normal
- Barra de progreso visual (en análisis vertical)

#### Ejemplo de Jerarquía Visual

**Con Formato Numérico (4 dígitos):**
```
1000         ACTIVO                          $1,000,000.00  [Mayor 🟣]
  └─ 1100    Activo Corriente                  $600,000.00  [Submayor 🔵]
    └─ 1110    Efectivo y Equivalentes         $200,000.00  [Detalle]
      └─ 1111    Caja                            $50,000.00  [Movimiento]
      └─ 1112    Bancos                         $150,000.00  [Movimiento]
    └─ 1120    Cuentas por Cobrar              $400,000.00  [Detalle]
      └─ 1121    Clientes                       $350,000.00  [Movimiento]
      └─ 1122    Deudores                        $50,000.00  [Movimiento]
```

**Con Formato de Puntos:**
```
1            ACTIVO                          $1,000,000.00  [Mayor 🟣]
  └─ 1.1     Activo Corriente                  $600,000.00  [Submayor 🔵]
    └─ 1.1.1   Efectivo y Equivalentes         $200,000.00  [Detalle]
      └─ 1.1.1.01  Caja                          $50,000.00  [Movimiento]
      └─ 1.1.1.02  Bancos                       $150,000.00  [Movimiento]
    └─ 1.1.2   Cuentas por Cobrar              $400,000.00  [Detalle]
      └─ 1.1.2.01  Clientes                     $350,000.00  [Movimiento]
      └─ 1.1.2.02  Deudores                      $50,000.00  [Movimiento]
```

**Leyenda:**
- 🟣 **Mayor** = Morado (`purple`) - Nivel principal (1, 2, 3 o 1000, 2000, 3000)
- 🔵 **Submayor** = Azul (`blue`) - Nivel secundario (1.1, 1.2 o 1100, 1200)
- **Detalle** = Sin etiqueta - Cuentas de detalle
- **Movimiento** = Sin etiqueta - Cuentas de movimiento

### Colores por Sección
Los colores se asignan automáticamente según la sección:
- **ACTIVO**: Azul (`bg-blue-100 text-blue-800`)
- **PASIVO**: Rojo (`bg-red-100 text-red-800`)
- **PATRIMONIO**: Verde (`bg-green-100 text-green-800`)

### Formato de Moneda
Por defecto usa formato de dólares estadounidenses (USD). Para cambiar:

```jsx
const formatearMoneda = (valor) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // Cambiar aquí
    minimumFractionDigits: 2,
  }).format(valor)
}
```

### Umbral de Variación Significativa
El umbral para resaltar variaciones significativas es del 10%. Para cambiar:

```jsx
// En TablaAnalisisHorizontal.jsx
const esVariacionSignificativa = variacionPct !== null && Math.abs(variacionPct) > 0.1 // Cambiar 0.1 (10%)
```

## Futuras Mejoras

1. **Ventana abierta a cuenta_concepto**: El backend ya está preparado para usar mapeos de cuentas a conceptos financieros en lugar de códigos fijos (1, 2, 3).

2. **Análisis por periodos múltiples**: Actualmente compara 2 periodos, pero puede extenderse para comparar 3 o más periodos simultáneamente.

3. **Gráficos**: Agregar visualizaciones gráficas (barras, líneas, torta) para análisis más visual.

4. **Alertas automáticas**: Configurar alertas cuando haya variaciones mayores a ciertos umbrales.

5. **Comparación con benchmarks**: Integrar con datos de benchmarks del sector para comparar.

## Soporte

Para preguntas o problemas relacionados con este módulo, contacta al equipo de desarrollo.

## Licencia

Este código es propiedad de FinFront y está protegido por las políticas de confidencialidad de la empresa.

