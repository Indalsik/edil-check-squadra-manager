
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, Plus, DollarSign, Calendar, User } from "lucide-react"

export function PaymentsManagement() {
  const pendingPayments = [
    {
      id: 1,
      worker: "Marco Rossi",
      week: "Settimana 02/2024",
      hours: 40,
      hourlyRate: 18,
      totalAmount: 720,
      overtime: 0,
      status: "Da Pagare"
    },
    {
      id: 2,
      worker: "Luca Bianchi",
      week: "Settimana 02/2024",
      hours: 38,
      hourlyRate: 15,
      totalAmount: 570,
      overtime: 2,
      status: "Da Pagare"
    },
    {
      id: 3,
      worker: "Francesco Neri",
      week: "Settimana 02/2024",
      hours: 42,
      hourlyRate: 19,
      totalAmount: 798,
      overtime: 4,
      status: "Da Pagare"
    },
  ]

  const recentPayments = [
    {
      id: 1,
      worker: "Antonio Verde",
      week: "Settimana 01/2024",
      amount: 800,
      paidDate: "2024-01-12",
      method: "Bonifico"
    },
    {
      id: 2,
      worker: "Marco Rossi",
      week: "Settimana 01/2024",
      amount: 720,
      paidDate: "2024-01-12",
      method: "Contanti"
    },
  ]

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
        <Button className="bg-edil-orange hover:bg-edil-orange/90">
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
                    {payment.worker.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold">{payment.worker}</h3>
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
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Paga Ora
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamenti Recenti</CardTitle>
          <CardDescription>
            Ultimi pagamenti effettuati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-600 text-white rounded-lg flex items-center justify-center font-semibold">
                    {payment.worker.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold">{payment.worker}</h3>
                    <p className="text-sm text-muted-foreground">{payment.week}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Importo</p>
                    <p className="font-bold text-green-600">€{payment.amount}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-semibold">{payment.paidDate}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Metodo</p>
                    <Badge variant="outline">{payment.method}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
