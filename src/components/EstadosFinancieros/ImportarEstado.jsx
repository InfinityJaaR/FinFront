import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { ArrowLeft, Download, Save } from "lucide-react"
import { useEstadosFinancieros } from "../../hooks/EstadosFinancieros/useEstadosFinancieros"

export default function ImportarEstadoPage() {
  const navigate = useNavigate()

  const {
    empresas,
    periodos,
    loading,
    error,
    cargarEmpresas,
    cargarPeriodos,
    descargarPlantilla,
    crearEstado,
  } = useEstadosFinancieros()

  const [empresa, setEmpresa] = useState("")
  const [periodo, setPeriodo] = useState("")
  const [tipoEstado, setTipoEstado] = useState("")
  const [archivo, setArchivo] = useState(null)
  const [datosPreview, setDatosPreview] = useState([])
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  const [catalogoCuentas, setCatalogoCuentas] = useState([])

  // Helper para formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value)
  }

  // Cargar empresas y periodos al montar
  useEffect(() => {
    cargarEmpresas()
    cargarPeriodos()
  }, [])

  // Cargar catálogo de cuentas cuando cambia la empresa
  useEffect(() => {
    if (empresa) {
      cargarCatalogoCuentas()
    }
  }, [empresa])

  const cargarCatalogoCuentas = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/catalogo-cuentas/empresa/${empresa}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json',
        }
      })
      const data = await response.json()
      console.log('Respuesta catálogo completa:', data)
      
      // El backend devuelve { success, data: { empresa, cuentas, total } }
      if (data.success && data.data && Array.isArray(data.data.cuentas)) {
        console.log('Catálogo cargado:', data.data.cuentas.length, 'cuentas')
        setCatalogoCuentas(data.data.cuentas)
      } else {
        console.error('Estructura de datos inesperada:', data)
        setCatalogoCuentas([])
      }
    } catch (error) {
      console.error('Error al cargar catálogo de cuentas:', error)
      setCatalogoCuentas([])
    }
  }

  const handleDescargarPlantilla = async () => {
    if (!empresa || !tipoEstado) {
      alert('Selecciona empresa y tipo de estado primero')
      return
    }

    try {
      await descargarPlantilla(parseInt(empresa), tipoEstado === 'balance' ? 'BALANCE' : 'RESULTADOS')
      alert('Plantilla descargada exitosamente')
    } catch (err) {
      alert(err.response?.data?.message || 'Error al descargar plantilla')
      console.error('Error descargando plantilla:', err)
    }
  }

  const handleArchivoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No se seleccionó archivo')
      return
    }

    console.log('Archivo seleccionado:', file.name)
    setArchivo(file)
    setIsLoadingFile(true)

    // Leer y parsear el archivo
    const reader = new FileReader()
    reader.onload = (event) => {
      const contenido = event.target?.result
      console.log('Contenido del archivo cargado, longitud:', contenido?.length)
      if (typeof contenido === "string") {
        const tipo = file.name.endsWith(".csv") ? "csv" : "xml"
        console.log('Tipo de archivo:', tipo)
        parsearArchivo(contenido, tipo)
      }
      setIsLoadingFile(false)
    }
    reader.onerror = (error) => {
      console.error('Error al leer el archivo:', error)
      alert('Error al leer el archivo')
      setIsLoadingFile(false)
    }
    reader.readAsText(file)
  }

  const parsearArchivo = (contenido, tipo) => {
    console.log('=== Iniciando parseo ===')
    console.log('Tipo:', tipo)
    console.log('Primeras 200 caracteres:', contenido.substring(0, 200))
    
    if (tipo === "csv") {
      const lineas = contenido.split("\n")
      console.log('Total de líneas:', lineas.length)
      
      const datos = []

      // Saltar la primera línea (encabezados)
      for (let i = 1; i < lineas.length; i++) {
        const linea = lineas[i].trim()
        
        if (!linea) {
          console.log(`Línea ${i}: vacía, saltando`)
          continue
        }
        
        console.log(`Línea ${i}: "${linea}"`)
        
        // Método simple: split por coma, pero respetando comillas
        let valores = []
        let valorActual = ''
        let dentroDeComillas = false
        
        for (let j = 0; j < linea.length; j++) {
          const char = linea[j]
          
          if (char === '"') {
            dentroDeComillas = !dentroDeComillas
          } else if (char === ',' && !dentroDeComillas) {
            valores.push(valorActual.trim())
            valorActual = ''
          } else {
            valorActual += char
          }
        }
        // Agregar el último valor
        valores.push(valorActual.trim())
        
        console.log(`Valores encontrados:`, valores)
        
        if (valores.length < 3) {
          console.log(`Línea ${i}: solo tiene ${valores.length} valores, saltando`)
          continue
        }
        
        const codigo = valores[0]
        const nombre = valores[1]
        const monto = valores[2]
        
        // Ignorar líneas de categorías (las que empiezan con ===)
        if (codigo && codigo.startsWith('===')) {
          console.log(`Línea ${i}: es separador de categoría, saltando`)
          continue
        }
        
        // Ignorar líneas vacías o sin código numérico válido
        if (!codigo || !/^\d/.test(codigo)) {
          console.log(`Línea ${i}: código inválido "${codigo}", saltando`)
          continue
        }
        
        if (codigo && nombre && monto) {
          // Validar que el monto sea numérico
          const montoNumerico = Number.parseFloat(monto.replace(/[^0-9.-]/g, ""))
          console.log(`Monto parseado: "${monto}" -> ${montoNumerico}`)
          
          if (!isNaN(montoNumerico) && montoNumerico !== 0) {
            const item = {
              id: i,
              codigo,
              cuenta: nombre,
              monto: montoNumerico,
            }
            console.log(`✓ Agregando:`, item)
            datos.push(item)
          } else {
            console.log(`Línea ${i}: monto inválido o cero, saltando`)
          }
        }
      }

      console.log('=== Parseo completado ===')
      console.log('Total de datos parseados:', datos.length)
      console.log('Datos:', datos)
      
      // Calcular cuentas agregadas/calculadas
      const datosConCalculadas = calcularCuentasAgregadas(datos)
      console.log('Datos con calculadas:', datosConCalculadas)
      
      setDatosPreview(datosConCalculadas)
    }
  }

  /**
   * Calcula las cuentas agregadas (padres) basándose en las cuentas hijas
   * Ejemplo: 1.1 = suma de todas las cuentas que empiezan con 1.1.
   *          1 = suma de todas las cuentas que empiezan con 1.
   */
  const calcularCuentasAgregadas = (cuentasBase) => {
    const codigosExistentes = new Set(cuentasBase.map(c => c.codigo))
    
    // Función para obtener todos los niveles padre de un código
    const obtenerCodigosPadre = (codigo) => {
      const padres = []
      const partes = codigo.split('.')
      
      // Generar códigos padre: "1.1.01.01" -> ["1.1.01", "1.1", "1"]
      for (let i = partes.length - 1; i > 0; i--) {
        const codigoPadre = partes.slice(0, i).join('.')
        padres.push(codigoPadre)
      }
      
      return padres
    }
    
    // Recopilar todos los códigos padre únicos que necesitamos calcular
    const codigosPadreNecesarios = new Set()
    cuentasBase.forEach(cuenta => {
      const padres = obtenerCodigosPadre(cuenta.codigo)
      padres.forEach(padre => {
        if (!codigosExistentes.has(padre)) {
          codigosPadreNecesarios.add(padre)
        }
      })
    })
    
    console.log('Códigos padre a calcular:', Array.from(codigosPadreNecesarios))
    
    // Ordenar códigos padre por profundidad (más profundos primero)
    // Esto asegura que calculemos de abajo hacia arriba
    const codigosPadreOrdenados = Array.from(codigosPadreNecesarios).sort((a, b) => {
      const nivelA = a.split('.').length
      const nivelB = b.split('.').length
      return nivelB - nivelA // Mayor nivel primero (ej: 1.1.01 antes que 1.1)
    })
    
    console.log('Códigos padre ordenados:', codigosPadreOrdenados)
    
    // Mapa para almacenar montos calculados
    const montosCalculados = new Map()
    
    // Guardar montos de cuentas base
    cuentasBase.forEach(cuenta => {
      montosCalculados.set(cuenta.codigo, cuenta.monto)
    })
    
    // Calcular cada código padre sumando TODOS sus hijos (directos e indirectos)
    const cuentasCalculadas = []
    codigosPadreOrdenados.forEach(codigoPadre => {
      // Encontrar TODAS las cuentas que son hijas de este padre
      // (tanto en cuentasBase como en las ya calculadas)
      let montoTotal = 0
      
      // Sumar de cuentas base
      cuentasBase.forEach(cuenta => {
        if (cuenta.codigo.startsWith(codigoPadre + '.')) {
          // Verificar que sea hija directa (no nieta)
          const resto = cuenta.codigo.substring(codigoPadre.length + 1)
          const niveles = resto.split('.')
          if (niveles.length === 1) {
            montoTotal += cuenta.monto
          }
        }
      })
      
      // Sumar de cuentas ya calculadas
      cuentasCalculadas.forEach(cuentaCalc => {
        if (cuentaCalc.codigo.startsWith(codigoPadre + '.')) {
          // Verificar que sea hija directa
          const resto = cuentaCalc.codigo.substring(codigoPadre.length + 1)
          const niveles = resto.split('.')
          if (niveles.length === 1) {
            montoTotal += cuentaCalc.monto
          }
        }
      })
      
      console.log(`Código ${codigoPadre}: monto calculado = ${montoTotal}`)
      
      // Buscar el nombre de esta cuenta en el catálogo
      const cuentaEnCatalogo = catalogoCuentas.find(c => c.codigo === codigoPadre)
      
      const cuentaCalculada = {
        id: `calc_${codigoPadre}`,
        codigo: codigoPadre,
        cuenta: cuentaEnCatalogo?.nombre || getNombrePorCodigo(codigoPadre),
        monto: montoTotal,
        esCalculada: true
      }
      
      cuentasCalculadas.push(cuentaCalculada)
      montosCalculados.set(codigoPadre, montoTotal)
    })
    
    console.log('Cuentas calculadas:', cuentasCalculadas)
    
    // Combinar cuentas base con calculadas y ordenar por código
    const todasLasCuentas = [...cuentasBase, ...cuentasCalculadas]
    todasLasCuentas.sort((a, b) => {
      // Comparar códigos como strings para mantener orden jerárquico
      return a.codigo.localeCompare(b.codigo, undefined, { numeric: true })
    })
    
    return todasLasCuentas
  }
  
  /**
   * Obtener nombre genérico para códigos padre
   */
  const getNombrePorCodigo = (codigo) => {
    const mapeo = {
      '1': 'ACTIVO',
      '1.1': 'ACTIVO CORRIENTE',
      '1.2': 'ACTIVO NO CORRIENTE',
      '2': 'PASIVO',
      '2.1': 'PASIVO CORRIENTE',
      '2.2': 'PASIVO NO CORRIENTE',
      '3': 'PATRIMONIO',
      '4': 'INGRESOS',
      '5': 'COSTOS',
      '6': 'GASTOS',
      '7': 'OTROS RESULTADOS'
    }
    
    return mapeo[codigo] || `Cuenta ${codigo}`
  }

  const handleGuardar = async () => {
    if (!empresa || !periodo || !tipoEstado || datosPreview.length === 0) {
      alert('Por favor completa todos los campos y sube un archivo')
      return
    }

    console.log('Catálogo actual:', catalogoCuentas)
    console.log('Es array?', Array.isArray(catalogoCuentas))
    console.log('Length:', catalogoCuentas?.length)

    if (!Array.isArray(catalogoCuentas) || catalogoCuentas.length === 0) {
      alert('No se ha cargado el catálogo de cuentas para esta empresa. Intenta seleccionar la empresa nuevamente.')
      return
    }

    try {
      // Convertir códigos a IDs usando el catálogo de cuentas
      const detalles = []
      const cuentasNoEncontradas = []
      
      for (const item of datosPreview) {
        console.log(`Buscando código: ${item.codigo}`)
        const cuenta = catalogoCuentas.find(c => c.codigo === item.codigo)
        
        if (!cuenta) {
          console.warn(`⚠️ Cuenta ${item.codigo} (${item.cuenta}) NO encontrada en catálogo - se omitirá`)
          cuentasNoEncontradas.push(`${item.codigo} - ${item.cuenta}`)
          continue // Omitir esta cuenta en lugar de lanzar error
        }
        
        console.log(`✓ Encontrada cuenta: ${cuenta.codigo} -> ID: ${cuenta.id}`)
        
        detalles.push({
          catalogo_cuenta_id: cuenta.id,
          monto: item.monto
        })
      }

      // Mostrar resumen
      console.log(`=== RESUMEN ===`)
      console.log(`Total cuentas en preview: ${datosPreview.length}`)
      console.log(`Cuentas a enviar: ${detalles.length}`)
      console.log(`Cuentas omitidas: ${cuentasNoEncontradas.length}`)
      if (cuentasNoEncontradas.length > 0) {
        console.log('Cuentas omitidas (no están en catálogo):', cuentasNoEncontradas)
      }

      if (detalles.length === 0) {
        alert('No hay cuentas válidas para guardar. Todas las cuentas fueron omitidas porque no existen en el catálogo de la empresa.')
        return
      }

      const datos = {
        empresa_id: parseInt(empresa),
        periodo_id: parseInt(periodo),
        tipo: tipoEstado === 'balance' ? 'BALANCE' : 'RESULTADOS',
        detalles: detalles
      }

      console.log('Datos a enviar:', datos)

      await crearEstado(datos)
      
      let mensaje = 'Estado financiero creado exitosamente'
      if (cuentasNoEncontradas.length > 0) {
        mensaje += `\n\nNota: ${cuentasNoEncontradas.length} cuenta(s) calculada(s) fueron omitidas porque no existen en el catálogo de la empresa.`
      }
      
      alert(mensaje)
      navigate('/dashboard/estados-financieros')
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al crear el estado financiero'
      console.error('Error completo:', err)
      console.error('Respuesta del servidor:', err.response?.data)
      alert(`Error: ${errorMsg}`)
    }
  }

  const puedeSubirArchivo = empresa && periodo && tipoEstado
  const puedeGuardar = datosPreview.length > 0

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Importar Estado Financiero</h1>
            <p className="text-muted-foreground">Sube un archivo CSV o XML con las cuentas y montos</p>
          </div>
        </div>

        {/* Selección de Empresa, Año y Tipo de Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
            <CardDescription>Selecciona la empresa, año y tipo de estado antes de subir el archivo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Select value={empresa} onValueChange={setEmpresa}>
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
                <Select value={periodo} onValueChange={setPeriodo}>
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
                <Select value={tipoEstado} onValueChange={setTipoEstado}>
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
          </CardContent>
        </Card>

        {/* Subir Archivo */}
        <Card>
          <CardHeader>
            <CardTitle>Subir Archivo</CardTitle>
            <CardDescription>Descarga la plantilla, complétala y súbela aquí</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" onClick={handleDescargarPlantilla} className="gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Descargar Plantilla CSV
            </Button>

            <div className="space-y-2">
              <Label htmlFor="archivo">Archivo CSV</Label>
              <Input
                id="archivo"
                type="file"
                accept=".csv"
                onChange={handleArchivoChange}
                disabled={!puedeSubirArchivo || isLoadingFile}
                className="flex-1"
              />
              {!puedeSubirArchivo && (
                <p className="text-sm text-muted-foreground">
                  Selecciona empresa, periodo y tipo de estado antes de subir el archivo
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Previsualización */}
        {datosPreview.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Previsualización de Datos</CardTitle>
              <CardDescription>Revisa los datos antes de guardar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Nombre de Cuenta
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosPreview.map((dato) => (
                      <tr 
                        key={dato.id} 
                        className={`border-b ${dato.esCalculada ? 'bg-blue-50 dark:bg-blue-950/30 font-semibold' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm text-foreground font-mono">
                          {dato.codigo}
                          {dato.esCalculada && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(calc)</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{dato.cuenta}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                          {formatCurrency(dato.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td className="px-4 py-3 text-sm text-foreground" colSpan="2">Total</td>
                      <td className="px-4 py-3 text-right text-sm text-foreground">
                        {formatCurrency(datosPreview.reduce((sum, d) => sum + d.monto, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Cancelar
                </Button>
                <Button onClick={handleGuardar} disabled={!puedeGuardar} className="gap-2">
                  <Save className="h-4 w-4" />
                  Guardar Estado Financiero
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
