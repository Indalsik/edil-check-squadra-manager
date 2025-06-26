
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Payment, Worker } from "@/lib/local-database"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment?: any | null
  workers: Worker[]
  onSave: (payment: Omit<Payment, 'id'> | any) => void
}

export function PaymentDialog({ open, onOpenChange, payment, workers, onSave }: PaymentDialogProps) {
  const [formData, setFormData] = useState({
    workerId: 0,
    week: '',
    hours: 0,
    hourlyRate: 0,
    totalAmount: 0,
    overtime: 0,
    status: 'Da Pagare',
    paidDate: '',
    method: ''
  })

  useEffect(() => {
    if (payment) {
      setFormData({
        workerId: payment.workerId,
        week: payment.week,
        hours: payment.hours,
        hourlyRate: payment.hourlyRate,
        totalAmount: payment.totalAmount,
        overtime: payment.overtime || 0,
        status: payment.status,
        paidDate: payment.paidDate || '',
        method: payment.method || ''
      })
    } else {
      const currentWeek = `Settimana ${Math.ceil(new Date().getDate() / 7)}/${new Date().getFullYear()}`
      setFormData({
        workerId: 0,
        week: currentWeek,
        hours: 40,
        hourlyRate: 15,
        totalAmount: 600,
        overtime: 0,
        status: 'Da Pagare',
        paidDate: '',
        method: ''
      })
    }
  }, [payment, open])

  const calculateTotal = (hours: number, rate: number, overtime: number) => {
    const regularPay = hours * rate
    const overtimePay = overtime * rate * 1.5
    return regularPay + overtimePay
  }

  const handleWorkerChange = (workerId: string) => {
    const worker = workers.find(w => w.id === parseInt(workerId))
    if (worker) {
      const newFormData = { ...formData, workerId: parseInt(workerId), hourlyRate: worker.hourlyRate }
      newFormData.totalAmount = calculateTotal(newFormData.hours, worker.hourlyRate, newFormData.overtime)
      setFormData(newFormData)
    }
  }

  const handleHoursChange = (field: 'hours' | 'overtime', value: number) => {
    const newFormData = { ...formData, [field]: value }
    newFormData.totalAmount = calculateTotal(
      field === 'hours' ? value : formData.hours,
      formData.hourlyRate,
      field === 'overtime' ? value : formData.overtime
    )
    setFormData(newFormData)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (payment) {
      onSave({ ...payment, ...formData })
    } else {
      onSave(formData)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{payment ? 'Modifica Pagamento' : 'Nuovo Pagamento'}</DialogTitle>
          <DialogDescription>
            {payment ? 'Modifica i dati del pagamento' : 'Registra un nuovo pagamento'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workerId" className="text-right">Operaio</Label>
              <Select value={formData.workerId.toString()} onValueChange={handleWorkerChange}>
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
              <Label htmlFor="week" className="text-right">Settimana</Label>
              <Input
                id="week"
                value={formData.week}
                onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="hours" className="text-right">Ore</Label>
              <Input
                id="hours"
                type="number"
                step="0.25"
                value={formData.hours}
                onChange={(e) => handleHoursChange('hours', parseFloat(e.target.value) || 0)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="overtime" className="text-right">Straordinari</Label>
              <Input
                id="overtime"
                type="number"
                step="0.25"
                value={formData.overtime}
                onChange={(e) => handleHoursChange('overtime', parseFloat(e.target.value) || 0)}
                className="col-span-3"
              />
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="totalAmount" className="text-right">Totale</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={formData.totalAmount}
                className="col-span-3"
                readOnly
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Stato</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Da Pagare">Da Pagare</SelectItem>
                  <SelectItem value="Pagato">Pagato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === 'Pagato' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="paidDate" className="text-right">Data Pagamento</Label>
                  <Input
                    id="paidDate"
                    type="date"
                    value={formData.paidDate}
                    onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="method" className="text-right">Metodo</Label>
                  <Select value={formData.method} onValueChange={(value) => setFormData({ ...formData, method: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Seleziona metodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bonifico">Bonifico</SelectItem>
                      <SelectItem value="Contanti">Contanti</SelectItem>
                      <SelectItem value="Assegno">Assegno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
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
