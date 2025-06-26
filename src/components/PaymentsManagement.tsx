
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Wallet, Plus, Edit, Trash2, Calendar, DollarSign, CheckCircle, AlertCircle } from "lucide-react"
import { useDatabase } from "@/contexts/DatabaseContext"
import { Payment, Worker } from "@/lib/local-database"
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
  const [payments, setPayments] = useState<Payment[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null)
  const { getPayments, getWorkers, addPayment, updatePayment, deletePayment } = useDatabase()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const paymentsData = await getPayments()
      const workersData = await getWorkers()
      setPayments(paymentsData)
      setWorkers(workersData)
    } catch (error) {
      console.error('Error loading payments:', error)
      toast.error("Errore nel caricamento pagamenti")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pagato":
        return "bg-green-100 text-green-800"
      case "Da Pagare":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const handleAddPayment = () => {
    setSelectedPayment(null)
    setDialogOpen(true)
  }

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setDialogOpen(true)
  }

  const handleDeletePayment = (payment: Payment) => {
    setPaymentToDelete(payment)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (paymentToDelete) {
      try {
        await deletePayment(paymentToDelete.id!)
        loadData()
        toast.success("Pagamento eliminato con successo")
        setDeleteDialogOpen(false)
        setPaymentToDelete(null)
      } catch (error) {
        toast.error("Errore nell'eliminazione pagamento")
      }
    }
  }

  const handleSavePayment = async (paymentData: Omit<Payment, 'id'> | Payment) => {
    try {
      if ('id' in paymentData && paymentData.id) {
        await updatePayment(paymentData.id, paymentData)
        toast.success("Pagamento aggiornato con successo")
      } else {
        await addPayment(paymentData as Omit<Payment, 'id'>)
        toast.success("Pagamento aggiunto con successo")
      }
      loadData()
    } catch (error) {
      toast.error("Errore nel salvataggio pagamento")
    }
  }

  const totalPending = payments.filter(p => p.status === 'Da Pagare').reduce((sum, p) => sum + p.totalAmount, 0)
  const totalPaid = payments.filter(p => p.status === 'Pagato').reduce((sum, p) => sum + p.totalAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Gestione Pagamenti
          </h2>
          <p className="text-muted-foreground">Gestisci i pagamenti degli operai</p>
        </div>
        <Button onClick={handleAddPayment} className="bg-edil-orange hover:bg-edil-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Pagamento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Da Pagare
            </CardTitle>
            <CardDescription>Pagamenti in sospeso</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">€{totalPending.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              {payments.filter(p => p.status === 'Da Pagare').length} pagamenti
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Pagati
            </CardTitle>
            <CardDescription>Pagamenti completati</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">€{totalPaid.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              {payments.filter(p => p.status === 'Pagato').length} pagamenti
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <div className="space-y-4">
        {payments.map((payment) => (
          <Card key={payment.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-edil-blue text-white font-semibold">
                      {getInitials(payment.workerName || 'Unknown')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{payment.workerName}</h3>
                    <p className="text-muted-foreground">{payment.week}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Ore</p>
                    <p className="font-semibold">{payment.hours}h</p>
                  </div>
                  {payment.overtime > 0 && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Straordinari</p>
                      <p className="font-semibold">{payment.overtime}h</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Tariffa</p>
                    <p className="font-semibold">€{payment.hourlyRate}/h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Totale</p>
                    <p className="font-semibold text-lg">€{payment.totalAmount}</p>
                  </div>
                  <div className="text-center">
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                  {payment.status === 'Pagato' && payment.paidDate && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Pagato il</p>
                      <p className="font-medium text-sm">{payment.paidDate}</p>
                      <p className="text-xs text-muted-foreground">{payment.method}</p>
                    </div>
                  )}
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
            </CardContent>
          </Card>
        ))}
      </div>

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
              Sei sicuro di voler eliminare questo pagamento per {paymentToDelete?.workerName}? 
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
