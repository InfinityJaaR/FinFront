# Análisis de base de datos para estados financieros
_Exported on 11/7/2025 at 09:17:58 CST from Cursor (1.7.53)_

---

**User**

podrias hacer un analisis detallado del estado actual de la bas e de datos, quiero que comprendas bien las relaciones y datos de cada tabla. La nueva funcionalidad que quiero implementar es la de analisi vertical y horizontal de los estados financieros de la empresa, en este caso quiero trabajar solo con el balance general. El analisi vertical se puede realizar con un solo balance, pero para el horizontal se requiere el de diferenrentes periodos. Quiero que analices el estado actual y solo propongas (no codifiques) las modificaciones o nuevas tablas y relaciones necesarias

---

**Cursor**

Voy a inspeccionar la estructura actual: migraciones, modelos y seeders para entender tablas, relaciones y datos antes de proponer cambios para el análisis vertical y horizontal del balance general. Ahora ejecuto búsquedas y listados clave en paralelo.

Voy a abrir las migraciones principales de `estados`, `detalles_estado`, `periodos`, `empresas` y `catalogo_cuentas` para mapear con precisión el esquema y las relaciones clave.

Acabo de mapear las migraciones y modelos clave para entender la estructura y relaciones actuales; ahora te describo el estado actual y luego propongo los cambios necesarios para soportar análisis vertical y horizontal del Balance General.

### Estado actual de la base de datos (tablas y relaciones)

- Empresa y rubro
  - Empresas (`empresas`): pertenecen a un `rubro` y tienen código único, nombre y descripción.
  - Rubros (`rubros`): catálogo de industrias; además trae columnas con promedios de benchmark y una tabla más normalizada `benchmarks_rubro`.

- Periodo
  - Periodos (`periodos`): año único global más `fecha_inicio` y `fecha_fin`. Funcionan como dimensión temporal compartida por todas las empresas.

- Estados financieros
  - Estados (`estados`): encabezado del estado (por empresa, periodo y tipo). Único por empresa+periodo+tipo.

```14:26:/home/nerduniverse/FinBack/database/migrations/2025_10_12_231634_create_estados_table.php
Schema::create('estados', function (Blueprint $table) {
    // ...
    $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
    $table->foreignId('periodo_id')->constrained('periodos')->onDelete('cascade');
    $table->enum('tipo', ['BALANCE', 'RESULTADOS']);
    $table->unique(['empresa_id', 'periodo_id', 'tipo']);
    // ...
});
```

  - Detalles de estado (`detalles_estado`): líneas asociadas a un estado con referencia a una cuenta del catálogo y un monto (opcionalmente `usar_en_ratios`).

```18:26:/home/nerduniverse/FinBack/database/migrations/2025_10_12_231728_create_detalles_estado_table.php
$table->foreignId('estado_id')->constrained('estados')->onDelete('cascade');
$table->foreignId('catalogo_cuenta_id')->constrained('catalogo_cuentas')->onDelete('restrict');
$table->decimal('monto', 18, 2);
$table->unique(['estado_id', 'catalogo_cuenta_id']);
```

- Catálogo de cuentas y mapeos
  - Catálogo de cuentas (`catalogo_cuentas`): por empresa, con código único dentro de empresa, `tipo` (ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO), y flag `es_calculada`. Además, columna `estado_financiero` para clasificar si se usa en balance o resultados.

```25:29:/home/nerduniverse/FinBack/database/migrations/2025_10_12_231615_create_catalogo_cuentas_table.php
$table->enum('tipo', ['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO']);
$table->boolean('es_calculada')->default(0);
```

```14:18:/home/nerduniverse/FinBack/database/migrations/2025_11_03_043531_add_estado_financiero_to_catalogo_cuentas_table.php
Schema::table('catalogo_cuentas', function (Blueprint $table) {
    $table->enum('estado_financiero', ['BALANCE_GENERAL', 'ESTADO_RESULTADOS', 'NINGUNO'])
          ->default('NINGUNO')
          ->after('es_calculada');
});
```

  - Conceptos financieros (`conceptos_financieros`): catálogo de conceptos abstractos (p. ej., “Activo Corriente”), con `codigo` opcional agregado posteriormente.
  - Mapeo cuenta–concepto (`cuenta_concepto`): pivote N:M entre cuentas específicas de la empresa y conceptos financieros (sin peso/porcentaje).
  - Relación cuenta–concepto está disponible también en los modelos (`CatalogoCuenta::conceptos()` y `ConceptoFinanciero::cuentas()`).

- Ratios (contexto general)
  - Definiciones de ratio (`ratios_definiciones`), sus componentes (`ratio_componentes` con rol y orden) y valores por empresa/periodo (`ratios_valores`).
  - No son directamente necesarios para el Balance, pero el campo `usar_en_ratios` en `detalles_estado` ya prepara los datos para cálculos.

- Seguridad
  - Usuarios, roles y permisos: estructura estándar N:M, con `empresa_id` opcional en `users`.

### Observaciones clave para el Balance General

- Ya existe una separación por tipo de estado en `estados.tipo = 'BALANCE'` y a nivel de cuentas por `catalogo_cuentas.estado_financiero = 'BALANCE_GENERAL'`. Hay una pequeña inconsistencia de nomenclatura (BALANCE vs BALANCE_GENERAL).
- La agregación de líneas para presentación y análisis depende de:
  - `catalogo_cuentas.tipo` (ACTIVO, PASIVO, PATRIMONIO).
  - El mapeo N:M a `conceptos_financieros`, que no tiene jerarquía ni sección explícita de balance.
- Para análisis horizontal, el modelo ya distingue periodos por `periodo_id` y empresas, con unicidad por cuenta en cada estado/periodo. Es suficiente para comparar montos entre periodos.
- Para análisis vertical, se requiere identificar la base de denominación (Total Activo y Total Pasivo+Patrimonio). Hoy no hay campos que indiquen explícitamente cuáles conceptos representan totales o cómo jerarquizar para sumatorias intermedias.

### Propuestas de mejora (sin codificar)

