"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { File, Paperclip } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import api from "@/lib/api"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { TotalCo2Chart } from "@/components/TotalCo2Chart"
import { EnergyConsumptionChart } from "@/components/EnergyConsumptionChart"
import { ChartColorService } from "@/lib/color-service";
import { TopCompaniesTable } from "@/components/TopCompaniesTable"
import { toast } from "sonner"
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog"
import { getErrorMessage } from "@/lib/utils"


/**
 * Represents a file uploaded to the server.
 */
interface UploadedFile {
  id: string
  name: string
  upload_date: string
}

/**
 * The main component for the emissions dashboard page.
 */
export default function EmissionsDashboard() {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [stats, setStats] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)

  const handleDeleteClick = (fileId: string) => {
    setFileToDelete(fileId)
    setDeleteDialogOpen(true)
  }
  
  // Fetch files on load
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const { data } = await api.get("/files/")
        setUploadedFiles(data)
      } catch (error) {
        console.error("Error fetching files:", error)
      }
    }
    fetchFiles()
  }, [])

  // Fetch both analytics and stats when file is selected
  useEffect(() => {

    const fetchData = async () => {

      toast.promise(
        api.get(`/files/${selectedFileId}/analytics/`),
        {
          loading: 'Fetching analytics...',
          success: async () => {
            return 'Analytics fetched successfully!'
          },
          error: (err) => {
            console.error('Error fetching analytics:', err)
            return 'Error fetching analytics'
          }
        }
      )

      const { data } = await api.get(`/files/${selectedFileId}/stats/`)
      setStats(data)
    }

    if (selectedFileId) {
      fetchData()
    } else {
      setStats(null)
    }
  }, [selectedFileId])
      

  useEffect(() => {
    if (stats) {
      console.log("Stats updated:", stats);
    }
  }, [stats]); // This will log whenever stats changes

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    toast.promise(
      api.post('/upload-file/', formData),
      {
        loading: 'Uploading file...',
        success: async () => {
          const { data } = await api.get('/files/')
          setUploadedFiles(data)
          return 'File uploaded successfully!'
        },
        error: (error) => {
          console.error('Upload failed:', error)
          return 'File upload failed'
        }
      }
    )
  }

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return
    
    try {
      toast.promise(
        api.delete(`/files/${fileToDelete}/delete/`),
        {
          loading: 'Deleting file...',
          success: () => {
            setUploadedFiles(prev => prev.filter(file => file.id !== fileToDelete))
            if (selectedFileId === fileToDelete) setSelectedFileId(null)
            return 'File deleted successfully'
          },
          error: 'Failed to delete file'
        }
      )
    } catch (error) {
      toast.error('Deletion failed', {
        description: getErrorMessage(error)
      })
    } finally {
      setDeleteDialogOpen(false)
      setFileToDelete(null)
    }
  }


  useEffect(() => {
    ChartColorService.reset();
  }, [stats]); // Reset when main data changes

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 flex flex-col sticky top-0 h-screen">
        <header className="p-4 border-b flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          <h2 className="font-semibold text-lg">File Browser</h2>
        </header>

        <ScrollArea className="flex-1 p-4">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className={`flex items-start justify-between p-3 rounded-md mb-2 ${selectedFileId === file.id ? "bg-primary/10" : "bg-muted/50 hover:bg-muted/80"
                }`}
              onClick={() => setSelectedFileId(file.id)}
            >
              <ContextMenu>
                <ContextMenuTrigger>
                  <div className="flex items-start gap-2">
                    <File className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(file.upload_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(file.id);
                  }}>Delete</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </div>
          ))}
        </ScrollArea>

        <footer className="p-4 border-t mt-auto">
          <h3 className="font-medium mb-3">Upload Data</h3>
          <div className="flex gap-2">
            <Input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              className="flex-1 text-sm"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Select File
            </Button>
          </div>
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto p-6">
        {stats ? (<>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <TotalCo2Chart
              tierData={stats.tiers}
              sectorData={stats.sectors}
              companyData={stats.companies}
              metaData={stats.metadata}
            />
            <EnergyConsumptionChart
              tierData={stats.tiers}
              sectorData={stats.sectors}
              companyData={stats.companies}
              metaData={stats.metadata}
            />
          </div>
          <div className="grid grid-cols-1 gap-6 mb-6">
            <TopCompaniesTable
              companyData={stats?.companies}

            />
          </div>
        </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <div className="relative mb-8">
              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center">
                <File className="w-10 h-10 text-gray-300" strokeWidth={1.5} />
              </div>

            </div>

            <h3 className="text-lg font-medium text-gray-600 mb-2">No file selected</h3>
            <p
              className={`text-gray-500 text-center max-w-xs`}
            >
              Please upload and select a file from the sidebar to display it&apos;s data
            </p>
          </div>
        )}
      </main>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)} 
          onConfirm={handleDeleteConfirm}
          title="Delete File"
          description={`Are you sure you want to delete this file? This action cannot be undone.`}
        />
      </div>
    );

}

