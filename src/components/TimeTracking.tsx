import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus, Calendar, MapPin, Edit, Trash2 } from "lucide-react"
import { database, Worker, Site } from "@/lib/database"
import { TimeEntryDialog } from "@/components/dialogs/TimeEntryDialog"
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

export function TimeTracking() {
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<any | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await database.init()
    const entriesData = database.getTimeEntries()
    const workersData = database.getWorkers()
    const sitesData = database.getSites()
    
    setTimeEntries(entriesData)
    setWorkers(workersData)
    setSites(sitesData)
  }

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const handleAddEntry = () => {
    setSelectedEntry(null)
    setDialogOpen(true)
  }

  const handleEditEntry = (entry: any) => {
    setSelectedEntry(entry)
    setDialogOpen(true)
  }

  const handleDeleteEntry = (entry: any) => {
    setEntryToDelete(entry)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (entryToDelete) {
      database.deleteTimeEntry(entryToDelete.id)
      loadData()
      toast.success("Registrazione ore eliminata con successo")
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
    }
  }

  const handleSaveEntry = (entryData: any) => {
    if ('id' in entryData && entryData.id) {
      database.updateTimeEntry(entryData.id, entryData)
      toast.success("Registrazione ore aggiornata con successo")
    } else {
      database.addTimeEntry(entryData)
      toast.success("Ore registrate con successo")
    }
    loadData()
  }

  const totalHoursToday = timeEntries
    .filter(entry => entry.date === new Date().toISOString().split('T')[0])
    .reduce((sum, entry) => sum + entry.totalHours, 0)

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
        <Button onClick={handleAddEntry} className="bg-edil-orange hover:bg-edil-orange/90">
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
            {new Date().toLocaleDateString('it-IT', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
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
              <p className="text-2xl font-bold">{workers.filter(w => w.status === 'Attivo').length}</p>
            </div>
            <div>
              <p className="text-white/80">Cantieri</p>
              <p className="text-2xl font-bold">{sites.filter(s => s.status === 'Attivo').length}</p>
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
                    {getInitials(entry.workerName)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{entry.workerName}</h3>
                    <p className="text-muted-foreground">{entry.siteName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-semibold">{entry.date}</p>
                  </div>
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditEntry(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteEntry(entry)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TimeEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        timeEntry={selectedEntry}
        workers={workers}
        sites={sites}
        onSave={handleSaveEntry}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questa registrazione ore? 
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