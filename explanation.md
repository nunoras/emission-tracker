# Solution Explanation

## Decision Log

### 1. Backend Framework Selection

**Decision**: Use Django + Django REST Framework  
**Rationale**:  
- Built-in admin interface for data inspection  
- ORM simplifies PostgreSQL integration  
- Python is great for data manipulation (pandas, np)
- Had Past experience 

### 2. Frontend Architecture  

**Decision**: Next.js App Router + Shadcn/ui + Recharts
**Key Benefits**:  
- Had past experience (personal projects)
- Shadcn allows for fast prototyping & ui design
- Recharts handles complex visualizations  

### 3. Data Processing Approach

**Decision**: Two-pass aggregation with numpy percentiles  
**First Pass: Data Collection**
- Iterate through each company's data
- Accumulate emissions and energy consumption figures
- Track sector membership for each company

**Second Pass: Calculation and Classification**
- Determine emission thresholds for categorization
- Assign companies to appropriate emission categories
- Aggregate sector totals based on classifications

**Considerations** 
- A company may belong to multiple sectors. If a company is listed more than once for the same year and sector, their values are summed.

## 4. File Upload Validation (`FileUploadView`)

**Decision**: Implement strict schema validation  

**Validated Properties**:
- **Required Columns**: Empresa, Setor, etc.
- **File Size**: Maximum 10MB

**Tradeoffs**:
- Ensures data integrity
- May reject files with minor formatting errors

## 5. File Processing (`FileUploadView`)

**1. Data Transformation** 

- Converts Excel rows to Django model instances
- Handles type conversion (e.g., "Ano" to integer)
- Utilizes bulk creation for performance improvements

**2. Error Handling**

| Error Case       | HTTP Status | Response Example                       |
|------------------|-------------|----------------------------------------|
| Missing file     | 400         | {"error": "No file provided"}          |
| Invalid schema   | 400         | {"error": "Missing column: Empresa"}   |
| Processing error | 422         | {"error": "Invalid year value"}        |

## Statistics Generation (`FileStatsView`)
### Tier Classification

Tiers are determined using percentiles of the data (with numpy):

*   `co2_high`: 75th percentile of emissions (top 25% emitters)
*   `energy_medium`: 50th percentile of energy consumption (middle 50%)
*   `energy_low`: 25th percentile of energy consumption (bottom 25%)




