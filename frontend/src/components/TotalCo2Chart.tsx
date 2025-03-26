"use client"
import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface TotalCo2ChartProps {
  tierData: {
    year: string
    co2_high: number
    co2_medium: number
    co2_low: number
  }[]
  sectorData?: {
    year: string
    [sector: string]: number | string
  }[]
  companyData?: {
    year: string
    companies: {
      name: string
      emissions: number
      consumption: number
      sector: string
    }[]
  }[]
  metaData?: {
    company_list?: string[]
    sectors?: string[]
    years?: string[]
  }
}

export function TotalCo2Chart({ 
  tierData = [], 
  sectorData, 
  companyData,
  metaData = {} 
}: TotalCo2ChartProps) {
  const [viewMode, setViewMode] = useState<"tiers" | "sectors" | "companies">("tiers")

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null

    return (
      <div className="bg-background p-4 border rounded-lg shadow-sm">
        <p className="font-bold">{label}</p>
        <div className="space-y-1">
          {payload
            .filter((entry: any) => entry.value > 0)
            .map((entry: any) => (
              <div key={entry.name} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }} 
                />
                <span className="font-medium">{entry.name}:</span>
                <span className="ml-2 font-bold">
                  {Math.round(entry.value).toLocaleString()} tons
                </span>
              </div>
            ))}
        </div>
      </div>
    )
  }

  // Transform company data using metaData.company_list
  const companyChartData = companyData?.map(yearEntry => {
    const entry: any = { year: yearEntry.year }
    
    // Create lookup for existing company data
    const companyLookup = new Map(
      yearEntry.companies.map(c => [c.name, c.emissions])
    )

    // Use metaData.company_list to maintain consistent order
    metaData?.company_list?.forEach(company => {
      entry[company] = companyLookup.get(company) || 0
    })

    return entry
  })

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(val) => setViewMode(val as "tiers" | "sectors" | "companies")}
      >
        <ToggleGroupItem value="tiers">By Tiers</ToggleGroupItem>
        <ToggleGroupItem value="sectors" disabled={!sectorData}>
          By Sectors
        </ToggleGroupItem>
        <ToggleGroupItem value="companies" disabled={!companyData}>
          By Companies
        </ToggleGroupItem>
      </ToggleGroup>

      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "tiers" ? (
            <BarChart data={tierData}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="co2_high" 
                name="High Emissions" 
                stackId="co2" 
                fill="#ef4444"
                radius={[4, 4, 0, 0]} 
              />
              <Bar 
                dataKey="co2_medium" 
                name="Medium Emissions" 
                stackId="co2" 
                fill="#f59e0b"
              />
              <Bar 
                dataKey="co2_low" 
                name="Low Emissions" 
                stackId="co2" 
                fill="#10b981"
                radius={[0, 0, 4, 4]} 
              />
            </BarChart>
          ) : viewMode === "sectors" ? (
            <BarChart data={sectorData}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {sectorData?.[0] &&
                Object.keys(sectorData[0])
                  .filter(key => key !== "year")
                  .map((sector, index) => (
                    <Bar
                      key={sector}
                      dataKey={sector}
                      name={sector}
                      fill={
                        ["#3b82f6", "#10b981", "#f97316", "#8b5cf6"][index % 4]
                      }
                    />
                  ))}
            </BarChart>
          ) : (
            <BarChart data={companyChartData}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {metaData?.company_list?.map((company, index) => (
                <Bar
                  key={company}
                  dataKey={company}
                  name={company}
                  fill={
                    ["#3b82f6", "#10b981", "#f97316", "#8b5cf6", "#ec4899"][index % 5]
                  }
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}