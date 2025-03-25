"use client"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { File, X, BarChart2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { YearlyCompanyEmissionsCard } from "@/components/YearlyCompanyEmissionsCard"
import { SectorEmissionsPieCard } from "@/components/SectorEmissionsPieCard"
import { CompanyEmissionsTableCard } from "@/components/CompanyEmissionsTableCard"

import api from "@/lib/api"

interface UploadedFile {
  id: string
  name: string
  upload_date: string
}

const COLORS = {
  Transporte: "#3b82f6",
  Indústria: "#8b5cf6",
  Construção: "#f97316",
  Energia: "#10b981",
  default: "#8884d8",
};

export default function EmissionsDashboard() {
  const [activeTab, setActiveTab] = useState("yearly")
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

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

  // Fetch analytics when file is selected
  useEffect(() => {
    if (!selectedFileId) return

    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/files/${selectedFileId}`)
        setAnalytics(data.analytics)
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [selectedFileId])

  // Prepare chart data
  const yearlyData = analytics?.by_year?.map((year: any) => ({
    year: year.year.toString(),
    emissions: year.co2_emissions_sum,
  })) || []

  const sectorData = analytics?.by_sector?.map((sector: any) => ({
    name: sector.sector,
    value: sector.co2_emissions_sum,
  })) || []

  const monthlyData = analytics?.by_month?.map((month: any) => ({
    name: month.month,
    emissions: month.co2_emissions_sum,
  })) || []

  const companyData = analytics?.by_company || []

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

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/20 flex flex-col sticky top-0 h-screen">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">File History</h2>
        </div>

        <ScrollArea className="flex-1 p-4">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className={`flex items-start justify-between p-3 rounded-md mb-2 ${selectedFileId === file.id ? "bg-primary/10" : "bg-muted/50 hover:bg-muted/80"
                }`}
              onClick={() => setSelectedFileId(file.id)}
            >
              <div className="flex items-start gap-2">
                <File className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(file.upload_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  // Implement delete
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </ScrollArea>

        <div className="p-4 border-t mt-auto">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Tabs defaultValue="yearly" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
          <div className="border-b px-6 py-3">
            <TabsList>
              <TabsTrigger value="yearly" className="flex items-center gap-1">
                <BarChart2 className="h-4 w-4" />
                Yearly Analysis
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center gap-1">
                <PieChart className="h-4 w-4" />
                Company Comparison
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="yearly" className="flex-1 p-6 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading data...</p>
              </div>
            ) : analytics ? (

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Yearly Emissions Chart */}
                <YearlyCompanyEmissionsCard data={analytics?.by_company_year} />

                {/* Sector Emissions Chart */}
                <SectorEmissionsPieCard data={analytics?.by_sector?.map(s => ({
                  name: s.sector,
                  value: s.co2_emissions_sum
                }))} />
              </div>

            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a file to view data</p>
              </div>
            )}
          </TabsContent>


          <TabsContent value="company" className="flex-1 p-6">
            {analytics ? (
              <div className="grid grid-cols-1 gap-6">
                {/* Company Comparison Table */}
                <CompanyEmissionsTableCard
                  data={analytics?.by_company}
                  className="lg:col-span-2"
                />

                {/* Company Emissions Chart
                <YearlyCompanyEmissionsCard data={analytics?.by_company_year} /> */}

              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select a file to compare companies</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}