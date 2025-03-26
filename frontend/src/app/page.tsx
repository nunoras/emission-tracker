"use client"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { File, X, BarChart2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import api from "@/lib/api"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { TotalCo2Chart } from "@/components/TotalCo2Chart"


interface UploadedFile {
  id: string
  name: string
  upload_date: string
}

export default function EmissionsDashboard() {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!selectedFileId) {
      setAnalytics(null);
      setStats(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch stats data
        const statsResponse = await api.get(`/files/${selectedFileId}/stats/`);
        console.log("Stats response:", statsResponse.data); // Verify the data is correct
        setStats(statsResponse.data); // This will update asynchronously

        // If you need to use the data immediately, use the response directly
        // For example:
        // processStatsData(statsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load emissions data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedFileId]);

  useEffect(() => {
    if (stats) {
      console.log("Stats updated:", stats);
    }
  }, [stats]); // This will log whenever stats changes

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      await api.post("/upload-file/", formData)
      const { data } = await api.get("/files/")
      setUploadedFiles(data)
    } catch (error) {
      console.error("Upload failed:", error)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      await api.delete(`/files/${fileId}/delete/`);
      // Remove the deleted file from state
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
      // If the deleted file was selected, clear the selection
      if (selectedFileId === fileId) {
        setSelectedFileId(null);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      setError("Failed to delete file");
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 flex flex-col sticky top-0 h-screen">
        <header className="p-4 border-b">
          <h2 className="font-semibold text-lg">File History</h2>
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
                    handleDeleteFile(file.id);
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
      <main className="flex-1 flex flex-col overflow-y-auto">

        <TotalCo2Chart
          tierData={stats?.tiers || []} 
          sectorData={stats?.sectors} 
          companyData={stats?.companies} 
          metaData={stats?.metadata || []}
        />

      </main>
    </div>
  );
}
