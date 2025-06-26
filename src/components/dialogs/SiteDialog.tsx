
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Site } from "@/lib/local-database"

interface SiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  site?: Site | null
  onSave: (site: Omit<Site, 'id'> | Site) => void
}

export function SiteDialog({ open, onOpenChange, site, onSave }: SiteDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    owner: '',
    address: '',
    status: 'Attivo',
    startDate: '',
    estimatedEnd: ''
  })

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        owner: site.owner,
        address: site.address,
        status: site.status,
        startDate: site.startDate,
        estimatedEnd: site.estimatedEnd
      })
    } else {
      setFormData({
        name: '',
        owner: '',
        address: '',
        status: 'Attivo',
        startDate: '',
        estimatedEnd: ''
      })
    }
  }, [site, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (site) {
      onSave({ ...site, ...formData })
    } else {
      onSave(formData)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{site ? 'Modifica Cantiere' : 'Nuovo Cantiere'}</DialogTitle>
          <DialogDescription>
            {site ? 'Modifica i dati del cantiere' : 'Inserisci i dati del nuovo cantiere'}
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
              <Label htmlFor="owner" className="text-right">Proprietario</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Indirizzo</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  <SelectItem value="In Pausa">In Pausa</SelectItem>
                  <SelectItem value="Completato">Completato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">Data Inizio</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estimatedEnd" className="text-right">Fine Prevista</Label>
              <Input
                id="estimatedEnd"
                type="date"
                value={formData.estimatedEnd}
                onChange={(e) => setFormData({ ...formData, estimatedEnd: e.target.value })}
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
