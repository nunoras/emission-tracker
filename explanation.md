## Solution Explanation

### Decision Log

## 1. Backend Framework Selection
**Decision**: Use Django + Django REST Framework  
**Alternatives Considered**: Flask, FastAPI, Node.js  
**Rationale**:  
- Built-in admin interface for data inspection  
- ORM simplifies PostgreSQL integration  
- Pandas compatibility for Excel processing  
- Had Past experience 
- Python is great for data manipulation (pandas, np)

---

## 2. Data Processing Approach
**Decision**: Two-pass aggregation with numpy percentiles  
**Alternatives**:  
- Fixed threshold tiers (e.g., >1000 tonnes = High)  
- SQL window functions  
**Why Chosen**:  
- Adapts to yearly data variance  
- Reduces database load vs. real-time calculations  
**Code Reference**:  
```python
# FileStatsView.py
co2_high = np.percentile(emissions_values, 75)
```

### File Upload Validation
**Decision**: Implement strict schema validation  

**Validated Properties**:
- **Required Columns**: Empresa, Setor, etc.
- **Year**: Must be an integer
- **File Size**: Maximum 10MB

**Tradeoffs**:
- ✅ Ensures data integrity
- ❌ May reject files with minor formatting errors

4. Frontend Architecture  
**Decision**: Next.js App Router + Shadcn/ui + Recharts
**Key Benefits**:  
- Had past experience (personal projects)
- Shadcn allows for fast prototyping & ui design
- Recharts handles complex visualizations  

### File Upload & Processing (`FileUploadView`)

**1. Validation Layer**
```python
# Size check (10MB max)
if file_obj.size > MAX_FILE_SIZE:
    return Response({"error": "File too large"}, status=413)

# Schema validation
required_columns = {"Empresa", "Setor", "Consumo de Energia (MWh)", ...}
if not required_columns.issubset(df.columns):
    return Response({"error": "Invalid file schema"}, status=400)
```

**2. Data Transformation** 

- Converts Excel rows to Django model instances
- Handles type conversion (e.g., "Ano" to integer)
- Utilizes bulk creation for performance improvements

**3. Error Handling**

| Error Case       | HTTP Status | Response Example                       |
|------------------|-------------|----------------------------------------|
| Missing file     | 400         | {"error": "No file provided"}          |
| Invalid schema   | 400         | {"error": "Missing column: Empresa"}   |
| Processing error | 422         | {"error": "Invalid year value"}        |




Statistics Generation (`FileStatsView`)
=============================

### Tier Classification

Tiers are determined using percentiles of the data (with numpy):

*   `co2_high`: 75th percentile of emissions (top 25% emitters)
*   `energy_medium`: 50th percentile of energy consumption (middle 50%)
*   `energy_low`: 25th percentile of energy consumption (bottom 25%)

### Sector Aggregation

Groups by primary sector (first sector listed)
Tracks both emissions and energy metrics

### Company Ranking

Preserves sector associations

Response Structure
```javascript
{
  "tiers": [ // Annual tier breakdown
    {
      "year": "2023",
      "co2_high": 1500,  // Total emissions in tier
      "energy_low": 200   // Total energy in tier
    }
  ],
  "sectors": [ // Sector trends
    {
      "year": "2023",
      "Construction": 1200,         // Sector emissions
      "Construction_energy": 3000    // Sector energy 
    }
  ],
  "metadata": { // Dataset summary
    "years": ["2022", "2023"],
    "company_count": 42
  },
  "companies": [ // Top 5 companies (default)
    {
      "name": "Company 1",
      "sector": "Construction",
      "emissions": 300,
      "energy": 1000
    },
    {
      "name": "Company 2",
      "sector": "Manufacturing",
      "emissions": 200,
      "energy": 500
    }
  ]
}
```

## Key Technical Decisions

### Percentile-Based Tiers

- Adapts dynamically to data distribution
- Provides more accuracy than fixed thresholds

### Two-Pass Processing

- **First pass**: Collect raw data
- **Second pass**: Calculate metrics
- Ensures consistency in analysis

### Bulk Database Operations

- Mitigates N+1 query issues
- Enhances performance for large datasets
