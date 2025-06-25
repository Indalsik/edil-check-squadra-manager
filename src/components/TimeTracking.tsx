
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus, Calendar, MapPin } from "lucide-react"

export function TimeTracking() {
  const timeEntries = [
    {
      id: 1,
      worker: "Marco Rossi",
      date: "2024-01-15",
      startTime: "08:00",
      endTime: "17:00",
      totalHours: 8,
      location: "Cantiere Via Roma",
      project: "Ristrutturazione Palazzo",
      status: "Confermato"
    },
    {
      id: 2,
      worker: "Luca Bianchi",
      date: "2024-01-15",
      startTime: "07:30",
      endTime: "16:30",
      totalHours: 8,
      location: "Cantiere Corso Italia",
      project: "Nuova Costruzione",
      status: "Confermato"
    },
    {
      id: 3,
      worker: "Antonio Verde",
      date: "2024-01-15",
      startTime: "09:00",
      endTime: "13:00",
      totalHours: 4,
      location: "Cantiere Via Roma",
      project: "Impianti Elettrici",
      status: "In Attesa"
    },
    {
      id: 4,
      worker: "Francesco Neri",
      date: "2024-01-15",
      startTime: "08:30",
      endTime: "17:30",
      totalHours: 8,
      location: "Cantiere Piazza Centrale",
      project: "Rifacimento Bagni",
      status: "Confermato"
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confermato":
        return "bg-green-100 text-green-800"
      case "In Attesa":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalHoursToday = timeEntries.reduce((sum, entry) => sum + entry.totalHours, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Ore di Lavoro
          </h2>
          <p className="text-muted-foreground">Tracciamento delle ore lavorate dal team</p>
        </div>
        <Button className="bg-edil-orange hover:bg-edil-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Registra Ore
        </Button>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-edil-blue to-edil-dark-blue text-white">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Riepilogo Giornaliero
          </CardTitle>
          <CardDescription className="text-white/80">
            Lunedì, 15 Gennaio 2024
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-white/80">Ore Totali</p>
              <p className="text-2xl font-bold">{totalHoursToday}h</p>
            </div>
            <div>
              <p className="text-white/80">Operai Attivi</p>
              <p className="text-2xl font-bold">{timeEntries.length}</p>
            </div>
            <div>
              <p className="text-white/80">Cantieri</p>
              <p className="text-2xl font-bold">3</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries */}
      <div className="space-y-4">
        {timeEntries.map((entry) => (
          <Card key={entry.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-edil-blue text-white rounded-lg flex items-center justify-center font-semibold">
                    {entry.worker.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{entry.worker}</h3>
                    <p className="text-muted-foreground">{entry.project}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Inizio</p>
                    <p className="font-semibold">{entry.startTime}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Fine</p>
                    <p className="font-semibold">{entry.endTime}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Totale</p>
                    <p className="font-semibold text-lg">{entry.totalHours}h</p>
                  </div>
                  <div className="text-center">
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{entry.location}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
