# Carbon Emissions Tracker
A web platform for analyzing energy consumption and CO₂ emissions data from DGEG Excel reports, featuring:
- Excel file processing
- Key metrics calculation (emissions by sector, top polluters, etc.)
- Interactive dashboard with charts
- Dockerized deployment

➡️ There's an explanation of this project at [explanation.md](explanation.md)


### Usage
1. Upload a file by clicking on the **Upload File** button on the left-hand side menu.
2. You can delete the uploaded file by right-clicking on it and selecting **Delete File**.
3. Browse insights about the uploaded file on the right-hand side of the page.


## 🚀 Getting Started

### Prerequisites
- Docker 
- Node.js 18+
- Python 3.11+

### Installation
```bash
git clone https://github.com/nunoras/emission-tracker.git
cd emission-tracker
```

# Using Docker (recommended)
```bash
docker-compose up --build
```

# Manually
```bash
cd backend && pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

cd ../frontend
npm install
npm run dev
```

## ✨ Features

- **File Processing**
  - Upload DGEG Excel files (.xlsx)
  - Validate file structure
  - Store processed data

- **Metrics Calculation**
  - Total/Average emissions by year
  - Sector-wise breakdowns
  - Top 5 companies leaderboard

- **Visualization**
  - Interactive charts (CO₂/Energy trends)
  - Sortable data tables

## 🛠️ Tech Stack

**Frontend**:
- Next.js 14 (App Router)
- Shadcn/ui (Tailwind-based components)
- Recharts (data visualization)

**Backend**:
- Django 4.2 (REST API)
- Django REST Framework
- Pandas & Numpy (Excel processing)

**Infrastructure**:
- Docker + Docker Compose
- PostgreSQL


