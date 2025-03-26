"use client"
import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ChartColorService } from "@/lib/color-service";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ZapIcon } from "lucide-react"

/**
 * Interface for the props of the EnergyConsumptionChart component.
 */
interface EnergyConsumptionChartProps {
    tierData: {
        year: string
        energy_high: number
        energy_medium: number
        energy_low: number
    }[]
    sectorData?: {
        year: string
        [sector: string]: number | string
    }[]
    companyData?: {
        year: string
        companies: {
            name: string
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

/**
 * Component for displaying energy consumption data.
 * Supports views by tiers, sectors, and companies.
 */
export function EnergyConsumptionChart({
    tierData = [],
    sectorData,
    companyData,
    metaData = {}
}: EnergyConsumptionChartProps) {
    // State to manage the current view mode of the chart
    const [viewMode, setViewMode] = useState<"tiers" | "sectors" | "companies">("sectors")

    /**
     * Formats values into a readable string with units in kWh.
     */
    const formatValue = (value: number) => {
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M kWh`
        if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k kWh`
        return `${value} kWh`
    }

    /**
     * Transforms company data for chart representation.
     */
    const companyChartData = companyData?.map(yearEntry => {
        const entry: any = { year: yearEntry.year }
        const companyLookup = new Map(
            yearEntry.companies.map(c => [c.name, c.consumption])
        )
        metaData?.company_list?.forEach(company => {
            entry[company] = companyLookup.get(company) || 0
        })
        return entry
    })

    /**
     * Custom tooltip for displaying detailed information on hover.
     */
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload) return null
        return (
            <div className="bg-background p-4 border rounded-lg shadow-sm">
                <p className="font-bold">{label}</p>
                <div className="space-y-1">
                    {payload.filter((entry: any) => entry.value > 0).map((entry: any) => (
                        <div key={entry.name} className="flex items-center">
                            <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="font-medium">{entry.name}:</span>
                            <span className="ml-2 font-bold">
                                {formatValue(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <Card className="rounded-sm">
            <CardHeader>
                <div className="flex justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <ZapIcon className="h-5 w-5 text-primary" />
                        Energy Consumption
                    </CardTitle>
                    {/* ToggleGroup for switching between different views */}
                    <ToggleGroup
                        type="single"
                        variant={"outline"}
                        value={viewMode}
                        onValueChange={(val) => {
                            // Only update if a new value was selected (not deselected)
                            if (val) setViewMode(val as "tiers" | "sectors" | "companies")
                        }}
                    >
                        <ToggleGroupItem value="tiers">By Tiers</ToggleGroupItem>
                        <ToggleGroupItem value="sectors" disabled={!sectorData}>
                            By Sectors
                        </ToggleGroupItem>
                        <ToggleGroupItem className="px-8" value="companies" disabled={!companyData}>
                            By Companies
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardHeader>
            <CardContent className="h-[400px]">
                <div className="space-y-4">
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {viewMode === "tiers" ? (
                                <BarChart data={tierData}>
                                    <XAxis dataKey="year" />
                                    <YAxis tickFormatter={value => formatValue(value).replace(' kWh', '')} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar
                                        dataKey="energy_high"
                                        name="High Consumption"
                                        stackId="energy"
                                        fill="#ef4444"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="energy_medium"
                                        name="Medium Consumption"
                                        stackId="energy"
                                        fill="#f59e0b"
                                    />
                                    <Bar
                                        dataKey="energy_low"
                                        name="Low Consumption"
                                        stackId="energy"
                                        fill="#10b981"
                                        radius={[0, 0, 4, 4]}
                                    />
                                </BarChart>
                            ) : viewMode === "sectors" ? (
                                <BarChart data={sectorData}>
                                    <XAxis dataKey="year" />
                                    <YAxis tickFormatter={value => formatValue(value).replace(' kWh', '')} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    {sectorData?.[0] && Object.keys(sectorData[0])
                                        .filter(key => key.endsWith('_energy'))
                                        .map((key) => (
                                            <Bar
                                                key={key}
                                                dataKey={key}
                                                name={key.replace('_energy', '')}
                                                fill={ChartColorService.getSectorColor(key.replace('_energy', ''))}
                                            />
                                        ))}
                                </BarChart>
                            ) : (
                                <BarChart data={companyChartData}>
                                    <XAxis dataKey="year" />
                                    <YAxis tickFormatter={value => formatValue(value).replace(' kWh', '')} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    {metaData?.company_list?.map((company) => (
                                        <Bar
                                            key={company}
                                            dataKey={company}
                                            name={company}
                                            fill={ChartColorService.getCompanyColor(company)}
                                        />
                                    ))}
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
