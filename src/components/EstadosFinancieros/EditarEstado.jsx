import { useParams } from "react-router-dom"

import NuevoEstadoManualPage from "./NuevoEstadoManual"

export default function EditarEstadoFinancieroPage() {
  const { id } = useParams()

  return <NuevoEstadoManualPage modo="editar" estadoId={id} />
}

