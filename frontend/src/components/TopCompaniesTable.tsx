"use client"
import { useState, useMemo } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Building2 } from "lucide-react"

/**
 * Component for displaying top companies by emissions or energy consumption.
 * Allows for searching and toggling between metrics.
 */

interface TopCompaniesTableProps {
    companyData?: {
        year: string
        companies: {
            name: string
            emissions: number
            consumption: number
            sector: string
        }[]
    }[]
    isLoading?: boolean
}

export function TopCompaniesTable({ companyData }: TopCompaniesTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [metric, setMetric] = useState<"emissions" | "consumption">("emissions")

    // Process and flatten company data from all years
    const processedCompanies = useMemo(() => {
        if (!companyData || companyData.length === 0) return []

        // Combine all companies from all years
        const allCompanies = companyData.flatMap(yearData =>
            yearData.companies.map(company => ({
                ...company,
                year: yearData.year
            }))
        )

        return allCompanies
    }, [companyData])

    // Filter and sort companies based on search term and selected metric
    const filteredSortedCompanies = useMemo(() => {
        return [...processedCompanies]
            .filter(company =>
                company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                company.sector.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => b[metric] - a[metric])
    }, [processedCompanies, metric, searchTerm])

    // Determine table title based on selected metric
    const tableTitle = metric === "emissions"
        ? "Companies with the largest carbon footprint"
        : "Companies with highest energy consumption"

    // Display message if no company data is available
    if (processedCompanies.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No company data available</div>
    }

    return (
        <Card className="rounded-sm">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Building2 className="mr-2 h-4 w-4" />
                        <h3 className="text-lg font-semibold">{tableTitle}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                        <Input
                            placeholder="Search companies..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-[200px]"
                        />
                        <ToggleGroup
                            type="single"
                            value={metric}
                            variant={"outline"}
                            onValueChange={(val) => {
                                if (val) setMetric(val as "emissions" | "consumption")
                            }}
                        >
                            <ToggleGroupItem
                                value="emissions"
                                className="px-8 data-[state=on]:bg-background data-[state=on]:text-foreground"
                            >
                                CO2 Emissions
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="consumption"
                                className="data-[state=on]:bg-background data-[state=on]:text-foreground"
                            >
                                Energy
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rank</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Sector</TableHead>
                                <TableHead>Year</TableHead>
                                <TableHead className={metric === "emissions" ? "bg-accent font-bold" : ""}>
                                    CO2 Emissions (tons)
                                </TableHead>
                                <TableHead className={metric === "consumption" ? "bg-accent font-bold" : ""}>
                                    Energy (kWh)
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSortedCompanies.slice(0, 5).map((company, index) => (
                                <TableRow key={`${company.name}-${company.year}`}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">{company.name}</TableCell>
                                    <TableCell>{company.sector}</TableCell>
                                    <TableCell>{company.year}</TableCell>
                                    <TableCell className={metric === "emissions" ? "bg-accent font-bold" : ""}>
                                        {company.emissions.toLocaleString('pt-BR')}
                                    </TableCell>
                                    <TableCell className={metric === "consumption" ? "bg-accent font-bold" : ""}>
                                        {company.consumption.toLocaleString('pt-BR')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
