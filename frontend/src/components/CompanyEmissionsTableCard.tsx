"use client"

import { PieChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "./ui/badge"

interface CompanyData {
  id: string
  name: string
  sector_first: string
  co2_emissions_sum: number
  energy_consumption_sum?: number
}

interface CompanyEmissionsTableCardProps {
  data?: CompanyData[]
  className?: string
}

 // Get sector badge color
 const getSectorColor = (sector: string) => {
  switch (sector) {
    case "Transporte":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "Indústria":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
    case "Construção":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    case "Energia":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

export function CompanyEmissionsTableCard({ 
  data, 
  className = "" 
}: CompanyEmissionsTableCardProps) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Company Emissions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">No company data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Company Emissions 
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader>Company</TableHeader>
                <TableHeader>Sector</TableHeader>
                <TableHeader align="right">CO₂ Emissions (tons)</TableHeader>
                <TableHeader align="right">Energy (kWh)</TableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((company) => (
                <TableRow 
                  key={company.id} 
                  company={company} 
                  showEnergy={data[0].energy_consumption_sum !== undefined}
                />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function TableHeader({ 
  children, 
  align = "left" 
}: { 
  children: React.ReactNode 
  align?: "left" | "right" 
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  )
}

function TableRow({ 
  company, 
  showEnergy 
}: { 
  company: CompanyData 
  showEnergy: boolean 
}) {
  return (
    <tr key={company.company_id} className="hover:bg-gray-50">
      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
        {company.name}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
        <span
          className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            getSectorColor(company.sector_first)
          )}
        >
          {company.sector_first}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
        {company.co2_emissions_sum.toLocaleString()}
      </td>
      {showEnergy && (
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
          {company.energy_consumption_sum?.toLocaleString()}
        </td>
      )}
    </tr>
  )
}