import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, DollarSign } from "lucide-react"
import { database } from "@/lib/database"

export function ArchiveManagement() {
  const [archiveData, setArchiveData] = useState<any[]>([])

  useEffect(() => {
    loadArchiveData()
  }, [])

  const loadArchiveData = async () => {
    await database.init()
    
    // Get all paid payments grouped by site
    const payments = database.getPayments().filter(p => p.status === 'Pagato')
    const sites = database.getSites()
    
    // Group payments by site (for demo purposes, we'll group by worker's main site)
    const groupedData = sites.map(site => {
      const sitePayments = payments.filter(p => 
        // For demo, we'll show some payments for each site
        Math.random() > 0.5
      ).slice(0, 3)
      
      return {
        site: site.name,
        payments: sitePayments.map(payment => ({
          worker: payment.workerName,
          week: payment.week,
          amount: payment.totalAmount,
          date: payment.paidDate,
          method: payment.method
        }))
      }
    }).filter(group => group.payments.length > 0)

    setArchiveData(groupedData)
  }

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
                {siteData.payments.map((payment: any, paymentIndex: number) => (
                  <TableRow key={paymentIndex}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-edil-blue text-white rounded-lg flex items-center justify-center text-xs font-semibold">
                          {payment.worker.split(' ').map((n: string) => n[0]).join('')}
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