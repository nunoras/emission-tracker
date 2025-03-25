from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import UploadedFile, CompanyEmissions
import pandas as pd
from io import BytesIO
from .models import UploadedFile, CompanyEmissions
from .serializers import CompanyEmissionsSerializer 
import datetime

class FileUploadAPI(APIView):    
    def post(self, request):
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file_obj = request.FILES['file']
        
        if file_obj.size > MAX_FILE_SIZE:
            return Response({"error": "File too large (max 10MB)"}, status=413)
        
        try:
            uploaded_file = UploadedFile.objects.create(
                name=file_obj.name  
                # upload_date auto
            )

            df = pd.read_excel(BytesIO(file_obj.read()))
            
            # Criar records de emissoes por linha do excel
            CompanyEmissions.objects.bulk_create([
                CompanyEmissions(
                    file=uploaded_file,
                    name=row['Empresa'],
                    sector=row['Setor'],
                    energy_consumption=row['Consumo de Energia (MWh)'],
                    co2_emissions=row['Emissões de CO2 (toneladas)'],
                    year=int(row['Ano'])
                )
                for _, row in df.iterrows()
            ])

            return Response({
                "status": "success",
                "file_id": uploaded_file.id,
                "records_created": len(df)
            })

        except KeyError as e:
            return Response(
                {"error": f"Missing required column: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Processing failed: {str(e)}"},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
            
class FileInfoAPI(APIView):
    def get(self, request, file_id):
        try:
            emissions = CompanyEmissions.objects.filter(file_id=file_id)
            df = pd.DataFrame.from_records(emissions.values())
            # print(({
            #     "raw_data": CompanyEmissionsSerializer(emissions, many=True).data,
            #     "analytics": {
            #         "by_company": self._analyze_by_company(df),
            #         "by_year": self._analyze_by_year(df),
            #         "by_sector": self._analyze_by_sector(df),
            #         "by_sector_year": self._analyze_sector_year(df),
            #         "by_company_year": self._analyze_company_year(df),
            #     }
            # }))
            return Response({
                "raw_data": CompanyEmissionsSerializer(emissions, many=True).data,
                "analytics": {
                    "by_company": self._analyze_by_company(df),
                    "by_year": self._analyze_by_year(df),
                    "by_sector": self._analyze_by_sector(df),
                    "by_sector_year": self._analyze_sector_year(df),
                    "by_company_year": self._analyze_company_year(df),
                }
            })
            
        except Exception as e:
            return Response({"error": str(e)}, status=400)
            
    def _analyze_by_year(self, df):
        """Yearly performance"""
        return df.groupby('year').agg(
            co2_emissions_sum=('co2_emissions', 'sum'),
            co2_emissions_mean=('co2_emissions', 'mean'),
            co2_emissions_max=('co2_emissions', 'max'),
            co2_emissions_min=('co2_emissions', 'min'),
            energy_consumption_sum=('energy_consumption', 'sum'),
            energy_consumption_mean=('energy_consumption', 'mean'),
            sector_first=('sector', 'first')
        ).reset_index().to_dict(orient='records')
        
    def _analyze_by_sector(self, df):
        """Sector performance"""
        return df.groupby('sector').agg(
            co2_emissions_sum=('co2_emissions', 'sum'),
            co2_emissions_mean=('co2_emissions', 'mean'),
            co2_emissions_max=('co2_emissions', 'max'),
            co2_emissions_min=('co2_emissions', 'min'),
            energy_consumption_sum=('energy_consumption', 'sum'),
            energy_consumption_mean=('energy_consumption', 'mean')
        ).reset_index().to_dict(orient='records')
    
    def _analyze_by_company(self, df):
        """Company performance over all years"""
        return df.groupby('name').agg(
            co2_emissions_sum=('co2_emissions', 'sum'),
            co2_emissions_mean=('co2_emissions', 'mean'),
            co2_emissions_max=('co2_emissions', 'max'),
            co2_emissions_min=('co2_emissions', 'min'),
            energy_consumption_sum=('energy_consumption', 'sum'),
            energy_consumption_mean=('energy_consumption', 'mean'),
            sector_first=('sector', 'first')
        ).reset_index().to_dict(orient='records')

    def _analyze_company_year(self, df):
        """Yearly trends per company"""
        return df.groupby(['name', 'year']).agg(
            co2_emissions_sum=('co2_emissions', 'sum'),
            energy_consumption_sum=('energy_consumption', 'sum'),
            sector_first=('sector', 'first')
        ).reset_index().to_dict(orient='records')

    def _analyze_sector_year(self, df):
        """Sector performance by year"""
        return df.groupby(['sector', 'year']).agg(
            co2_emissions_sum=('co2_emissions', 'sum'),
            co2_emissions_mean=('co2_emissions', 'mean'),
            co2_emissions_count=('co2_emissions', 'count'),
            energy_consumption_sum=('energy_consumption', 'sum'),
            energy_consumption_mean=('energy_consumption', 'mean')
        ).reset_index().to_dict(orient='records')
class FileHistoryAPI(APIView):
    def get(self, request):
        files = UploadedFile.objects.all().values("id", "name", "upload_date")
        return Response(files)
