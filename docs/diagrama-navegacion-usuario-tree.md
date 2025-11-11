# Diagrama de navegación (estilo `tree`) — Vista conceptual por módulo

Este archivo presenta un diagrama tipo `tree` (ASCII) pensado para compartir rápidamente por chat o terminal. Está basado en la teoría que proporcionaste y mapea cada módulo con sus subfuncionalidades y notas cortas.

Puedes copiar este bloque tal cual y pegarlo en un terminal o en cualquier chat:

```
finance-app/
├── 1-Gestion-Empresas/                      # Módulo maestro de configuración
│   ├── Rubros/                               # Definición de rubros maestros
│   │   ├── crear
│   │   ├── editar
│   │   └── listar
│   ├── Empresas/                              # Gestión de empresas (entidades que cargan datos)
│   │   ├── crear
│   │   ├── editar
│   │   └── listar
│   └── Gestion-Ratios/                        # Definición de fórmulas y metadatos de ratios
│       ├── crear-definicion-ratio
│       ├── editar-definicion
│       └── listar-definiciones
│
├── 2-Gestion-Datos-Financieros/             # Módulo operacional de ingestion/mapeo
│   ├── Carga-Masiva-EF/                      # Upload/Import de Estados Financieros (balances/ER)
│   │   ├── importar-archivo
│   │   ├── validar-inconsistencias
│   │   └── historial-importes
│   └── Mapeo-Cuentas/                        # Mapeo de cuentas contables a Rubros maestros
│       ├── asignar-cuenta-a-rubro
│       ├── reglas-de-mapeo (por empresa)
│       └── aplicar-mapeo-masivo
│
├── 3-Analisis-y-Reportes/                   # Cálculo y visualización con datos ya mapeados
│   ├── Generacion-Ratios/                    # Cálculo automático por empresa/periodo
│   │   ├── ejecutar-catalogo-ratios
│   │   ├── exportar-csv
│   │   └── ver-historico-por-periodo
│   ├── Analisis-Vertical/                    # Análisis vertical por EF/periodo
│   └── Analisis-Horizontal/                  # Análisis horizontal (variaciones periodicas)
│
├── 4-Proyeccion-de-Ventas/                  # Módulo para proyecciones (datos no-financieros)
│   ├── Datos-Historicos-Ventas/              # Carga/edición de ventas por mes (o granularidad definida)
│   │   ├── importar-historico
│   │   └── limpiar-datos
│   └── Generacion-Proyecciones/              # Modelos y generación de proyecciones
│       ├── definir-supuestos
│       ├── ejecutar-modelo
│       └── comparar-escenarios
│
└── 5-Seguridad/                              # Módulo transversal de control de acceso
    ├── Gestion-Usuarios/                     # CRUD de usuarios
    │   ├── crear-usuario
    │   ├── editar-usuario
    │   └── eliminar-usuario
    └── Gestion-Roles-Permisos/               # Asignación de roles y permisos (Admin/Analista...)
        ├── definir-roles
        ├── asignar-permisos-por-rol
        └── auditoria-de-accesos

```

Notas rápidas:
- El orden numérico (1..5) corresponde a la prioridad funcional que sugeriste: Módulo maestro → ingestion → análisis → proyecciones → seguridad.
- Recomendación: cuando compartas por chat o issue, pega tal cual el bloque entre 
  triple-backticks para que se vea como código y mantenga el formato tree.
- Si quieres, puedo generar además:
  - Una versión en Markdown con enlaces a las rutas y componentes concretos (si quieres que mapee a `src/App.jsx`).
  - Un archivo TXT con sólo el árbol listo para pegar en terminal.

---

Propuesta de mapeo rápido a rutas (ejemplo basado en `src/App.jsx`):

- `1-Gestion-Empresas/Empresas` → `/dashboard/gestion-empresas/empresas` (perm: `gestionar_empresas`)
- `1-Gestion-Empresas/Rubros` → `/dashboard/gestion-empresas/rubros` (perm: `gestionar_rubros`)
- `1-Gestion-Empresas/Gestion-Ratios` → `/dashboard/gestion-empresas/definicion-ratios` (perm: `gestionar_ratios_definicion`)
- `2-Gestion-Datos-Financieros/Carga-Masiva-EF` → `/dashboard/estados-financieros/importar`
- `2-Gestion-Datos-Financieros/Mapeo-Cuentas` → `/dashboard/gestion-empresas/asignacion-catalogo` (roles: Administrador, Analista Financiero)
- `3-Analisis-y-Reportes/Analisis-Vertical` → `/dashboard/analisis-balance`
- `3-Analisis-y-Reportes/Analisis-Vertical/Graficos` → `/dashboard/analisis-balance/graficos`
- `4-Proyeccion-de-Ventas` → `/dashboard/gestion-empresas/ventas-mensuales` (perm: `ver_proyecciones`)
- `5-Seguridad/Gestion-Usuarios` → `/dashboard/usuarios` (perm: `manage_users`)

---

Si quieres, exporto también `docs/diagrama-navegacion-usuario-tree.txt` o creo un `README` corto para compartir en Slack/Teams con instrucciones rápidas.
