import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Loader2, RefreshCcw, Save, Search, AlertTriangle } from "lucide-react"

import { useEstadosFinancieros } from "@/hooks/EstadosFinancieros/useEstadosFinancieros"
import CatalogoCuentasService from "@/services/GestionCuentas/CatalogoCuentas/CatalogoCuentasService"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import Modal from "@/components/ui/Modal"

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "$0"
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

const isCuentaCalculada = (cuenta = {}) => {
  if (cuenta.es_calculada !== undefined && cuenta.es_calculada !== null) {
    return cuenta.es_calculada === true || cuenta.es_calculada === 1 || cuenta.es_calculada === "1"
  }
  // Heurística: códigos sin punto suelen ser totales, tratarlos como calculados
  return typeof cuenta.codigo === "string" && !cuenta.codigo.includes(".")
}

const filtrarPorTipo = (cuentas, tipo) => {
  if (!tipo) return cuentas
  const prefijosBalance = ["1", "2", "3"]
  const prefijosResultados = ["4", "5", "6", "7", "8", "9"]

  return cuentas.filter((cuenta) => {
    const codigo = cuenta.codigo || ""
    if (!codigo) return false

    if (tipo === "balance") {
      return prefijosBalance.some((prefijo) => codigo.startsWith(`${prefijo}.`) || codigo === prefijo)
    }

    if (tipo === "resultados") {
      return prefijosResultados.some((prefijo) => codigo.startsWith(`${prefijo}.`) || codigo === prefijo)
    }

    return true
  })
}

const sanitizeMonto = (valor) => {
  if (valor === undefined || valor === null) return ""
  if (typeof valor === "number") return String(valor)
  return valor
}

const parseMonto = (valor) => {
  if (valor === undefined || valor === null) return null
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null

  let limpio = valor
  if (typeof limpio !== "string") {
    limpio = String(limpio)
  }

  limpio = limpio.trim()
  if (!limpio) return null

  // Reemplazar separadores de miles comunes
  limpio = limpio.replace(/\s+/g, "")
  // Si contiene punto y coma, asumir formato europeo
  const tienePunto = limpio.includes(".")
  const tieneComa = limpio.includes(",")

  if (tienePunto && tieneComa) {
    if (limpio.lastIndexOf(",") > limpio.lastIndexOf(".")) {
      limpio = limpio.replace(/\./g, "").replace(",", ".")
    } else {
      limpio = limpio.replace(/,/g, "")
    }
  } else if (tieneComa && !tienePunto) {
    const partes = limpio.split(",")
    if (partes.length === 2 && partes[1].length <= 2) {
      limpio = limpio.replace(",", ".")
    } else {
      limpio = limpio.replace(/,/g, "")
    }
  } else {
    limpio = limpio.replace(/,/g, "")
  }

  limpio = limpio.replace(/[^0-9.-]/g, "")

  if (!limpio) return null
  const numero = parseFloat(limpio)
  return Number.isFinite(numero) ? numero : null
}

