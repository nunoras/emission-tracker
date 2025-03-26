import { SECTOR_PALETTE, COMPANY_PALETTE } from "./colors";

export class ChartColorService {
  private static sectorAssignments = new Map<string, string>();
  private static companyAssignments = new Map<string, string>();
  private static availableSectorColors = [...SECTOR_PALETTE];
  private static availableCompanyColors = [...COMPANY_PALETTE];

  static getSectorColor(sector: string): string {
    if (this.sectorAssignments.has(sector)) {
      return this.sectorAssignments.get(sector)!;
    }

    if (this.availableSectorColors.length === 0) {
      // Fallback color if palette exhausted
      return "#94a3b8";
    }

    const color = this.availableSectorColors.shift()!;
    this.sectorAssignments.set(sector, color);
    return color;
  }

  static getCompanyColor(company: string): string {
    if (this.companyAssignments.has(company)) {
      return this.companyAssignments.get(company)!;
    }

    if (this.availableCompanyColors.length === 0) {
      // Fallback color if palette exhausted
      return "#64748b";
    }

    const color = this.availableCompanyColors.shift()!;
    this.companyAssignments.set(company, color);
    return color;
  }

  static reset() {
    this.sectorAssignments.clear();
    this.companyAssignments.clear();
    this.availableSectorColors = [...SECTOR_PALETTE];
    this.availableCompanyColors = [...COMPANY_PALETTE];
  }
}