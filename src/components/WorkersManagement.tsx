
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Plus, Edit, Trash2, Phone, Mail } from "lucide-react"

export function WorkersManagement() {
  const workers = [
    {
      id: 1,
      name: "Marco Rossi",
      role: "Capocantiere",
      phone: "+39 333 1234567",
      email: "marco.rossi@edilcheck.it",
      status: "Attivo",
      hoursWeek: 40,
      hourlyRate: 18,
      initials: "MR"
    },
    {
      id: 2,
      name: "Luca Bianchi",
      role: "Muratore", 
      phone: "+39 333 7654321",
      email: "luca.bianchi@edilcheck.it",
      status: "Attivo",
      hoursWeek: 38,
      hourlyRate: 15,
      initials: "LB"
    },
    {
      id: 3,
      name: "Antonio Verde",
      role: "Elettricista",
      phone: "+39 333 9876543",
      email: "antonio.verde@edilcheck.it",
      status: "In Permesso",
      hoursWeek: 0,
      hourlyRate: 20,
      initials: "AV"
    },
    {
      id: 4,
      name: "Francesco Neri", 
      role: "Idraulico",
      phone: "+39 333 5432109",
      email: "francesco.neri@edilcheck.it",
      status: "Attivo",
      hoursWeek: 42,
      hourlyRate: 19,
      initials: "FN"
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Attivo":
        return "bg-green-100 text-green-800"
      case "In Permesso":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAddWorker = () => {
    console.log("Aggiungendo nuovo operaio...")
    // TODO: Implementare dialogo per aggiungere operaio
  }

  const handleEditWorker = (workerId: number) => {
    console.log("Modificando operaio:", workerId)
    // TODO: Implementare dialogo per modificare operaio
  }

  const handleDeleteWorker = (workerId: number) => {
    console.log("Eliminando operaio:", workerId)
    // TODO: Implementare conferma ed eliminazione operaio
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Gestione Operai
          </h2>
          <p className="text-muted-foreground">Gestisci la tua squadra di operai edili</p>
        </div>
        <Button onClick={handleAddWorker} className="bg-edil-orange hover:bg-edil-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Operaio
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workers.map((worker) => (
          <Card key={worker.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-edil-blue text-white font-semibold">
                      {worker.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{worker.name}</CardTitle>
                    <CardDescription className="font-medium">{worker.role}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(worker.status)}>
                  {worker.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ore/Settimana</p>
                  <p className="font-semibold">{worker.hoursWeek}h</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tariffa Oraria</p>
                  <p className="font-semibold">€{worker.hourlyRate}/h</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{worker.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{worker.email}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditWorker(worker.id)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifica
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteWorker(worker.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