- Consistencia y gobierno de datos
  - Unificar nomenclatura de estados:
    - Opción A: cambiar `estados.tipo` a `['BALANCE_GENERAL','ESTADO_RESULTADOS']`.
    - Opción B: cambiar `catalogo_cuentas.estado_financiero` a `['BALANCE','RESULTADOS','NINGUNO']`.
  - Agregar índices para consultas de análisis:
    - Índices no únicos: `detalles_estado(estado_id)`, `detalles_estado(catalogo_cuenta_id)`, `estados(empresa_id, periodo_id, tipo)`, `catalogo_cuentas(empresa_id, estado_financiero, tipo)`.

- Modelo semántico para el Balance (para vertical y presentación)
  - En `conceptos_financieros`:
    - Añadir `estado_financiero` enum `['BALANCE','RESULTADOS']` para filtrar conceptos del balance.
    - Añadir `seccion_balance` enum `['ACTIVO','PASIVO','PATRIMONIO']`.
    - Añadir `nivel` (smallint) y `orden_presentacion` (smallint) para jerarquía y orden.
    - Añadir `concepto_padre_id` (FK a `conceptos_financieros`) para modelar jerarquías (p. ej., Activo → Activo Corriente → Caja).
    - Añadir `es_total` boolean para marcar subtotales y totales (p. ej., “Total Activo”).
  - Beneficio: define claramente las bases para el análisis vertical y la estructura de presentación del Balance.

- Mapeo cuenta–concepto con control de distribución y vigencia
  - En `cuenta_concepto`:
    - Añadir `participacion` DECIMAL(5,4) default 1.0000 para permitir asignar una cuenta a varios conceptos sin doble contabilidad (suma de participaciones por cuenta y estado financiero ≤ 1).
    - Añadir `vigente_desde` y `vigente_hasta` (DATE o YEAR) para versionar mapeos cuando cambien a lo largo del tiempo (importante para horizontal histórico).
  - Beneficio: evita sobreconteos y permite comparar periodos con cambios de plan de cuentas.

- Capa de agregación a nivel de concepto (clave para ambos análisis)
  - Nueva tabla: `estados_conceptos` (o `saldos_concepto`)
    - Columnas: `empresa_id` (FK), `periodo_id` (FK), `estado_id` (FK), `concepto_id` (FK), `monto` DECIMAL(18,2), `fuente` enum `['CALCULADO','MANUAL']`, `calculado_en` timestamp.
    - Restricción: UNIQUE (`empresa_id`, `periodo_id`, `concepto_id`, `estado_id`).
    - Llenado: agregado de `detalles_estado` x `cuenta_concepto` aplicando `participacion`.
  - Alternativa sin persistencia: vista/materialized view que agregue al vuelo; persistir puede ser útil para auditoría, performance y comparabilidad horizontal estable.

- Soporte explícito para análisis vertical del Balance
  - Nueva tabla opcional: `analisis_vertical_balance`
    - Columnas: `empresa_id`, `periodo_id`, `estado_id`, `concepto_id`, `porcentaje` DECIMAL(9,4), `monto` DECIMAL(18,2), `denominador_concepto_id` (FK al concepto base, p. ej., “Total Activo” o “Total Pasivo+Patrimonio”), `denominador_monto` DECIMAL(18,2), `calculado_en`.
    - UNIQUE (`empresa_id`, `periodo_id`, `concepto_id`, `estado_id`).
  - Requiere marcar en `conceptos_financieros` cuáles son los conceptos base de denominador (con `es_total` y `seccion_balance`).

- Soporte explícito para análisis horizontal del Balance
  - Nueva tabla opcional: `analisis_horizontal_balance`
    - Columnas: `empresa_id`, `concepto_id`, `periodo_base_id`, `periodo_comp_id`, `monto_base`, `monto_comp`, `variacion_abs` DECIMAL(18,2), `variacion_pct` DECIMAL(9,4), `calculado_en`.
    - UNIQUE (`empresa_id`, `concepto_id`, `periodo_base_id`, `periodo_comp_id`).
  - Cálculo: sobre `estados_conceptos` para asegurar consistencia conceptual entre periodos (independiente de cambios en cuentas).

- Consideraciones adicionales
  - Validar que `periodos.anio` único global es suficiente (si necesitaras periodos no anuales o múltiples cierres por año, considerar `tipo_periodo` o remover la unicidad global y definir unicidad por `(anio, tipo_periodo)`).
  - Si la multi‑moneda fuese relevante, añadir `moneda_id` y `tasa_cambio` en `estados` y/o `detalles_estado`.

### Datos mínimos necesarios por tabla para el Balance

- Para vertical:
  - `conceptos_financieros`: `estado_financiero`, `seccion_balance`, `nivel`, `orden_presentacion`, `es_total`, `concepto_padre_id`.
  - `cuenta_concepto`: `participacion`, vigencias.
  - `estados_conceptos`: agregados por concepto para base de denominadores y porcentajes.
- Para horizontal:
  - `estados_conceptos` como base de comparación entre `periodo_id` distintos.
  - Opcional `analisis_horizontal_balance` para persistir snapshots de comparaciones frecuentes.

### Riesgos actuales si no se ajusta el modelo
- Doble conteo en agregaciones si una cuenta se mapea a varios conceptos (no hay `participacion`).
- Falta de jerarquía/orden de conceptos para presentar el Balance y definir totales/denominadores.
- Inconsistencia de nomenclatura (`BALANCE` vs `BALANCE_GENERAL`) puede complicar filtros/validaciones.

Breve resumen
- El modelo actual ya permite cargar Balances por empresa y periodo, y distinguir cuentas de Balance.
- Para análisis vertical y horizontal robusto, propongo:
  - Enriquecer `conceptos_financieros` con jerarquía/sección/orden/totales.
  - Añadir `participacion` y vigencias al pivote `cuenta_concepto`.
  - Crear una capa de agregación por concepto (`estados_conceptos`) y, opcionalmente, tablas de resultados (`analisis_vertical_balance`, `analisis_horizontal_balance`).
  - Unificar enums de tipo de estado para coherencia.

