
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, DollarSign } from "lucide-react"

export function ArchiveManagement() {
  const archiveData = [
    {
      site: "Ristrutturazione Villa Roma",
      payments: [
        {
          worker: "Marco Rossi",
          week: "Settimana 01/2024",
          amount: 720,
          date: "2024-01-12",
          method: "Bonifico"
        },
        {
          worker: "Luca Bianchi",
          week: "Settimana 01/2024",
          amount: 570,
          date: "2024-01-12",
          method: "Contanti"
        },
        {
          worker: "Antonio Verde",
          week: "Settimana 01/2024",
          amount: 800,
          date: "2024-01-12",
          method: "Bonifico"
        },
      ]
    },
    {
      site: "Nuova Costruzione Garibaldi",
      payments: [
        {
          worker: "Francesco Neri",
          week: "Settimana 01/2024",
          amount: 798,
          date: "2024-01-15",
          method: "Bonifico"
        },
        {
          worker: "Marco Rossi",
          week: "Settimana 01/2024",
          amount: 720,
          date: "2024-01-15",
          method: "Contanti"
        },
      ]
    },
    {
      site: "Ristrutturazione Uffici",
      payments: [
        {
          worker: "Antonio Verde",
          week: "Settimana 52/2023",
          amount: 640,
          date: "2023-12-29",
          method: "Bonifico"
        },
      ]
    },
  ]

  const getTotalBySite = (payments: any[]) => {
    return payments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Archivio Pagamenti
          </h2>
          <p className="text-muted-foreground">Storico completo dei pagamenti per cantiere</p>
        </div>
      </div>

      {archiveData.map((siteData, siteIndex) => (
        <Card key={siteIndex}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{siteData.site}</CardTitle>
                <CardDescription>
                  {siteData.payments.length} pagamenti effettuati
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Totale Cantiere</p>
                <p className="text-2xl font-bold text-edil-orange">
                  €{getTotalBySite(siteData.payments).toLocaleString()}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operaio</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead className="text-right">Importo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siteData.payments.map((payment, paymentIndex) => (
                  <TableRow key={paymentIndex}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-edil-blue text-white rounded-lg flex items-center justify-center text-xs font-semibold">
                          {payment.worker.split(' ').map(n => n[0]).join('')}
                        </div>
                        {payment.worker}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {payment.week}
                      </div>
                    </TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.method}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-600">€{payment.amount}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
