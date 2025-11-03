"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function EditAccountDialog({ account, open, onOpenChange, onSave }) {
  const [codigo, setCodigo] = useState("")
  const [nombre, setNombre] = useState("")

  useEffect(() => {
    if (account) {
      setCodigo(account.codigo)
      setNombre(account.nombre)
    }
  }, [account])

  const handleSave = () => {
    if (codigo.trim() && nombre.trim()) {
      onSave({ codigo: codigo.trim(), nombre: nombre.trim() })
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Cuenta</DialogTitle>
          <DialogDescription>Modifica el código y nombre de la cuenta contable</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-codigo">Código de la Cuenta</Label>
            <Input
              id="edit-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: 1.1.01"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-nombre">Nombre de la Cuenta</Label>
            <Input
              id="edit-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Caja General"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!codigo.trim() || !nombre.trim()}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
