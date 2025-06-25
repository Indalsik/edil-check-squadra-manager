import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TimeEntry, Worker, Site } from "@/lib/database"

interface TimeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timeEntry?: any | null
  workers: Worker[]
  sites: Site[]
  onSave: (entry: Omit<TimeEntry, 'id'> | any) => void
}

export function TimeEntryDialog({ open, onOpenChange, timeEntry, workers, sites, onSave }: TimeEntryDialogProps) {
  const [formData, setFormData] = useState({
    workerId: 0,
    siteId: 0,
    date: '',
    startTime: '',
    endTime: '',
    totalHours: 0,
    status: 'Confermato'
  })

  useEffect(() => {
    if (timeEntry) {
      setFormData({
        workerId: timeEntry.workerId,
        siteId: timeEntry.siteId,
        date: timeEntry.date,
        startTime: timeEntry.startTime,
        endTime: timeEntry.endTime,
        totalHours: timeEntry.totalHours,
        status: timeEntry.status
      })
    } else {
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        workerId: 0,
        siteId: 0,
        date: today,
        startTime: '08:00',
        endTime: '17:00',
        totalHours: 8,
        status: 'Confermato'
      })
    }
  }, [timeEntry, open])

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0
    const startTime = new Date(`2000-01-01T${start}:00`)
    const endTime = new Date(`2000-01-01T${end}:00`)
    const diffMs = endTime.getTime() - startTime.getTime()
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100
  }

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newFormData = { ...formData, [field]: value }
    if (field === 'startTime' || field === 'endTime') {
      newFormData.totalHours = calculateHours(
        field === 'startTime' ? value : formData.startTime,
        field === 'endTime' ? value : formData.endTime
      )
    }
    setFormData(newFormData)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (timeEntry) {
      onSave({ ...timeEntry, ...formData })
    } else {
      onSave(formData)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{timeEntry ? 'Modifica Ore' : 'Registra Ore'}</DialogTitle>
          <DialogDescription>
            {timeEntry ? 'Modifica la registrazione ore' : 'Registra le ore lavorate'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workerId" className="text-right">Operaio</Label>
              <Select value={formData.workerId.toString()} onValueChange={(value) => setFormData({ ...formData, workerId: parseInt(value) })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleziona operaio" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id!.toString()}>
                      {worker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="siteId" className="text-right">Cantiere</Label>
              <Select value={formData.siteId.toString()} onValueChange={(value) => setFormData({ ...formData, siteId: parseInt(value) })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleziona cantiere" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id!.toString()}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startTime" className="text-right">Inizio</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endTime" className="text-right">Fine</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalHours" className="text-right">Ore Totali</Label>
              <Input
                id="totalHours"
                type="number"
                step="0.25"
                value={formData.totalHours}
                onChange={(e) => setFormData({ ...formData, totalHours: parseFloat(e.target.value) || 0 })}
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
                  <SelectItem value="Confermato">Confermato</SelectItem>
                  <SelectItem value="In Attesa">In Attesa</SelectItem>
                </SelectContent>
              </Select>
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