
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, MapPin, DollarSign, AlertTriangle, CheckCircle } from "lucide-react"

export function DashboardOverview() {
  const stats = [
    {
      title: "Operai Attivi",
      value: "12",
      description: "In servizio oggi",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Ore Lavorate",
      value: "96",
      description: "Questa settimana",
      icon: Clock,
      color: "text-edil-orange",
    },
    {
      title: "Cantieri Aperti",
      value: "5",
      description: "Progetti attivi",
      icon: MapPin,
      color: "text-green-600",
    },
    {
      title: "Pagamenti da Fare",
      value: "€ 8,450",
      description: "Settimana corrente",
      icon: DollarSign,
      color: "text-red-600",
    },
  ]

  const recentActivity = [
    {
      type: "Ore registrate",
      worker: "Marco Rossi",
      hours: "8h",
      location: "Cantiere Via Roma",
      status: "completed",
      time: "2 ore fa"
    },
    {
      type: "Permesso richiesto",
      worker: "Luca Bianchi",
      hours: "1 giorno",
      location: "Permesso personale",
      status: "pending",
      time: "3 ore fa"
    },
    {
      type: "Pagamento effettuato",
      worker: "Antonio Verde",
      hours: "€ 720",
      location: "Settimana 42",
      status: "completed",
      time: "1 giorno fa"
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attività Recenti
          </CardTitle>
          <CardDescription>
            Ultime operazioni registrate nel sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-4 last:border-b-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {activity.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">{activity.worker}</p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                      {activity.hours}
                    </Badge>
                    <p className="text-muted-foreground mt-1">{activity.location}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
