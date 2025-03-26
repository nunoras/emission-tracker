"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, Medal, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export function CompanyEmissionsTableCard({ 
  data = [], 
  className = "" 
}: CompanyEmissionsTableCardProps) {
  const [sortField, setSortField] = useState<"co2_emissions_sum" | "energy_consumption_sum">("co2_emissions_sum")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [searchTerm, setSearchTerm] = useState("")
  const [sectorFilter, setSectorFilter] = useState<string>("all")

  // Calculate efficiency and prepare data
  const processedData = useMemo(() => {
    if (!data) return []
    
    return data.map(company => ({
      ...company,
      efficiency: company.energy_consumption_sum 
        ? company.co2_emissions_sum / company.energy_consumption_sum 
        : 0
    }))
  }, [data])

  // Get unique sectors for filter
  const sectors = useMemo(() => {
    return Array.from(new Set(processedData.map(company => company.sector_first)))
  }, [processedData])

  // Sort and filter companies
  const sortedAndFilteredCompanies = useMemo(() => {
    return processedData
      .filter(company => 
        (sectorFilter === "all" || company.sector_first === sectorFilter) &&
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1
        return (a[sortField] - b[sortField]) * multiplier
      })
  }, [processedData, sortField, sortDirection, searchTerm, sectorFilter])

  // Toggle sort direction
  const toggleSort = (field: "co2_emissions_sum" | "energy_consumption_sum") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Get rank badge
  const getRankBadge = (index: number) => {
    if (index === 0) return <Medal className="h-5 w-5 text-yellow-500 fill-yellow-500" />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400 fill-gray-400" />
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700 fill-amber-700" />
    return `#${index + 1}`
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

  // Get efficiency indicator
  const getEfficiencyIndicator = (efficiency: number) => {
    if (!processedData.length) return null
    
    const avgEfficiency = processedData.reduce((sum, company) => sum + company.efficiency, 0) / processedData.length
    
    if (efficiency < avgEfficiency * 0.8) {
      return <TrendingDown className="h-4 w-4 text-green-500" />
    } else if (efficiency > avgEfficiency * 1.2) {
      return <TrendingUp className="h-4 w-4 text-red-500" />
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Company Emissions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">No company data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Company Emissions</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="flex-1">
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={sectorFilter} onValueChange={setSectorFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by sector" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {sectors.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="w-[120px]">Sector</TableHead>
                <TableHead className="w-[180px]">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 font-semibold p-0 h-auto"
                    onClick={() => toggleSort("co2_emissions_sum")}
                  >
                    CO₂ Emissions
                    {sortField === "co2_emissions_sum" &&
                      (sortDirection === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />)}
                  </Button>
                </TableHead>
                {processedData[0].energy_consumption_sum !== undefined && (
                  <TableHead className="w-[150px]">
                    <Button
                      variant="ghost"
                      className="flex items-center gap-1 font-semibold p-0 h-auto"
                      onClick={() => toggleSort("energy_consumption_sum")}
                    >
                      Energy
                      {sortField === "energy_consumption_sum" &&
                        (sortDirection === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />)}
                    </Button>
                  </TableHead>
                )}
                {processedData[0].energy_consumption_sum !== undefined && (
                  <TableHead className="w-[80px] text-right">Efficiency</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredCompanies.map((company, index) => (
                <TableRow key={company.id} className="group hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex justify-center items-center">{getRankBadge(index)}</div>
                  </TableCell>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${getSectorColor(company.sector_first)}`}>
                      {company.sector_first}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(100, (company.co2_emissions_sum / processedData[0].co2_emissions_sum) * 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span>
                        {company.co2_emissions_sum.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        tons
                      </span>
                    </div>
                  </TableCell>
                  {company.energy_consumption_sum !== undefined && (
                    <TableCell>
                      {company.energy_consumption_sum.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}{" "}
                      kWh
                    </TableCell>
                  )}
                  {company.energy_consumption_sum !== undefined && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getEfficiencyIndicator(company.efficiency)}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          Showing {sortedAndFilteredCompanies.length} of {processedData.length} companies
        </div>
      </CardContent>
    </Card>
  )
}