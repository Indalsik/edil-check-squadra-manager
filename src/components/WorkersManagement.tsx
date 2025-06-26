
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Plus, Edit, Trash2, Phone, Mail } from "lucide-react"
import { useDatabase } from "@/contexts/DatabaseContext"
import { Worker } from "@/lib/local-database"
import { WorkerDialog } from "@/components/dialogs/WorkerDialog"
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

export function WorkersManagement() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null)
  const { getWorkers, addWorker, updateWorker, deleteWorker } = useDatabase()

  useEffect(() => {
    loadWorkers()
  }, [])

  const loadWorkers = async () => {
    try {
      const workersData = await getWorkers()
      setWorkers(workersData)
    } catch (error) {
      console.error('Error loading workers:', error)
      toast.error("Errore nel caricamento operai")
    }
  }

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const handleAddWorker = () => {
    setSelectedWorker(null)
    setDialogOpen(true)
  }

  const handleEditWorker = (worker: Worker) => {
    setSelectedWorker(worker)
    setDialogOpen(true)
  }

  const handleDeleteWorker = (worker: Worker) => {
    setWorkerToDelete(worker)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (workerToDelete) {
      try {
        await deleteWorker(workerToDelete.id!)
        loadWorkers()
        toast.success("Operaio eliminato con successo")
        setDeleteDialogOpen(false)
        setWorkerToDelete(null)
      } catch (error) {
        toast.error("Errore nell'eliminazione operaio")
      }
    }
  }

  const handleSaveWorker = async (workerData: Omit<Worker, 'id'> | Worker) => {
    try {
      if ('id' in workerData && workerData.id) {
        await updateWorker(workerData.id, workerData)
        toast.success("Operaio aggiornato con successo")
      } else {
        await addWorker(workerData as Omit<Worker, 'id'>)
        toast.success("Operaio aggiunto con successo")
      }
      loadWorkers()
    } catch (error) {
      toast.error("Errore nel salvataggio operaio")
    }
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
                      {getInitials(worker.name)}
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
              <div className="grid grid-cols-1 gap-2 text-sm">
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
                  onClick={() => handleEditWorker(worker)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifica
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteWorker(worker)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <WorkerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        worker={selectedWorker}
        onSave={handleSaveWorker}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare l'operaio {workerToDelete?.name}? 
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