```php
Schema::create('estados', function (Blueprint $table) {
    // ...
    $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
    $table->foreignId('periodo_id')->constrained('periodos')->onDelete('cascade');
    $table->enum('tipo', ['BALANCE', 'RESULTADOS']);
    $table->unique(['empresa_id', 'periodo_id', 'tipo']);
    // ...
});
```

```php
$table->foreignId('estado_id')->constrained('estados')->onDelete('cascade');
$table->foreignId('catalogo_cuenta_id')->constrained('catalogo_cuentas')->onDelete('restrict');
$table->decimal('monto', 18, 2);
$table->unique(['estado_id', 'catalogo_cuenta_id']);
```

```php
$table->enum('tipo', ['ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO']);
$table->boolean('es_calculada')->default(0);
```

```php
Schema::table('catalogo_cuentas', function (Blueprint $table) {
    $table->enum('estado_financiero', ['BALANCE_GENERAL', 'ESTADO_RESULTADOS', 'NINGUNO'])
          ->default('NINGUNO')
          ->after('es_calculada');
});
```

---

**User**

Okay, esta es mi propuesta, considera que esta funcionalidad estara disponible para un analista financiero, es decir para alguien que ya tiene asignada una empresa. Actualmente para cada empresa se guarda un catalogo, y la tabla estado, (que puede ser el balance general) tiene un detalle del estado relacionado al catalogo, al guadar un estado financiero, el sistema totaliza automaticamente las cuentas principales, como el activo, pasivo y patrimonio, por tanto, no es necesario hacerlo por aparte. Con estp ya es posible realizar el analisis vertical, y con los estados de diferentes periodos, el posible realizar el analisis horizontal, analiza esta alternativa, y verifica como podria implementarse en el sistema (sin codificar)

---

**Cursor**

### Evaluación de tu alternativa
- **Viable** con el modelo actual: `estados` (tipo BALANCE) + `detalles_estado` por cuenta del `catalogo_cuentas`. Ya puedes:
  - **Vertical**: dividir cada línea entre el total del Balance (p. ej., “Activos totales”). 
  - **Horizontal**: comparar montos de la misma cuenta entre periodos del mismo `empresa_id`.
- Requisitos para que funcione bien:
  - El catálogo de la empresa se mantiene consistente en el tiempo (mismos `catalogo_cuenta_id`/`codigo` para líneas comparables).
  - Al guardar el estado, quedan grabadas las líneas de totales (p. ej., “Activos totales”, “Pasivo total”, “Patrimonio”), porque son el denominador del vertical.
  - `estados` garantiza unicidad por `empresa_id + periodo_id + tipo` (ya existe).

### Cómo implementarlo (sin codificar)

#### 1) Definir “denominadores” del análisis vertical
- **Configuración funcional** (sin tocar BD): acordar cuáles cuentas del catálogo serán base:
  - Denominador principal: “Activos totales” (ó “Pasivo total + Patrimonio”, que debe ser igual).
  - Opcionales por sección para desglose: “Activo”, “Pasivo”, “Patrimonio”.
- Fuente de verdad:
  - Si ya existen esas cuentas y se totalizan automáticamente, úsalas como denominador por `catalogo_cuenta_id` o por `codigo`.
  - Para robustez, documenta estos IDs/códigos en una pequeña tabla de configuración o en seeders de parámetros (solo si ves riesgo de cambios en nombres).

#### 2) Flujo de cálculo al guardar un Balance (reutilizando lo que ya haces)
- Guardar detalles.
- Totalizar automáticamente las cuentas principales y persistir sus líneas.
- Validar integridad:
  - “Activos totales” = suma de todas las cuentas de activo.
  - “Pasivo total + Patrimonio” = “Activos totales”.
- Marcar qué líneas participan en análisis (si ya usas `usar_en_ratios`, vale como bandera para excluir líneas extraordinarias si quieres).

#### 3) Análisis vertical (por un periodo)
- Entrada: `empresa_id`, `periodo_id` (ó `anio`), `tipo=BALANCE`.
- Pasos:
  - Leer `estado` y sus `detalles_estado` + `catalogo_cuentas`.
  - Obtener el monto del denominador (p. ej., la fila “Activos totales”).
  - Para cada línea del balance: porcentaje = monto_línea / monto_denominador.
- Consideraciones:
  - Manejar denominador = 0 (mostrar 0 o “N/D”).
  - Redondeo configurable (p. ej., 2 o 4 decimales).
  - Opción de mostrar por secciones (ACTIVO, PASIVO, PATRIMONIO) ordenadas por `codigo`.

#### 4) Análisis horizontal (comparación de periodos)
- Entrada: `empresa_id`, `periodo_base_id`, `periodo_comp_id` (ó múltiples periodos).
- Pasos:
  - Traer `detalles_estado` de ambos periodos para el mismo `estado.tipo = BALANCE`.
  - Empatar por `catalogo_cuenta_id` (recomendado) o por `codigo`.
  - Calcular:
    - variación_abs = monto_comp − monto_base
    - variación_pct = (variación_abs / monto_base) cuando monto_base ≠ 0
- Consideraciones:
  - Cuentas nuevas/eliminadas entre periodos: reportar como “alta/baja” (monto_base=0 o monto_comp=0).
  - Permitir filtros por sección (`catalogo_cuentas.tipo`) y ocultar totales si solo quieres variaciones de líneas “hoja”.

#### 5) Endpoints/servicios sugeridos (solo diseño)
- Vertical:
  - GET `empresas/{empresa}/balances/vertical?periodo_id=...`
  - Respuesta: lista de líneas con `catalogo_cuenta_id`, `codigo`, `nombre`, `monto`, `porcentaje`, `seccion`.
- Horizontal:
  - GET `empresas/{empresa}/balances/horizontal?periodo_base_id=...&periodo_comp_id=...`
  - Respuesta: lista de líneas con `catalogo_cuenta_id`, `codigo`, `nombre`, `monto_base`, `monto_comp`, `variacion_abs`, `variacion_pct`, `seccion`.