export default function NuevoEstadoManualPage(props) {
  const { modo = "crear", estadoId = null } = props || {}
  const navigate = useNavigate()
  const {
    empresas,
    periodos,
    loading: loadingEstados,
    error: errorEstados,
    cargarEmpresas,
    cargarPeriodos,
    obtenerEstado,
    crearEstado,
    actualizarEstado,
    setError,
  } = useEstadosFinancieros()

  const [empresa, setEmpresa] = useState("")
  const [periodo, setPeriodo] = useState("")
  const [tipoEstado, setTipoEstado] = useState("")
  const [catalogoCuentas, setCatalogoCuentas] = useState([])
  const [loadingCatalogo, setLoadingCatalogo] = useState(false)
  const [catalogError, setCatalogError] = useState(null)

  const [montos, setMontos] = useState({})
  const [usarEnRatios, setUsarEnRatios] = useState({})
  const [busqueda, setBusqueda] = useState("")

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState({ title: "", description: "" })
  const [existingEstado, setExistingEstado] = useState(null)
  const [checkingEstado, setCheckingEstado] = useState(false)
  const [mostrarErroresMontos, setMostrarErroresMontos] = useState(false)
  const [detallesIniciales, setDetallesIniciales] = useState(null)
  const [loadingInicial, setLoadingInicial] = useState(modo === "editar")

  const isEdicion = modo === "editar"

  useEffect(() => {
    cargarEmpresas()
    cargarPeriodos()

    return () => {
      setError(null)
    }
  }, [cargarEmpresas, cargarPeriodos, setError])

  useEffect(() => {
    if (!empresa) {
      setCatalogoCuentas([])
      setMontos({})
      setUsarEnRatios({})
      setMostrarErroresMontos(false)
      if (!isEdicion) {
        setExistingEstado(null)
      }
      return
    }

    const cargarCatalogo = async () => {
      try {
        setLoadingCatalogo(true)
        setCatalogError(null)
        const response = await CatalogoCuentasService.getCatalogoByEmpresa(parseInt(empresa, 10))
        const cuentas = response?.data?.cuentas || []
        // Ordenar por código
        cuentas.sort((a, b) => (a.codigo || "").localeCompare(b.codigo || "", undefined, { numeric: true }))
        setCatalogoCuentas(cuentas)
        setMontos({})
        setUsarEnRatios({})
        setMostrarErroresMontos(false)
      } catch (error) {
        console.error("Error al cargar catálogo:", error)
        setCatalogError("No fue posible cargar el catálogo de cuentas para la empresa seleccionada.")
        setCatalogoCuentas([])
      } finally {
        setLoadingCatalogo(false)
      }
    }

    cargarCatalogo()
  }, [empresa, isEdicion])

  useEffect(() => {
    if (!isEdicion || !detallesIniciales || !catalogoCuentas.length) {
      return
    }

    const montosPreCargados = {}
    const ratiosPreCargados = {}

    detallesIniciales.forEach((detalle) => {
      const cuentaId = detalle.catalogo_cuenta_id || detalle.catalogo_cuenta?.id
      if (!cuentaId) return

      montosPreCargados[cuentaId] = sanitizeMonto(detalle.monto)
      ratiosPreCargados[cuentaId] = Boolean(detalle.usar_en_ratios)
    })

    setMontos(montosPreCargados)
    setUsarEnRatios(ratiosPreCargados)
    setMostrarErroresMontos(false)
    setDetallesIniciales(null)
  }, [isEdicion, detallesIniciales, catalogoCuentas])

  useEffect(() => {
    if (!isEdicion || !estadoId) {
      setLoadingInicial(false)
      return
    }

    const cargarEstadoExistente = async () => {
      try {
        setLoadingInicial(true)
        const idNumerico = Number(estadoId)
        const response = await obtenerEstado(idNumerico)

        const estado =
          response?.success && response?.data
            ? Array.isArray(response.data)
              ? response.data[0]
              : response.data
            : null

        if (!estado) {
          setFormError("No se encontró el estado financiero que intentas editar.")
          setExistingEstado(null)
          return
        }

        setExistingEstado(estado)
        setEmpresa(estado.empresa_id ? estado.empresa_id.toString() : "")
        setPeriodo(estado.periodo_id ? estado.periodo_id.toString() : "")
        const tipoNormalizado =
          estado.tipo === "BALANCE"
            ? "balance"
            : estado.tipo === "RESULTADOS"
            ? "resultados"
            : ""
        setTipoEstado(tipoNormalizado)
        setDetallesIniciales(estado.detalles || [])
        setSuccessMessage({ title: "", description: "" })
      } catch (error) {
        console.error("Error al cargar el estado a editar:", error)
        setFormError(
          error?.response?.data?.message ||
            "No fue posible cargar el estado financiero para edición."
        )
        setExistingEstado(null)
      } finally {
        setLoadingInicial(false)
      }
    }

    cargarEstadoExistente()
  }, [isEdicion, estadoId, obtenerEstado])

  useEffect(() => {
    if (isEdicion) {
      return
    }
    if (!empresa || !periodo || !tipoEstado) {
      setExistingEstado(null)
      setCheckingEstado(false)
      setMostrarErroresMontos(false)
      return
    }

    let cancelado = false
    const verificarEstadoExistente = async () => {
      try {
        setCheckingEstado(true)
        const response = await obtenerEstado({
          empresa_id: parseInt(empresa, 10),
          periodo_id: parseInt(periodo, 10),
          tipo: tipoEstado === "balance" ? "BALANCE" : "RESULTADOS",
        })

        if (cancelado) return

        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          setExistingEstado(response.data[0])
        } else {
          setExistingEstado(null)
        }
      } catch (error) {
        if (!cancelado) {
          console.error("Error al verificar estado existente:", error)
          setExistingEstado(null)
        }
      } finally {
        if (!cancelado) {
          setCheckingEstado(false)
        }
      }
    }

    verificarEstadoExistente()

    return () => {
      cancelado = true
    }
  }, [empresa, periodo, tipoEstado, obtenerEstado, isEdicion])

  const cuentasDisponibles = useMemo(() => {
    if (!catalogoCuentas || catalogoCuentas.length === 0) return []
    const base = catalogoCuentas.filter((cuenta) => !isCuentaCalculada(cuenta))
    const filtradasPorTipo = filtrarPorTipo(base, tipoEstado)

    if (!busqueda) {
      return filtradasPorTipo
    }

    const termino = busqueda.trim().toLowerCase()
    return filtradasPorTipo.filter((cuenta) => {
      const codigo = cuenta.codigo?.toLowerCase() || ""
      const nombre = cuenta.nombre?.toLowerCase() || ""
      return codigo.includes(termino) || nombre.includes(termino)
    })
  }, [catalogoCuentas, tipoEstado, busqueda])

  const totalSeleccionado = useMemo(() => {
    return cuentasDisponibles.reduce((acc, cuenta) => {
      const valor = sanitizeMonto(montos[cuenta.id])
      const monto = parseMonto(valor)
      if (monto === null || Number.isNaN(monto)) return acc
      return acc + monto
    }, 0)
  }, [cuentasDisponibles, montos])

  const totalesBalance = useMemo(() => {
    if (tipoEstado !== "balance") {
      return {
        totalActivos: 0,
        totalPasivos: 0,
        totalPatrimonio: 0,
        diferencia: 0,
      }
    }

    const sumatoria = { activos: 0, pasivos: 0, patrimonio: 0 }

    cuentasDisponibles.forEach((cuenta) => {
      const codigo = cuenta.codigo || ""
      const valor = sanitizeMonto(montos[cuenta.id])
      const monto = parseMonto(valor)
      if (monto === null || Number.isNaN(monto)) {
        return
      }

      if (codigo.startsWith("1")) {
        sumatoria.activos += monto
      } else if (codigo.startsWith("2")) {
        sumatoria.pasivos += monto
      } else if (codigo.startsWith("3")) {
        sumatoria.patrimonio += monto
      }
    })

    const diferencia = sumatoria.activos - (sumatoria.pasivos + sumatoria.patrimonio)
    return {
      totalActivos: sumatoria.activos,
      totalPasivos: sumatoria.pasivos,
      totalPatrimonio: sumatoria.patrimonio,
      diferencia,
    }
  }, [tipoEstado, cuentasDisponibles, montos])

  const hayCambios = useMemo(() => {
    return cuentasDisponibles.some((cuenta) => {
      const valor = sanitizeMonto(montos[cuenta.id])
      const monto = parseMonto(valor)
      return monto !== null && !Number.isNaN(monto)
    })
  }, [cuentasDisponibles, montos])

  const { faltanMontos, cuentasPendientes } = useMemo(() => {
    if (!tipoEstado || !cuentasDisponibles.length) {
      return { faltanMontos: false, cuentasPendientes: [] }
    }

    const pendientes = cuentasDisponibles.filter((cuenta) => {
      const valor = sanitizeMonto(montos[cuenta.id])
      const monto = parseMonto(valor)
      return monto === null || Number.isNaN(monto)
    })

    return { faltanMontos: pendientes.length > 0, cuentasPendientes: pendientes }
  }, [tipoEstado, cuentasDisponibles, montos])

  const filasTabla = useMemo(() => {
    if (!tipoEstado) return []

    if (tipoEstado !== "balance") {
      return cuentasDisponibles.map((cuenta) => ({
        tipo: "cuenta",
        cuenta,
        categoria: null,
      }))
    }

    const categorias = [
      {
        id: "activos",
        label: "Activos",
        color: "bg-emerald-50 dark:bg-emerald-950/40",
        match: (codigo = "") => codigo.startsWith("1"),
      },
      {
        id: "pasivos",
        label: "Pasivos",
        color: "bg-sky-50 dark:bg-sky-950/40",
        match: (codigo = "") => codigo.startsWith("2"),
      },
      {
        id: "patrimonio",
        label: "Patrimonio",
        color: "bg-amber-50 dark:bg-amber-950/40",
        match: (codigo = "") => codigo.startsWith("3"),
      },
    ]

    const filas = []
    categorias.forEach((categoria) => {
      const cuentasCategoria = cuentasDisponibles.filter((cuenta) => categoria.match(cuenta.codigo))
      if (!cuentasCategoria.length) return

      filas.push({
        tipo: "categoria",
        id: categoria.id,
        label: categoria.label,
        color: categoria.color,
      })

      cuentasCategoria.forEach((cuenta) => {
        filas.push({
          tipo: "cuenta",
          cuenta,
          categoria: categoria.id,
        })
      })
    })

    return filas
  }, [tipoEstado, cuentasDisponibles])

  const balanceDescuadrado = useMemo(() => {
    if (tipoEstado !== "balance") return false
    if (!cuentasDisponibles.length || faltanMontos) return true
    return Math.abs(totalesBalance.diferencia) >= 0.5
  }, [tipoEstado, cuentasDisponibles.length, faltanMontos, totalesBalance.diferencia])

  const puedeGuardar =
    empresa &&
    periodo &&
    tipoEstado &&
    !saving &&
    !loadingCatalogo &&
    !checkingEstado &&
    !loadingInicial &&
    cuentasDisponibles.length > 0 &&
    (!balanceDescuadrado || faltanMontos)

  const handleKeyDown = (event) => {
    // Permitir teclas de control (backspace, delete, tab, escape, enter, etc.)
    if (
      event.key === "Backspace" ||
      event.key === "Delete" ||
      event.key === "Tab" ||
      event.key === "Escape" ||
      event.key === "Enter" ||
      event.key === "ArrowLeft" ||
      event.key === "ArrowRight" ||
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      return
    }

    // Permitir Ctrl/Cmd + A, C, V, X (copiar, pegar, cortar, seleccionar todo)
    if ((event.ctrlKey || event.metaKey) && (event.key === "a" || event.key === "c" || event.key === "v" || event.key === "x")) {
      return
    }

    // Permitir números
    if (event.key >= "0" && event.key <= "9") {
      return
    }

    // Permitir punto, coma y signo negativo solo si no están ya presentes o el negativo está al inicio
    const currentValue = event.target.value
    const selectionStart = event.target.selectionStart || 0

    if (event.key === "." && !currentValue.includes(".")) {
      return
    }

    if (event.key === "," && !currentValue.includes(",")) {
      return
    }

    if (event.key === "-" && selectionStart === 0 && !currentValue.startsWith("-")) {
      return
    }

    // Bloquear cualquier otro carácter
    event.preventDefault()
  }

  const handleMontoChange = (cuentaId, value) => {
    if (formError) setFormError(null)
    
    // Filtrar solo números, puntos, comas y signo negativo
    let valorFiltrado = value.replace(/[^0-9.,-]/g, "")
    
    // Asegurar que el signo negativo solo esté al inicio (si existe)
    if (valorFiltrado.includes("-")) {
      const tieneSignoNegativo = valorFiltrado.startsWith("-")
      const sinSignos = valorFiltrado.replace(/-/g, "")
      valorFiltrado = tieneSignoNegativo ? "-" + sinSignos : sinSignos
    }
    
    setMontos((prev) => ({
      ...prev,
      [cuentaId]: valorFiltrado,
    }))
  }

  const handleCheckboxChange = (cuentaId, checked) => {
    if (formError) setFormError(null)
    setUsarEnRatios((prev) => ({
      ...prev,
      [cuentaId]: checked,
    }))
  }

  const resetFormulario = () => {
    setMontos({})
    setUsarEnRatios({})
    setBusqueda("")
    setFormError(null)
    setMostrarErroresMontos(false)
  }

  const construirDetalles = () => {
    if (faltanMontos) {
      setFormError("Completa un monto válido para cada cuenta antes de guardar.")
      return
    }

    if (balanceDescuadrado) {
      setFormError(
        "El balance general debe cuadrar: el total de Activos debe ser igual a Pasivos más Patrimonio."
      )
      return
    }

    const detalles = []
    const omitidas = []

    cuentasDisponibles.forEach((cuenta) => {
      const valor = sanitizeMonto(montos[cuenta.id])
      const monto = parseMonto(valor)

      if (monto === null || Number.isNaN(monto)) {
        return
      }

      if (!cuenta.id) {
        omitidas.push(`${cuenta.codigo || "SIN CODIGO"} - ${cuenta.nombre || "Cuenta sin nombre"}`)
        return
      }

      detalles.push({
        catalogo_cuenta_id: cuenta.id,
        monto,
        usar_en_ratios: usarEnRatios[cuenta.id] ?? false,
      })
    })

    return { detalles, omitidas }
  }

  const handleGuardar = async () => {
    setMostrarErroresMontos(true)

    if (!empresa || !periodo || !tipoEstado) {
      setFormError("Selecciona empresa, periodo y tipo de estado antes de guardar.")
      return
    }

    if (!catalogoCuentas.length) {
      setFormError("El catálogo de cuentas de la empresa está vacío. No es posible continuar.")
      return
    }

    const { detalles, omitidas } = construirDetalles()

    if (!detalles.length) {
      setFormError("Completa un monto válido para cada cuenta antes de guardar.")
      return
    }

    setFormError(null)
    setSaving(true)

    try {
      const payload = {
        empresa_id: parseInt(empresa, 10),
        periodo_id: parseInt(periodo, 10),
        tipo: tipoEstado === "balance" ? "BALANCE" : "RESULTADOS",
        detalles,
      }

      const esActualizacion = Boolean(existingEstado)
      const response = esActualizacion
        ? await actualizarEstado(existingEstado.id, payload)
        : await crearEstado(payload)

      const omitidasTexto = omitidas.length
        ? ` ${omitidas.length} cuenta(s) no se incluyeron porque no tienen identificador válido.`
        : ""

      setSuccessMessage({
        title: esActualizacion ? "Estado financiero actualizado" : "¡Estado financiero guardado!",
        description: esActualizacion
          ? `Se actualizó el estado existente con ${detalles.length} cuenta(s).${omitidasTexto}`
          : `Se registraron ${detalles.length} cuenta(s) manualmente.${omitidasTexto}`,
      })
      setShowSuccessModal(true)
      console.info("Estado financiero creado manualmente:", response)
    } catch (error) {
      console.error("Error al guardar estado financiero manual:", error)
      const mensaje =
        error?.response?.data?.message ||
        error?.message ||
        "No fue posible guardar el estado financiero. Intenta nuevamente."
      setFormError(mensaje)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {isEdicion ? "Editar Estado Financiero" : "Ingreso Manual"}
            </h1>
            <p className="text-muted-foreground">
              {isEdicion
                ? "Actualiza los montos registrados para este estado financiero."
                : "Registra manualmente los montos de cada cuenta para crear un nuevo estado financiero."}
            </p>
          </div>
        </div>

        {(errorEstados || catalogError || formError) && (
          <Alert variant="destructive">
            <AlertTitle>Ha ocurrido un problema</AlertTitle>
            <AlertDescription>{formError || catalogError || errorEstados}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>
              {isEdicion
                ? "Los datos generales provienen del estado financiero seleccionado."
                : "Selecciona los datos base antes de ingresar los montos."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Select
                  value={empresa}
                  onValueChange={(value) => {
                    if (formError) setFormError(null)
                    setEmpresa(value)
                  }}
                  disabled={loadingEstados || saving || isEdicion || loadingInicial}
                >
                  <SelectTrigger id="empresa">
                    <SelectValue placeholder="Selecciona una empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodo">Periodo</Label>
                <Select
                  value={periodo}
                  onValueChange={(value) => {
                    if (formError) setFormError(null)
                    setPeriodo(value)
                  }}
                  disabled={loadingEstados || saving || isEdicion || loadingInicial}
                >
                  <SelectTrigger id="periodo">
                    <SelectValue placeholder="Selecciona un periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nombre} ({p.año})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoEstado">Tipo de Estado</Label>
                <Select
                  value={tipoEstado}
                  onValueChange={(value) => {
                    if (formError) setFormError(null)
                    setTipoEstado(value)
                  }}
                  disabled={
                    loadingEstados ||
                    saving ||
                    loadingInicial ||
                    (isEdicion ? true : loadingCatalogo || !catalogoCuentas.length)
                  }
                >
                  <SelectTrigger id="tipoEstado">
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance">Balance General</SelectItem>
                    <SelectItem value="resultados">Estado de Resultados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetFormulario}
                disabled={saving || (!hayCambios && !busqueda) || isEdicion}
                className="gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Limpiar cambios
              </Button>
              {loadingCatalogo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando catálogo de cuentas...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isEdicion ? (
          <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Estás editando un estado existente</AlertTitle>
            <AlertDescription>
              Los cambios que realices reemplazarán los montos registrados previamente para este estado financiero.
            </AlertDescription>
          </Alert>
        ) : (
          (checkingEstado || existingEstado) && (
            <Alert
              className={`border-amber-300 bg-amber-50 text-amber-900 ${
                checkingEstado ? "opacity-80" : ""
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {checkingEstado
                  ? "Verificando estados existentes…"
                  : "Ya existe un estado financiero para este periodo"}
              </AlertTitle>
              <AlertDescription>
                {checkingEstado
                  ? "Estamos comprobando si ya registraste un estado para esta empresa y periodo."
                  : `Al guardar, se actualizará el estado de ${
                      tipoEstado === "balance" ? "Balance General" : "Estado de Resultados"
                    } correspondiente al periodo seleccionado.`}
              </AlertDescription>
            </Alert>
          )
        )}

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Ingreso de Cuentas</CardTitle>
                <CardDescription>
                  Registra los montos solo para las cuentas que correspondan al periodo y tipo seleccionado.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-input px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar por código o nombre..."
                  className="border-0 focus-visible:ring-0"
                  disabled={loadingCatalogo || !tipoEstado}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>
                {tipoEstado
                  ? `${cuentasDisponibles.length} cuentas disponibles para ${
                      tipoEstado === "balance" ? "Balance General" : "Estado de Resultados"
                    }.`
                  : "Selecciona tipo de estado para ver las cuentas disponibles."}
              </span>
              {hayCambios && (
                <span className="font-medium text-foreground">
                  Total seleccionado: {formatCurrency(totalSeleccionado)}
                </span>
              )}
              {faltanMontos && cuentasDisponibles.length > 0 && (
                <span className="text-amber-700">
                  Faltan {cuentasPendientes.length} cuenta(s) por completar.
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {(!empresa || !periodo || !tipoEstado || loadingInicial) && (
              <div className="flex min-h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
                {loadingInicial
                  ? "Cargando información del estado financiero…"
                  : "Selecciona empresa, periodo y tipo de estado para comenzar a ingresar montos."}
              </div>
            )}

            {empresa && tipoEstado && !loadingCatalogo && !loadingInicial && cuentasDisponibles.length === 0 && (
              <div className="flex min-h-[200px] items-center justify-center text-center text-sm text-muted-foreground">
                No se encontraron cuentas base en el catálogo para los filtros aplicados.
              </div>
            )}

            {tipoEstado && cuentasDisponibles.length > 0 && !loadingInicial && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left">
                      <th className="px-4 py-3 font-medium text-foreground">Código</th>
                      <th className="px-4 py-3 font-medium text-foreground">Nombre</th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">Monto</th>
                      <th className="px-4 py-3 text-center font-medium text-foreground">Usar en Ratios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filasTabla.map((fila) => {
                      if (fila.tipo === "categoria") {
                        return (
                          <tr key={`categoria-${fila.id}`} className="border-b">
                            <td
                              colSpan={4}
                              className={`px-4 py-3 text-sm font-semibold text-foreground ${fila.color} uppercase tracking-wide`}
                            >
                              {fila.label}
                            </td>
                          </tr>
                        )
                      }

                      const cuenta = fila.cuenta
                      const valor = sanitizeMonto(montos[cuenta.id])
                      const montoParsed = parseMonto(valor)
                      const estaVacio = valor === "" || valor === undefined || valor === null
                      const esInvalido = !estaVacio && (montoParsed === null || Number.isNaN(montoParsed)) && valor !== "-"
                      const hayError = esInvalido
                      const requiereMonto = mostrarErroresMontos && estaVacio && tipoEstado

                      return (
                        <tr key={cuenta.id} className="border-b last:border-0">
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                            {cuenta.codigo || "—"}
                          </td>
                          <td className="px-4 py-3 text-foreground">{cuenta.nombre || "Cuenta sin nombre"}</td>
                          <td className="px-4 py-3">
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              value={valor}
                              onChange={(event) => handleMontoChange(cuenta.id, event.target.value)}
                              onKeyDown={handleKeyDown}
                              disabled={saving}
                              className={`text-right font-medium ${
                                hayError
                                  ? "border-destructive focus-visible:ring-destructive"
                                  : requiereMonto
                                  ? "border-amber-300 focus-visible:ring-amber-300"
                                  : ""
                              }`}
                              aria-invalid={hayError}
                              aria-label={`Monto para ${cuenta.codigo || ""} ${cuenta.nombre || ""}`}
                            />
                            {hayError && (
                              <p className="mt-1 text-xs text-destructive">Introduce un número válido (ej. 12345.67).</p>
                            )}
                            {!hayError && requiereMonto && (
                              <p className="mt-1 text-xs text-amber-600">Ingrese un monto para esta cuenta.</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Checkbox
                              checked={usarEnRatios[cuenta.id] ?? false}
                              onCheckedChange={(checked) => handleCheckboxChange(cuenta.id, checked)}
                              disabled={saving}
                              aria-label={`Marcar ${cuenta.nombre || cuenta.codigo} para ratios`}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 rounded-md border border-dashed border-muted-foreground/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            {tipoEstado === "balance" ? (
              <>
                <p>Verifice que el balance esté cuadrado antes de guardar.</p>
                <p>
                  Activos: {formatCurrency(totalesBalance.totalActivos)} · Pasivos:{" "}
                  {formatCurrency(totalesBalance.totalPasivos)} · Patrimonio:{" "}
                  {formatCurrency(totalesBalance.totalPatrimonio)}
                </p>
                <p
                  className={`font-medium ${
                    balanceDescuadrado ? "text-amber-700" : "text-emerald-600"
                  }`}
                >
                  Diferencia: {formatCurrency(totalesBalance.diferencia)}
                </p>
              </>
            ) : (
              <p>Revisa que cada cuenta tenga un monto ingresado.</p>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm font-medium text-amber-700 sm:items-end">
            {faltanMontos && <span>Complete todas las cuentas para habilitar el guardado.</span>}
            {balanceDescuadrado && tipoEstado === "balance" && !faltanMontos && (
              <span>El balance no cuadra (Activos ≠ Pasivos + Patrimonio).</span>
            )}
          </div>
          <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={!puedeGuardar} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdicion ? "Actualizar Estado" : "Guardar Estado"}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          navigate("/dashboard/estados-financieros")
        }}
        type="success"
        title={successMessage.title}
        footer={
          <Button
            onClick={() => {
              setShowSuccessModal(false)
              navigate("/dashboard/estados-financieros")
            }}
            className="gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Continuar
          </Button>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">{successMessage.description}</p>
      </Modal>
    </div>
  )
}

