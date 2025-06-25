
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Plus, Edit, Users, Building } from "lucide-react"

export function SitesManagement() {
  const sites = [
    {
      id: 1,
      name: "Ristrutturazione Villa Roma",
      owner: "Mario Bianchi",
      address: "Via Roma 123, Milano",
      status: "Attivo",
      workers: ["Marco Rossi", "Luca Bianchi", "Antonio Verde"],
      startDate: "2024-01-15",
      estimatedEnd: "2024-03-30"
    },
    {
      id: 2,
      name: "Nuova Costruzione Garibaldi",
      owner: "Edil Costruzioni SRL",
      address: "Piazza Garibaldi 45, Milano",
      status: "Attivo",
      workers: ["Francesco Neri", "Marco Rossi"],
      startDate: "2024-02-01",
      estimatedEnd: "2024-06-15"
    },
    {
      id: 3,
      name: "Ristrutturazione Uffici",
      owner: "Tech Company Ltd",
      address: "Via Montenapoleone 88, Milano",
      status: "In Pausa",
      workers: ["Antonio Verde"],
      startDate: "2024-01-20",
      estimatedEnd: "2024-04-10"
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Attivo":
        return "bg-green-100 text-green-800"
      case "In Pausa":
        return "bg-yellow-100 text-yellow-800"
      case "Completato":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAddSite = () => {
    console.log("Aggiungendo nuovo cantiere...")
    // TODO: Implementare dialogo per aggiungere cantiere
  }

  const handleEditSite = (siteId: number) => {
    console.log("Modificando cantiere:", siteId)
    // TODO: Implementare dialogo per modificare cantiere
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Gestione Cantieri
          </h2>
          <p className="text-muted-foreground">Monitora tutti i cantieri attivi e i loro operai</p>
        </div>
        <Button onClick={handleAddSite} className="bg-edil-orange hover:bg-edil-orange/90">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Cantiere
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {sites.map((site) => (
          <Card key={site.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-edil-blue text-white rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{site.name}</CardTitle>
                    <CardDescription className="font-medium">{site.owner}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(site.status)}>
                  {site.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="text-muted-foreground">Indirizzo</p>
                <p className="font-medium">{site.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Inizio</p>
                  <p className="font-semibold">{site.startDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fine Prevista</p>
                  <p className="font-semibold">{site.estimatedEnd}</p>
                </div>
              </div>
              
              <div>
                <p className="text-muted-foreground text-sm mb-2">Operai Assegnati ({site.workers.length})</p>
                <div className="flex flex-wrap gap-2">
                  {site.workers.map((worker, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-md text-sm">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-edil-blue text-white text-xs">
                          {worker.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span>{worker}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditSite(site.id)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifica
                </Button>
                <Button variant="outline" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100">
                  <Users className="h-4 w-4 mr-1" />
                  Gestisci Operai
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