#### 6) Presentación (UI para analista)
- Vertical:
  - Tabla jerarquizada por sección (ACTIVO/PASIVO/PATRIMONIO), barra de porcentaje sobre el denominador, opción de ordenar por % descendente.
- Horizontal:
  - Tabla con columnas periodo_base vs periodo_comp, flechas de tendencia, filtros por secciones y búsqueda por `codigo`/`nombre`.
  - Opción de incluir/excluir totales en el listado principal.

#### 7) Performance e índices
- Añadir (si no existen) índices no únicos:
  - `estados (empresa_id, periodo_id, tipo)`.
  - `detalles_estado (estado_id)` y `detalles_estado (catalogo_cuenta_id)`.
  - `catalogo_cuentas (empresa_id, tipo, estado_financiero)`.
- Si la data crece:
  - Crear una vista (o “materialized” vía job) para vertical/horizontal frecuentes, pero no es estrictamente necesario al inicio.

#### 8) Reglas de negocio y bordes
- Cambios de catálogo en el tiempo:
  - Si `catalogo_cuenta_id` se mantiene, los históricos no se rompen. Renombres no afectan; re-clasificaciones sí pueden cambiar secciones comparadas (documentarlo).
- Signos negativos: definir si se muestran con paréntesis y cómo impactan el % vertical.
- Redondeos: estándar contable (banco a 2 decimales en montos; 2–4 en %).
- Auditoría: guardar quién y cuándo totalizó/calculó (ya que totalizas al guardar, registrar timestamp/usuario en el `estado` es útil).

### ¿Hace falta cambiar la base?
- Con tu enfoque, **no es obligatorio** crear tablas nuevas para empezar. Bastará con:
  - Documentar qué cuentas son denominadores.
  - Asegurar que los totales se persistan en `detalles_estado`.
  - Añadir índices para velocidad y coherencia.
- Mejoras opcionales (a futuro):
  - Pequeña tabla de “parámetros de análisis” por empresa para declarar `catalogo_cuenta_id` de denominadores (evita depender de nombres).
  - Guardar “snapshots” de resultados de análisis si necesitas auditoría/velocidad en periodos con mucha data.

En resumen
- Tu alternativa es sólida y aprovecha bien el modelo actual.
- Implementación: servicios de lectura que usan las líneas y totales ya guardados para calcular porcentajes (vertical) y variaciones (horizontal), con reglas claras de denominadores y emparejamiento por cuenta entre periodos.
- Cambios mínimos recomendados: índices y una parametrización de denominadores para mayor robustez.

---

**User**

Muy bien, quiero que prepares todo lo necesario en el back end, para que esto sea posible, incuido un permiso para el analista financiero y administrador, y los endpoints necesarios para este permiso, considera que si quien lo sopicita es un analista se debe obtener automaticamente el id de su empresa para obrener los datos del balance, si es un administrador, el id de la empresa vendra desde front end. Ademas, de momento, los denominadores seran fijos como Activo, Pasivo, Patrimonio, pero quiero que dejes para ventaja abierta para en un futuro relacionarlos a cuenta_concepto. 

---

**Cursor**

Voy a revisar rutas, controladores y modelos de permisos/roles para diseñar e implementar endpoints y autorización (analista vs administrador). Luego crearé las tareas y comenzaré con los cambios en código.

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Rol;
use App\Models\Permiso;
use Illuminate\Support\Facades\DB;

class PermisoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
         $permisos = [
            // Seguridad
            ['name' => 'manage_users', 'description' => 'Gestionar usuarios'],
            
            // Gestión de Empresas
            ['name' => 'gestionar_rubros', 'description' => 'Permite crear, editar y eliminar rubros empresariales.'],
            ['name' => 'gestionar_empresas', 'description' => 'Permite crear, editar y eliminar empresas.'],
            ['name' => 'gestionar_ratios_definicion', 'description' => 'Permite crear, editar y eliminar definiciones de ratios financieros.'],

            //Gestión de datos financieros
            ['name' => 'gestionar_catalogo_cuentas', 'description' => 'Permite cargar, editar y eliminar catálogo de cuentas contables de las empresas.'],

            //Para ratios
            ['name' => 'ver_ratios', 'description' => 'Permite consultar los ratios financieros de una empresa.'],
            ['name' => 'calcular_ratios', 'description' => 'Permite generar ratios financieros para una empresa.'],


            //Analisis y reportes
            ['name' => 'analizar_balance', 'description' => 'Consultar análisis vertical y horizontal del balance general.'],

            //Proyección de Ventas
        ];

        foreach ($permisos as $permiso) {
            Permiso::updateOrCreate(
                ['name' => $permiso['name']],
                [
                    'description' => $permiso['description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // Asignar permisos a roles
        $rolesPermisos = [
            'Administrador' => [
                'manage_users',
                'gestionar_rubros',
                'gestionar_empresas',
                'gestionar_ratios_definicion',
                'gestionar_catalogo_cuentas',
                'ver_ratios',
                'calcular_ratios',
                'analizar_balance',
            ],
            'Analista Financiero' => [
                // Agregar permisos específicos para Analista Financiero
                'gestionar_catalogo_cuentas',
                'ver_ratios',
                'calcular_ratios',
                'analizar_balance',
            ],
            'Inversor' => [
                // Agregar permisos específicos para Inversor
                'ver_ratios',                
            ],

        ];

        foreach ($rolesPermisos as $rolNombre => $permisosNombres) {
            $rol = Rol::where('name', $rolNombre)->first();
            if ($rol) {
                $permisoIds = Permiso::whereIn('name', $permisosNombres)->pluck('id')->toArray();
                foreach ($permisoIds as $permisoId) {
                    // Inserta en la tabla intermedia con timestamps
                    DB::table('role_permission')->updateOrInsert(
                        ['role_id' => $rol->id, 'permission_id' => $permisoId],
                        ['created_at' => now(), 'updated_at' => now()]
                    );
                }
            }
        }
    }
}

```

```php
<?php

namespace App\Http\Controllers;

use App\Models\Estado;
use App\Models\DetalleEstado;
use App\Models\CatalogoCuenta;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnalisisBalanceController extends Controller
{
    /**
     * Análisis vertical del Balance General.
     * - Si el solicitante es Analista, usa su empresa_id.
     * - Si es Administrador, debe enviar empresa_id.
     * Denominadores actuales: ACTIVO (1), PASIVO (2), PATRIMONIO (3).
     */
    public function vertical(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'periodo_id' => 'required|exists:periodos,id',
            // empresa_id es requerido sólo para administradores (se valida más abajo)
            'seccion' => 'sometimes|in:ACTIVO,PASIVO,PATRIMONIO',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $empresaId = $this->resolverEmpresaId($request);
        if (!$empresaId) {
            return response()->json([
                'success' => false,
                'message' => 'empresa_id es requerido para administradores o el analista no tiene empresa asignada.'
            ], 422);
        }

        $estado = Estado::with(['detalles.catalogoCuenta'])
            ->where('empresa_id', $empresaId)
            ->where('periodo_id', $request->periodo_id)
            ->where('tipo', 'BALANCE')
            ->first();

        if (!$estado) {
            return response()->json([
                'success' => false,
                'message' => 'No existe un Balance para la empresa y periodo indicados.'
            ], 404);
        }

        // Construir mapa de totales por seccion usando códigos padre 1,2,3
        $totalesSeccion = [
            'ACTIVO' => 0.0,
            'PASIVO' => 0.0,
            'PATRIMONIO' => 0.0,
        ];

        foreach ($estado->detalles as $detalle) {
            $cuenta = $detalle->catalogoCuenta;
            if (!$cuenta) { continue; }
            if (in_array($cuenta->codigo, ['1','2','3'])) {
                if ($cuenta->codigo === '1') { $totalesSeccion['ACTIVO'] = (float)$detalle->monto; }
                if ($cuenta->codigo === '2') { $totalesSeccion['PASIVO'] = (float)$detalle->monto; }
                if ($cuenta->codigo === '3') { $totalesSeccion['PATRIMONIO'] = (float)$detalle->monto; }
            }
        }

        $seccionFiltro = $request->input('seccion');
        $resultados = [];

        foreach ($estado->detalles as $detalle) {
            $cuenta = $detalle->catalogoCuenta;
            if (!$cuenta) { continue; }

            // Limitar a balance general
            if ($cuenta->estado_financiero !== 'BALANCE_GENERAL') { continue; }

            // Determinar seccion por tipo de cuenta (ACTIVO/PASIVO/PATRIMONIO)
            $seccion = $cuenta->tipo;
            if (!isset($totalesSeccion[$seccion])) { continue; }
            if ($seccionFiltro && $seccion !== $seccionFiltro) { continue; }

            $denominador = (float)($totalesSeccion[$seccion] ?? 0);
            $porcentaje = $denominador != 0.0 ? ((float)$detalle->monto) / $denominador : null;

            $resultados[] = [
                'catalogo_cuenta_id' => $cuenta->id,
                'codigo' => $cuenta->codigo,
                'nombre' => $cuenta->nombre,
                'seccion' => $seccion,
                'monto' => (float)$detalle->monto,
                'denominador' => $denominador,
                'porcentaje' => $porcentaje,
            ];
        }

        // Orden por código para una presentación consistente
        usort($resultados, function ($a, $b) {
            return strcmp($a['codigo'], $b['codigo']);
        });

        return response()->json([
            'success' => true,
            'data' => [
                'empresa_id' => $empresaId,
                'periodo_id' => (int)$request->periodo_id,
                'totales' => $totalesSeccion,
                'lineas' => $resultados,
            ],
        ]);
    }

    /**
     * Análisis horizontal del Balance General entre dos periodos.
     */
    public function horizontal(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'periodo_base_id' => 'required|exists:periodos,id',
            'periodo_comp_id' => 'required|exists:periodos,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        $empresaId = $this->resolverEmpresaId($request);
        if (!$empresaId) {
            return response()->json([
                'success' => false,
                'message' => 'empresa_id es requerido para administradores o el analista no tiene empresa asignada.'
            ], 422);
        }

        $estadoBase = Estado::with(['detalles.catalogoCuenta'])
            ->where('empresa_id', $empresaId)
            ->where('periodo_id', $request->periodo_base_id)
            ->where('tipo', 'BALANCE')
            ->first();

        $estadoComp = Estado::with(['detalles.catalogoCuenta'])
            ->where('empresa_id', $empresaId)
            ->where('periodo_id', $request->periodo_comp_id)
            ->where('tipo', 'BALANCE')
            ->first();

        if (!$estadoBase || !$estadoComp) {
            return response()->json([
                'success' => false,
                'message' => 'No existen Balances para ambos periodos indicados.'
            ], 404);
        }

        $byCuenta = function ($estado) {
            $map = [];
            foreach ($estado->detalles as $detalle) {
                $cuenta = $detalle->catalogoCuenta;
                if (!$cuenta) { continue; }
                if ($cuenta->estado_financiero !== 'BALANCE_GENERAL') { continue; }
                $map[$cuenta->id] = [
                    'cuenta' => $cuenta,
                    'monto' => (float)$detalle->monto,
                ];
            }
            return $map;
        };

        $base = $byCuenta($estadoBase);
        $comp = $byCuenta($estadoComp);

        $cuentaIds = array_unique(array_merge(array_keys($base), array_keys($comp)));

        $resultados = [];
        foreach ($cuentaIds as $cuentaId) {
            $cuenta = ($base[$cuentaId]['cuenta'] ?? $comp[$cuentaId]['cuenta'] ?? null);
            if (!$cuenta) { continue; }
            $montoBase = $base[$cuentaId]['monto'] ?? 0.0;
            $montoComp = $comp[$cuentaId]['monto'] ?? 0.0;
            $variacionAbs = $montoComp - $montoBase;
            $variacionPct = $montoBase != 0.0 ? $variacionAbs / $montoBase : null;

            $resultados[] = [
                'catalogo_cuenta_id' => $cuenta->id,
                'codigo' => $cuenta->codigo,
                'nombre' => $cuenta->nombre,
                'seccion' => $cuenta->tipo,
                'monto_base' => $montoBase,
                'monto_comp' => $montoComp,
                'variacion_abs' => $variacionAbs,
                'variacion_pct' => $variacionPct,
            ];
        }

        usort($resultados, function ($a, $b) {
            return strcmp($a['codigo'], $b['codigo']);
        });

        return response()->json([
            'success' => true,
            'data' => [
                'empresa_id' => $empresaId,
                'periodo_base_id' => (int)$request->periodo_base_id,
                'periodo_comp_id' => (int)$request->periodo_comp_id,
                'lineas' => $resultados,
            ],
        ]);
    }

    /**
     * Resolver empresa_id según rol del usuario.
     * - Analista: usa su empresa_id.
     * - Administrador: usa empresa_id del request.
     * Deja abierta la extensión para mapear denominadores por cuenta_concepto.
     */
    private function resolverEmpresaId(Request $request): ?int
    {
        $user = $request->user();
        if (!$user) { return null; }

        $roles = $user->roles->pluck('name')->toArray();
        $esAdmin = in_array('Administrador', $roles);
        $esAnalista = in_array('Analista Financiero', $roles) && !$esAdmin;

        if ($esAnalista) {
            return $user->empresa_id ?: null;
        }

        // Administrador u otros roles con permiso
        $empresaId = (int)($request->input('empresa_id'));
        return $empresaId ?: null;
    }
}


```

```php
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RubroController;
use App\Http\Controllers\EmpresaController;
use App\Http\Controllers\RatioDefinicionController;
use App\Http\Controllers\CatalogoCuentaController;
use App\Http\Controllers\PeriodoController;
use App\Http\Controllers\EstadoFinancieroController;
use App\Http\Controllers\AnalisisBalanceController;

Route::post('/login', [AuthController::class, 'login'])->name('login');

Route::post('/set-password', [AuthController::class, 'setPassword'])->name('set-password');

// Ruta pública: lista de categorías de ratios (no requiere autenticación)
Route::get('/ratios/categorias', [RatioDefinicionController::class, 'categorias']);

// Route::get('/empresas/{empresa}/ratios', [RatioDefinicionController::class, 'valoresPorPeriodo']);
// Route::post('/empresas/{empresa}/ratios/generar', [RatioDefinicionController::class, 'generarPorPeriodo']);

Route::middleware(['auth:sanctum'])->group(function () {

    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/periodos', [PeriodoController::class, 'index'])
    ->middleware('auth:sanctum');

    
    // RUTAS DE CÁLCULO Y CONSULTA DE RATIOS POR EMPRESA (para Analista/Admin)
    Route::middleware('role:Administrador')->group(function () {
        Route::middleware('permiso:manage_users')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::get('/users/{id}', [UserController::class, 'show']);
            Route::put('/users/{id}', [UserController::class, 'update']);
            Route::delete('/users/{id}', [UserController::class, 'destroy']);
        });

        //     // --- Ratios por empresa (protegidas) ---
        // Route::middleware('permiso:ver_ratios')->get(
        //     '/empresas/{empresa}/ratios',
        //     [RatioDefinicionController::class, 'valoresPorPeriodo']
        // );

        // Route::middleware('permiso:calcular_ratios')->post(
        //     '/empresas/{empresa}/ratios/generar',
        //     [RatioDefinicionController::class, 'generarPorPeriodo']
        // );

        // ----------------------------------------------------------------------
        // GRUPO DE RUTAS: GESTIÓN DE RUBROS
        // Permiso requerido: 'gestionar_rubros'
        // ----------------------------------------------------------------------
        Route::middleware('permiso:gestionar_rubros')->group(function () {
            // 1. OBTENER todos los rubros (Index)
            Route::get('/rubros', [RubroController::class, 'index'])->name('rubros.index');
            // 2. CREAR un nuevo rubro (Store)
            Route::post('/rubros', [RubroController::class, 'store'])->name('rubros.store');
            // 3. OBTENER un rubro específico (Show)
            // Usamos {rubro} para que Laravel sepa hacer el Route Model Binding con el modelo Rubro.
            Route::get('/rubros/{rubro}', [RubroController::class, 'show'])->name('rubros.show');
            // 4. ACTUALIZAR un rubro (Update)
            // Se usa PUT para la actualización completa del recurso.
            Route::put('/rubros/{rubro}', [RubroController::class, 'update'])->name('rubros.update');
            // NOTA: También podrías usar Route::patch() si solo permitieras actualizaciones parciales.
            // 5. ELIMINAR un rubro (Destroy)
            Route::delete('/rubros/{rubro}', [RubroController::class, 'destroy'])->name('rubros.destroy');
        });

        Route::middleware(['auth:sanctum','role:Administrador','permiso:ver_ratios'])->group(function () {
        Route::get('/benchmark/sector-ratio', [\App\Http\Controllers\BenchmarkController::class, 'sectorRatio']);
        Route::get('/rubros/{rubro}/empresas', [\App\Http\Controllers\EmpresaController::class, 'porRubro']); // opcional para poblar select
        });



            // Ver ratios (permiso ver_ratios)
        Route::middleware(['permiso:ver_ratios'])->group(function () {
            Route::get('/empresas/{empresa}/ratios', [RatioDefinicionController::class, 'valoresPorPeriodo']);
                // Listado de categorías permitidas para clasificar ratios
                Route::get('/ratios/categorias', [RatioDefinicionController::class, 'categorias']);
        });

        // Generar ratios (permiso calcular_ratios)
        Route::middleware(['permiso:calcular_ratios'])->group(function () {
            Route::post('/empresas/{empresa}/ratios/generar', [RatioDefinicionController::class, 'generarPorPeriodo']);
            // Calcular un único ratio (dry-run + breakdown)
            Route::get('/ratios/definiciones/{ratio_definicion}/calculate', [RatioDefinicionController::class, 'calculate']);
        });
        // ----------------------------------------------------------------------
        // GRUPO DE RUTAS: GESTIÓN DE EMPRESAS
        // Permiso requerido: 'gestionar_empresas'
        // ----------------------------------------------------------------------
        Route::middleware('permiso:gestionar_empresas')->group(function () {
            // LISTAR todas las empresas (Index)
            Route::get('/empresas', [EmpresaController::class, 'index'])->name('empresas.index');

            // CREAR una nueva empresa (Store)
            Route::post('/empresas', [EmpresaController::class, 'store'])->name('empresas.store');

            // OBTENER datos para el formulario de creación (Create) - Opcional en API
            Route::get('/empresas/create', [EmpresaController::class, 'create'])->name('empresas.create');

            // OBTENER una empresa específica (Show)
            // Usamos {empresa} para Route Model Binding.
            Route::get('/empresas/{empresa}', [EmpresaController::class, 'show'])->name('empresas.show');

            // OBTENER datos para el formulario de edición (Edit) - Opcional en API
            Route::get('/empresas/{empresa}/edit', [EmpresaController::class, 'edit'])->name('empresas.edit');

            // ACTUALIZAR una empresa (Update)
            Route::put('/empresas/{empresa}', [EmpresaController::class, 'update'])->name('empresas.update');

            // ELIMINAR una empresa (Destroy)
            Route::delete('/empresas/{empresa}', [EmpresaController::class, 'destroy'])->name('empresas.destroy');
            
            // DESACTIVAR / ACTIVAR una empresa (Disable/Enable)
            Route::patch('/empresas/{empresa}/disable', [EmpresaController::class, 'disable'])->name('empresas.disable');
            
            // LISTAR usuarios de una empresa
            Route::get('/empresas/{empresa}/usuarios', [EmpresaController::class, 'usuarios'])->name('empresas.usuarios');
        });

        // ----------------------------------------------------------------------
        // GRUPO DE RUTAS: DEFINICIÓN DE RATIOS
        // Permiso requerido: 'gestionar_ratios_definicion'
        // ----------------------------------------------------------------------
        Route::middleware('permiso:gestionar_ratios_definicion')->group(function () {
            // LISTAR todas las definiciones de ratios (Index)
            Route::get('/ratios/definiciones', [RatioDefinicionController::class, 'index'])->name('ratios.definiciones.index');

            // CREAR una nueva definición de ratio (Store)
            Route::post('/ratios/definiciones', [RatioDefinicionController::class, 'store'])->name('ratios.definiciones.store');

            // OBTENER datos para el formulario de creación (Create) - Opcional en API
            Route::get('/ratios/definiciones/create', [RatioDefinicionController::class, 'create'])->name('ratios.definiciones.create');

            // OBTENER una definición de ratio específica (Show)
            // Usamos {ratio_definicion} para Route Model Binding.
            Route::get('/ratios/definiciones/{ratio_definicion}', [RatioDefinicionController::class, 'show'])->name('ratios.definiciones.show');

            // OBTENER datos para el formulario de edición (Edit) - Opcional en API
            Route::get('/ratios/definiciones/{ratio_definicion}/edit', [RatioDefinicionController::class, 'edit'])->name('ratios.definiciones.edit');

            // ACTUALIZAR una definición de ratio (Update)
            Route::put('/ratios/definiciones/{ratio_definicion}', [RatioDefinicionController::class, 'update'])->name('ratios.definiciones.update');

            // ELIMINAR una definición de ratio (Destroy)
            Route::delete('/ratios/definiciones/{ratio_definicion}', [RatioDefinicionController::class, 'destroy'])->name('ratios.definiciones.destroy');
        });
    });

    Route::middleware('role:Administrador,Analista Financiero')->group(function () {
        
        // ----------------------------------------------------------------------
        // GRUPO DE RUTAS: GESTIÓN DE CATÁLOGO DE CUENTAS
        // Permiso requerido: 'gestionar_catalogo_cuentas'
        // ----------------------------------------------------------------------
        Route::middleware('permiso:gestionar_catalogo_cuentas')->group(function () {
            // OBTENER lista de empresas con información de catálogo
            Route::get('/catalogo-cuentas/empresas', [CatalogoCuentaController::class, 'empresasConCatalogo'])->name('catalogo.empresas');
            
            // OBTENER catálogo de cuentas de una empresa específica
            Route::get('/catalogo-cuentas/empresa/{empresaId}', [CatalogoCuentaController::class, 'index'])->name('catalogo.index');
            
            // CARGAR/REEMPLAZAR catálogo completo de una empresa
            Route::post('/catalogo-cuentas', [CatalogoCuentaController::class, 'store'])->name('catalogo.store');
            
            // ACTUALIZAR una cuenta específica
            Route::put('/catalogo-cuentas/{id}', [CatalogoCuentaController::class, 'update'])->name('catalogo.update');
            
            // ELIMINAR una cuenta específica
            Route::delete('/catalogo-cuentas/{id}', [CatalogoCuentaController::class, 'destroy'])->name('catalogo.destroy');
        });

        // ----------------------------------------------------------------------
        // GRUPO DE RUTAS: GESTIÓN DE ESTADOS FINANCIEROS
        // Permiso requerido: 'gestionar_catalogo_cuentas' (puede usar el mismo o crear uno nuevo)
        // ----------------------------------------------------------------------
        Route::middleware('permiso:gestionar_catalogo_cuentas')->group(function () {
            // OBTENER lista de empresas con catálogo
            Route::get('/estados-financieros/empresas', [EstadoFinancieroController::class, 'obtenerEmpresas'])->name('estados.empresas');
            
            // OBTENER lista de periodos disponibles
            Route::get('/estados-financieros/periodos', [EstadoFinancieroController::class, 'obtenerPeriodos'])->name('estados.periodos');
            
            // DESCARGAR plantilla CSV con cuentas según tipo de estado
            Route::get('/estados-financieros/plantilla', [EstadoFinancieroController::class, 'descargarPlantilla'])->name('estados.plantilla');
            
            // LISTAR estados financieros (con filtros opcionales)
            Route::get('/estados-financieros', [EstadoFinancieroController::class, 'index'])->name('estados.index');
            
            // OBTENER un estado financiero específico
            Route::get('/estados-financieros/{id}', [EstadoFinancieroController::class, 'show'])->name('estados.show');
            
            // CREAR nuevo estado financiero
            Route::post('/estados-financieros', [EstadoFinancieroController::class, 'store'])->name('estados.store');
            
            // ACTUALIZAR estado financiero
            Route::put('/estados-financieros/{id}', [EstadoFinancieroController::class, 'update'])->name('estados.update');
            
            // ELIMINAR estado financiero
            Route::delete('/estados-financieros/{id}', [EstadoFinancieroController::class, 'destroy'])->name('estados.destroy');
        });
    });

    // ----------------------------------------------------------------------
    // GRUPO DE RUTAS: ANÁLISIS DE BALANCE (Vertical y Horizontal)
    // Permiso requerido: 'analizar_balance'
    // - Analista: empresa_id se infiere desde su usuario
    // - Administrador: empresa_id viene desde el front
    // ----------------------------------------------------------------------
    Route::middleware(['permiso:analizar_balance'])->group(function () {
        Route::get('/analisis/balance/vertical', [AnalisisBalanceController::class, 'vertical']);
        Route::get('/analisis/balance/horizontal', [AnalisisBalanceController::class, 'horizontal']);
    });

    Route::middleware('role:Analista Financiero')->group(function () {
        // Rutas específicas para Analista Financiero
    });

    Route::middleware('role:Inversor')->group(function () {
        // Rutas específicas para Inversor
    });
});

