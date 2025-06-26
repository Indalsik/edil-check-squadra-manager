
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Worker } from "@/lib/local-database"

interface WorkerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  worker?: Worker | null
  onSave: (worker: Omit<Worker, 'id'> | Worker) => void
}

export function WorkerDialog({ open, onOpenChange, worker, onSave }: WorkerDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    status: 'Attivo',
    hourlyRate: 0
  })

  useEffect(() => {
    if (worker) {
      setFormData({
        name: worker.name,
        role: worker.role,
        phone: worker.phone,
        email: worker.email,
        status: worker.status,
        hourlyRate: worker.hourlyRate
      })
    } else {
      setFormData({
        name: '',
        role: '',
        phone: '',
        email: '',
        status: 'Attivo',
        hourlyRate: 0
      })
    }
  }, [worker, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (worker) {
      onSave({ ...worker, ...formData })
    } else {
      onSave(formData)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{worker ? 'Modifica Operaio' : 'Nuovo Operaio'}</DialogTitle>
          <DialogDescription>
            {worker ? 'Modifica i dati dell\'operaio' : 'Inserisci i dati del nuovo operaio'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Ruolo</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Telefono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Stato</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Attivo">Attivo</SelectItem>
                  <SelectItem value="In Permesso">In Permesso</SelectItem>
                  <SelectItem value="Inattivo">Inattivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hourlyRate" className="text-right">Tariffa/h</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit">Salva</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
