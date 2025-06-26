
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Plus, Edit, Trash2, Users, Building } from "lucide-react"
import { Site, Worker } from "@/lib/local-database"
import { useDatabase } from "@/contexts/DatabaseContext"
import { SiteDialog } from "@/components/dialogs/SiteDialog"
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

export function SitesManagement() {
  const [sites, setSites] = useState<Site[]>([])
  const [siteWorkers, setSiteWorkers] = useState<{ [key: number]: Worker[] }>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null)
  const { getSites, addSite, updateSite, deleteSite, getWorkers } = useDatabase()

  useEffect(() => {
    loadSites()
  }, [])

  const loadSites = async () => {
    const sitesData = await getSites()
    setSites(sitesData)
    
    // Load workers for each site (simplified - all workers for demo)
    const workersData: { [key: number]: Worker[] } = {}
    const allWorkers = await getWorkers()
    sitesData.forEach(site => {
      if (site.id) {
        // For demo, assign some workers randomly to sites
        workersData[site.id] = allWorkers.filter(() => Math.random() > 0.5).slice(0, 2)
      }
    })
    setSiteWorkers(workersData)
  }

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const handleAddSite = () => {
    setSelectedSite(null)
    setDialogOpen(true)
  }

  const handleEditSite = (site: Site) => {
    setSelectedSite(site)
    setDialogOpen(true)
  }

  const handleDeleteSite = (site: Site) => {
    setSiteToDelete(site)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (siteToDelete) {
      await deleteSite(siteToDelete.id!)
      loadSites()
      toast.success("Cantiere eliminato con successo")
      setDeleteDialogOpen(false)
      setSiteToDelete(null)
    }
  }

  const handleSaveSite = async (siteData: Omit<Site, 'id'> | Site) => {
    if ('id' in siteData && siteData.id) {
      await updateSite(siteData.id, siteData)
      toast.success("Cantiere aggiornato con successo")
    } else {
      await addSite(siteData as Omit<Site, 'id'>)
      toast.success("Cantiere aggiunto con successo")
    }
    loadSites()
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
                <p className="text-muted-foreground text-sm mb-2">
                  Operai Assegnati ({siteWorkers[site.id!]?.length || 0})
                </p>
                <div className="flex flex-wrap gap-2">
                  {siteWorkers[site.id!]?.map((worker, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-md text-sm">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-edil-blue text-white text-xs">
                          {getInitials(worker.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{worker.name}</span>
                    </div>
                  )) || <span className="text-sm text-muted-foreground">Nessun operaio assegnato</span>}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditSite(site)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifica
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteSite(site)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SiteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        site={selectedSite}
        onSave={handleSaveSite}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il cantiere {siteToDelete?.name}? 
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