```

He creado el permiso y los endpoints con control de acceso; para Analista el `empresa_id` se toma del usuario y para Administrador se recibe desde el front.

- Permiso
  - **analizar_balance**: asignado a Administrador y Analista Financiero (seeder actualizado).

- Endpoints protegidos con `permiso:analizar_balance`
  - GET `/analisis/balance/vertical?periodo_id=...&seccion=ACTIVO|PASIVO|PATRIMONIO`
    - Admin: añadir `empresa_id`.
    - Analista: se usa `auth()->user()->empresa_id`.
    - Denominadores fijos por sección: ACTIVO(1), PASIVO(2), PATRIMONIO(3). Preparado para cambiar a `cuenta_concepto` en el futuro.
  - GET `/analisis/balance/horizontal?periodo_base_id=...&periodo_comp_id=...`
    - Admin: añadir `empresa_id`.
    - Analista: usa su empresa.
    - Empata por `catalogo_cuenta_id` y calcula variación absoluta y %.

Rutas añadidas:

```156:166:/home/nerduniverse/FinBack/routes/api.php
use App\Http\Controllers\AnalisisBalanceController;
...
    Route::middleware(['permiso:analizar_balance'])->group(function () {
        Route::get('/analisis/balance/vertical', [AnalisisBalanceController::class, 'vertical']);
        Route::get('/analisis/balance/horizontal', [AnalisisBalanceController::class, 'horizontal']);
    });
