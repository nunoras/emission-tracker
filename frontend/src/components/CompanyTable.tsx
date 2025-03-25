"use client"
import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Company {
  id: number
  name: string
  sector_first: string
  co2_emissions_sum: number
  energy_consumption_mean: number
  rank: number
}

interface CompanyTableProps {
  companyData: Array<{
    name: string
    sector_first: string
    co2_emissions_sum: number
    energy_consumption_mean: number
    rank: number
  }>
}

export default function CompanyTable({ companyData }: CompanyTableProps) {
  const [sortField, setSortField] = useState<"co2_emissions_sum" | "energy_consumption_mean">("co2_emissions_sum")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [searchTerm, setSearchTerm] = useState("")
  const [sectorFilter, setSectorFilter] = useState<string>("all")
  
  const companiesWithEfficiency = useMemo(() => {
    return companyData.map((company) => ({
      ...company,
      efficiency: company.co2_emissions_sum / company.energy_consumption_mean,
    }))
  }, [companyData])

  const sectors = useMemo(() => {
    return Array.from(new Set(companyData.map((company) => company.sector_first)))
  }, [companyData])

  const sortedAndFilteredCompanies = useMemo(() => {
    return companiesWithEfficiency
      .filter((company) =>
        (sectorFilter === "all" || company.sector_first === sectorFilter) &&
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1
        return (a[sortField] - b[sortField]) * multiplier
      })
  }, [sortField, sortDirection, searchTerm, sectorFilter, companiesWithEfficiency])

  const toggleSort = (field: "co2_emissions_sum" | "energy_consumption_mean") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return `#${rank}`
  }

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

  const getEfficiencyIndicator = (efficiency: number) => {
    const avgEfficiency = companiesWithEfficiency.reduce((sum, company) => sum + company.efficiency, 0) / companiesWithEfficiency.length
    if (efficiency < avgEfficiency * 0.8) return <TrendingDown className="h-4 w-4 text-green-500" />
    if (efficiency > avgEfficiency * 1.2) return <TrendingUp className="h-4 w-4 text-red-500" />
    return null
  }

  const maxEmissions = useMemo(() => {
    return Math.max(...companyData.map(c => c.co2_emissions_sum), 0)
  }, [companyData])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Emissions & Energy Rankings</CardTitle>
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
                    Total Emissions
                    {sortField === "co2_emissions_sum" &&
                      (sortDirection === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />)}
                  </Button>
                </TableHead>
                <TableHead className="w-[150px]">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-1 font-semibold p-0 h-auto"
                    onClick={() => toggleSort("energy_consumption_mean")}
                  >
                    Avg Energy
                    {sortField === "energy_consumption_mean" &&
                      (sortDirection === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />)}
                  </Button>
                </TableHead>
                <TableHead className="w-2 text-right">Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredCompanies.map((company) => (
                <TableRow key={company.name} className="group hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex justify-center items-center">
                      {getRankBadge(sortedAndFilteredCompanies.indexOf(company) + 1)}
                    </div>
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
                            width: `${Math.min(100, (company.co2_emissions_sum / maxEmissions) * 100)}%`,
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
                  <TableCell>
                    {company.energy_consumption_mean.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}{" "}
                    kWh
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {getEfficiencyIndicator(company.efficiency)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="text-xs text-muted-foreground mt-4">
          Showing {sortedAndFilteredCompanies.length} of {companyData.length} companies
        </div>
      </CardContent>
    </Card>
  )
}
