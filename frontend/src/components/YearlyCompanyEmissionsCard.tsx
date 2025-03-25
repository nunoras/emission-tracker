"use client"

import { BarChart2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = {
  Transporte: "#3b82f6",
  Indústria: "#8b5cf6",
  Construção: "#f97316",
  Energia: "#10b981",
  default: "#8884d8",
};

interface CompanyYearData {
  year: string
  company_name: string
  co2_emissions_sum: number
  sector: keyof typeof COLORS
}

interface YearlyCompanyEmissionsCardProps {
  data?: CompanyYearData[]
}

export function YearlyCompanyEmissionsCard({ data }: YearlyCompanyEmissionsCardProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Yearly CO₂ Emissions by Company
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">No yearly company data available</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = transformCompanyYearData(data)
  const companies = getUniqueCompanies(data)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart2 className="h-5 w-5" />
          Yearly CO₂ Emissions by Company
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="year" 
              angle={-45} 
              textAnchor="end" 
              height={70}
              tick={{ fontSize: 12 }}
            />
            <YAxis label={{ value: 'CO₂ Emissions (tons)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value: number, name: string) => [`${value.toLocaleString()} tons`, name]}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Legend 
              layout="horizontal" 
              verticalAlign="top" 
              wrapperStyle={{ paddingBottom: 20 }}
            />
            {companies.map(company => (
              <Bar 
                key={company}
                dataKey={company}
                name={company}
                fill={getCompanyColor(company, data)}
                maxBarSize={30}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// Helper functions
function getUniqueCompanies(companyYearData: CompanyYearData[]): string[] {
  return [...new Set(companyYearData.map(item => item.company_name))]
}

function getCompanyColor(company: string, companyYearData: CompanyYearData[]): string {
  const companyData = companyYearData.find(item => item.company_name === company)
  return COLORS[companyData?.sector as keyof typeof COLORS] || COLORS.default
}

function transformCompanyYearData(companyYearData: CompanyYearData[]) {
  const years = [...new Set(companyYearData.map(item => item.year))]
  const companies = getUniqueCompanies(companyYearData)

  return years.map(year => {
    const yearEntry: Record<string, any> = { year }
    
    companies.forEach(company => {
      const companyYearEntry = companyYearData.find(
        item => item.year === year && item.company_name === company
      )
      yearEntry[company] = companyYearEntry?.co2_emissions_sum || 0
    })

    return yearEntry
  })
}