```

Controlador (firmas principales):

```13:33:/home/nerduniverse/FinBack/app/Http/Controllers/AnalisisBalanceController.php
class AnalisisBalanceController extends Controller
{
    public function vertical(Request $request)
    {
        ...
    }

    public function horizontal(Request $request)
    {
        ...
    }
```

Seeder de permisos actualizado:

```31:41:/home/nerduniverse/FinBack/database/seeders/PermisoSeeder.php
['name' => 'ver_ratios', 'description' => 'Permite consultar los ratios financieros de una empresa.'],
['name' => 'calcular_ratios', 'description' => 'Permite generar ratios financieros para una empresa.'],

//Analisis y reportes
['name' => 'analizar_balance', 'description' => 'Consultar análisis vertical y horizontal del balance general.'],
```

Asignación de permisos:

```52:67:/home/nerduniverse/FinBack/database/seeders/PermisoSeeder.php
'Administrador' => [
  ...,
  'calcular_ratios',
  'analizar_balance',
],
'Analista Financiero' => [
  ...,
  'calcular_ratios',
  'analizar_balance',
],
```

Notas de uso
- Vertical: devuelve `totales` por sección y `lineas` con `porcentaje = monto / denominador`. Maneja denominador 0 devolviendo `porcentaje: null`.
- Horizontal: devuelve `lineas` con `monto_base`, `monto_comp`, `variacion_abs`, `variacion_pct` (null si base=0).
- Preparado para futura “ventana” a `cuenta_concepto`: la resolución de secciones/denominadores está encapsulada para poder cambiar la fuente.

He cerrado todas las tareas:
- Permiso creado y asignado.
- Controlador `AnalisisBalanceController` implementado (vertical/horizontal).
- Rutas registradas y protegidas por permiso.

Resumen de impacto
- Añadido permiso `analizar_balance` y asignado a roles clave.
- Nuevos endpoints de análisis listos para consumo del front, con resolución automática de `empresa_id` según rol.
- Cálculos reutilizan los totales ya guardados, y el diseño permite migrar a `cuenta_concepto` sin romper el contrato de la API.

```php
use App\Http\Controllers\AnalisisBalanceController;
...
    Route::middleware(['permiso:analizar_balance'])->group(function () {
        Route::get('/analisis/balance/vertical', [AnalisisBalanceController::class, 'vertical']);
        Route::get('/analisis/balance/horizontal', [AnalisisBalanceController::class, 'horizontal']);
    });
```

```php
class AnalisisBalanceController extends Controller
{
    public function vertical(Request $request)
    {
        ...
    }

    public function horizontal(Request $request)
    {
        ...
    }
```

```php
['name' => 'ver_ratios', 'description' => 'Permite consultar los ratios financieros de una empresa.'],
['name' => 'calcular_ratios', 'description' => 'Permite generar ratios financieros para una empresa.'],

//Analisis y reportes
['name' => 'analizar_balance', 'description' => 'Consultar análisis vertical y horizontal del balance general.'],
```

```php
'Administrador' => [
  ...,
  'calcular_ratios',
  'analizar_balance',
],
'Analista Financiero' => [
  ...,
  'calcular_ratios',
  'analizar_balance',
],
```

