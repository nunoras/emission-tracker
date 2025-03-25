"use client";
import { Bar } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Co2Chart({
  yearlyData = [],
  sectorData = []
}: {
  yearlyData: any[];
  sectorData: any[];
}) {
  // Yearly Emissions Chart
  const yearlyChartData = {
    labels: yearlyData.map(d => d?.year?.toString() || 'Unknown'),
    datasets: [{
      label: "Total CO2 Emissions (tons)",
      data: yearlyData.map(d => d?.co2_emissions_sum || 0),
      backgroundColor: "#3b82f6",
    }]
  };

  // Sector Comparison Chart
  const sectorChartData = {
    labels: sectorData.map(d => d?.sector || 'Unknown'),
    datasets: [{
      label: "CO2 Emissions by Sector (tons)",
      data: sectorData.map(d => d?.co2_emissions_sum || 0),
      backgroundColor: "#10b981",
    }]
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">Yearly Emissions</h3>
        <Bar 
          data={yearlyChartData}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'top' },
            }
          }}
        />
      </div>
      
      <div>
        <h3 className="font-medium mb-2">Sector Comparison</h3>
        <Bar 
          data={sectorChartData}
          options={{
            indexAxis: 'y' as const,
            responsive: true,
            plugins: {
              legend: { position: 'top' },
            }
          }}
        />
      </div>
    </div>
  );
}