import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, Calendar, MapPin, Wallet, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"
import { database } from "@/lib/database"

interface DashboardOverviewProps {
  onSectionChange: (section: string) => void;
}

export function DashboardOverview({ onSectionChange }: DashboardOverviewProps) {
  const [stats, setStats] = useState({
    activeWorkers: 0,
    activeSites: 0,
    pendingPayments: 0,
    todayHours: 0
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [paymentsPreview, setPaymentsPreview] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    await database.init()
    
    // Load stats
    const dashboardStats = database.getDashboardStats()
    setStats(dashboardStats)

    // Load recent time entries for activities
    const timeEntries = database.getTimeEntries().slice(0, 3)
    const activities = timeEntries.map(entry => ({
      id: entry.id,
      type: "clock-in",
      worker: entry.workerName,
      action: "ha registrato ore",
      time: entry.startTime,
      site: entry.siteName
    }))
    setRecentActivities(activities)

    // Load payments preview
    const payments = database.getPayments()
    const pendingPayments = payments.filter(p => p.status === 'Da Pagare').slice(0, 2)
    const paidPayments = payments.filter(p => p.status === 'Pagato').slice(0, 1)
    setPaymentsPreview([...pendingPayments, ...paidPayments])
  }

  const statsConfig = [
    {
      title: "Operai Attivi",
      value: stats.activeWorkers.toString(),
      description: "Operai attualmente attivi",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      action: () => onSectionChange("workers")
    },
    {
      title: "Ore Lavorate Oggi",
      value: stats.todayHours.toString(),
      description: "Ore registrate oggi",
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100",
      action: () => onSectionChange("timetracking")
    },
    {
      title: "Pagamenti Pendenti",
      value: stats.pendingPayments.toString(),
      description: "Da elaborare",
      icon: Calendar,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      action: () => onSectionChange("payments")
    },
    {
      title: "Cantieri Attivi",
      value: stats.activeSites.toString(),
      description: "Progetti in corso",
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      action: () => onSectionChange("sites")
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
        {statsConfig.map((stat, index) => (
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
              Pagamenti
            </CardTitle>
            <CardDescription>
              Stato dei pagamenti
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentsPreview.map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{payment.workerName}</p>
                  <p className="text-xs text-gray-600">{payment.week}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-edil-blue">€{payment.totalAmount}</p>
                  <Badge 
                    className={payment.status === 'Pagato' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {payment.status === 'Pagato' ? (
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