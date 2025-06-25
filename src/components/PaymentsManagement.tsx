import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, Plus, DollarSign, Calendar, User, Edit, Trash2 } from "lucide-react"
import { database, Worker } from "@/lib/database"
import { PaymentDialog } from "@/components/dialogs/PaymentDialog"
import { toast } from "@/components/ui/sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function PaymentsManagement() {
  const [payments, setPayments] = useState<any[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<any | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await database.init()
    const paymentsData = database.getPayments()
    const workersData = database.getWorkers()
    
    setPayments(paymentsData)
    setWorkers(workersData)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const handleAddPayment = () => {
    setSelectedPayment(null)
    setDialogOpen(true)
  }

  const handleEditPayment = (payment: any) => {
    setSelectedPayment(payment)
    setDialogOpen(true)
  }

  const handleDeletePayment = (payment: any) => {
    setPaymentToDelete(payment)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (paymentToDelete) {
      database.deletePayment(paymentToDelete.id)
      loadData()
      toast.success("Pagamento eliminato con successo")
      setDeleteDialogOpen(false)
      setPaymentToDelete(null)
    }
  }

  const handleSavePayment = (paymentData: any) => {
    if ('id' in paymentData && paymentData.id) {
      database.updatePayment(paymentData.id, paymentData)
      toast.success("Pagamento aggiornato con successo")
    } else {
      database.addPayment(paymentData)
      toast.success("Pagamento registrato con successo")
    }
    loadData()
  }

  const handlePayNow = (payment: any) => {
    const updatedPayment = {
      ...payment,
      status: 'Pagato',
      paidDate: new Date().toISOString().split('T')[0],
      method: 'Bonifico'
    }
    database.updatePayment(payment.id, updatedPayment)
    loadData()
    toast.success(`Pagamento di €${payment.totalAmount} per ${payment.workerName} registrato come pagato`)
  }

  const pendingPayments = payments.filter(p => p.status === 'Da Pagare')
  const recentPayments = payments.filter(p => p.status === 'Pagato')
  const totalPending = pendingPayments.reduce((sum, payment) => sum + payment.totalAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Gestione Pagamenti
          </h2>
          <p className="text-muted-foreground">Monitora e gestisci i pagamenti degli operai</p>
        </div>
        <Button onClick={handleAddPayment} className="bg-edil-orange hover:bg-edil-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Registra Pagamento
        </Button>
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pagamenti in Sospeso
          </CardTitle>
          <CardDescription className="text-white/80">
            Totale da pagare questa settimana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">€ {totalPending.toLocaleString()}</div>
          <p className="text-white/80 mt-2">{pendingPayments.length} operai da pagare</p>
        </CardContent>
      </Card>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pagamenti da Effettuare</CardTitle>
            <CardDescription>
              Lista dei pagamenti settimanali in attesa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-edil-blue text-white rounded-lg flex items-center justify-center font-semibold">
                      {getInitials(payment.workerName)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{payment.workerName}</h3>
                      <p className="text-sm text-muted-foreground">{payment.week}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Ore</p>
                      <p className="font-semibold">{payment.hours}h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Tariffa</p>
                      <p className="font-semibold">€{payment.hourlyRate}/h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Straordinari</p>
                      <p className="font-semibold">{payment.overtime}h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Totale</p>
                      <p className="font-bold text-lg text-edil-orange">€{payment.totalAmount}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handlePayNow(payment)}
                      >
                        Paga Ora
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPayment(payment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeletePayment(payment)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pagamenti Recenti</CardTitle>
            <CardDescription>
              Ultimi pagamenti effettuati
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center font-semibold">
                      {getInitials(payment.workerName)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{payment.workerName}</h3>
                      <p className="text-sm text-muted-foreground">{payment.week}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Importo</p>
                      <p className="font-bold text-green-600">€{payment.totalAmount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Data</p>
                      <p className="font-semibold">{payment.paidDate}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Metodo</p>
                      <Badge variant="outline">{payment.method}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPayment(payment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeletePayment(payment)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        payment={selectedPayment}
        workers={workers}
        onSave={handleSavePayment}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo pagamento? 
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}