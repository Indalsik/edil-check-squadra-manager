
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, Calendar, MapPin, Wallet, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"

interface DashboardOverviewProps {
  onSectionChange: (section: string) => void;
}

export function DashboardOverview({ onSectionChange }: DashboardOverviewProps) {
  const stats = [
    {
      title: "Operai Attivi",
      value: "12",
      description: "3 in più rispetto al mese scorso",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      action: () => onSectionChange("workers")
    },
    {
      title: "Ore Lavorate Oggi",
      value: "94",
      description: "Media di 7.8 ore per operaio",
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100",
      action: () => onSectionChange("timetracking")
    },
    {
      title: "Permessi Pendenti",
      value: "3",
      description: "Da approvare questa settimana",
      icon: Calendar,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      action: () => onSectionChange("permissions")
    },
    {
      title: "Cantieri Attivi",
      value: "5",
      description: "2 nuovi progetti iniziati",
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      action: () => onSectionChange("sites")
    },
  ]

  const recentActivities = [
    {
      id: 1,
      type: "clock-in",
      worker: "Marco Rossi",
      action: "ha iniziato il turno",
      time: "08:30",
      site: "Via Roma 123"
    },
    {
      id: 2,
      type: "permission",
      worker: "Luca Bianchi",
      action: "ha richiesto permesso",
      time: "09:15",
      site: "3 giorni a Marzo"
    },
    {
      id: 3,
      type: "completion",
      worker: "Antonio Verde",
      action: "ha completato il lavoro",
      time: "17:00",
      site: "Piazza Garibaldi 45"
    },
  ]

  const paymentsPreview = [
    {
      worker: "Francesco Neri",
      amount: "€1,240",
      period: "15-30 Gennaio",
      status: "pending"
    },
    {
      worker: "Marco Rossi",
      amount: "€1,580",
      period: "15-30 Gennaio", 
      status: "paid"
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">Panoramica generale della tua squadra edile</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={stat.action}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-600 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Attività Recenti
            </CardTitle>
            <CardDescription>
              Ultimi movimenti della squadra
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-edil-blue rounded-full"></div>
                  <div>
                    <p className="font-medium text-sm">
                      <span className="text-edil-blue">{activity.worker}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-600">{activity.site}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => onSectionChange("timetracking")}
            >
              Vedi Tutte le Attività
            </Button>
          </CardContent>
        </Card>

        {/* Payments Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Pagamenti in Sospeso
            </CardTitle>
            <CardDescription>
              Pagamenti da elaborare questa settimana
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentsPreview.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{payment.worker}</p>
                  <p className="text-xs text-gray-600">{payment.period}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-edil-blue">{payment.amount}</p>
                  <Badge 
                    className={payment.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {payment.status === 'paid' ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Pagato</>
                    ) : (
                      <><AlertCircle className="w-3 h-3 mr-1" /> In Sospeso</>
                    )}
                  </Badge>
                </div>
              </div>
            ))}
            <Button 
              className="w-full mt-4 bg-edil-orange hover:bg-edil-orange/90"
              onClick={() => onSectionChange("payments")}
            >
              Gestisci Pagamenti
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
