from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UploadedFile, CompanyEmissions
import pandas as pd
from io import BytesIO
from .models import UploadedFile, CompanyEmissions
from collections import defaultdict
from django.db.models import Avg
import numpy as np
import re 
from django.db import transaction


def natural_sort_key(s):
    """
    Natural sorting key function.

    This function returns a list of strings and integers obtained by
    splitting the input string `s` at each sequence of digits. The
    strings are converted to lower case and the integers are converted
    to integers. This allows strings to be sorted in a natural way (i.e.,
    "file2.txt" comes after "file10.txt").

    Args:
        s (str): The string to be sorted.

    Returns:
        list: A list of strings and integers representing the natural
            sorting key of `s`.
    """
    return [int(text) if text.isdigit() else text.lower() 
            for text in re.split('([0-9]+)', s)]

class FileUploadView(APIView):
    """
    Process an uploaded Excel file and store its contents in the database.
    
    Expected Excel columns:
    - Empresa (string)
    - Setor (string)
    - Consumo de Energia (MWh) (numeric)
    - Emissões de CO2 (toneladas) (numeric)
    - Ano (integer)
    """
    
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    REQUIRED_COLUMNS = {
        "Empresa",
        "Setor",
        "Consumo de Energia (MWh)",
        "Emissões de CO2 (toneladas)",
        "Ano"
    }

    def post(self, request):
        # Validate file exists and is within size limit
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file_obj = request.FILES['file']
        if file_obj.size > self.MAX_FILE_SIZE:
            return Response(
                {"error": f"File exceeds {self.MAX_FILE_SIZE/1e6}MB limit"}, 
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )

        try:
            # Read file content into memory
            file_content = file_obj.read()
            if not file_content:
                return Response({"error": "Empty file provided"}, status=status.HTTP_400_BAD_REQUEST)

            # Try multiple Excel engines
            excel_file = BytesIO(file_content)
            for engine in ['openpyxl', 'xlrd']:
                try:
                    df = pd.read_excel(excel_file, engine=engine)
                    break
                except Exception as e:
                    continue
            else:
                raise ValueError("File is not a valid Excel document or is corrupted")

            # Validate columns
            missing_columns = self.REQUIRED_COLUMNS - set(df.columns)
            if missing_columns:
                return Response(
                    {"error": f"Missing required columns: {', '.join(missing_columns)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Clean data
            df = df.dropna(subset=['Emissões de CO2 (toneladas)', 'Ano'])
            df['Ano'] = pd.to_numeric(df['Ano'], errors='coerce').astype('Int64')

            # Create records
            with transaction.atomic():
                uploaded_file = UploadedFile.objects.create(name=file_obj.name)
                
                CompanyEmissions.objects.bulk_create([
                    CompanyEmissions(
                        file=uploaded_file,
                        name=str(row['Empresa']),
                        sector=str(row['Setor']),
                        energy_consumption=float(row['Consumo de Energia (MWh)']),
                        co2_emissions=float(row['Emissões de CO2 (toneladas)']),
                        year=int(row['Ano'])
                    ) for _, row in df.iterrows() if not pd.isna(row['Ano'])
                ])


            return Response({
                "status": "success",
                "file_id": uploaded_file.id,
                "records_created": len(df),
            })

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {
                    "error": "File processing failed",
                    "detail": str(e)
                },
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
class FileHistoryView(APIView):
    def get(self, request):
        """
        Return a list of uploaded files with their IDs, names, and upload dates.

        Files are ordered by upload date, with the most recent file first.
        """
        
        files = UploadedFile.objects.all().values("id", "name", "upload_date")
        return Response(files)

class FileStatsView(APIView):
    def get(self, request, file_id):
        """
        Return the emissions and energy consumption data for the given file ID.

        Response data is structured as follows:

        * `file_info`: A dictionary containing the file ID, name, and upload date.
        * `tiers`: A list of dictionaries, each containing the year and the sum of emissions and energy consumption for each tier.
        * `sectors`: A list of dictionaries, each containing the year and the sum of emissions and energy consumption for each sector.
        * `companies`: A list of dictionaries, each containing the year and a list of dictionaries for each company, containing the company name, emissions, consumption, and sector.
        * `metadata`: A dictionary containing the list of years, sectors, and companies in the file, as well as the total number of companies.

        :param file_id: The ID of the file to retrieve data for.
        :return: A JSON response containing the requested data.
        """
        try:
            uploaded_file = UploadedFile.objects.get(pk=file_id)
        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)

        queryset = CompanyEmissions.objects.filter(file_id=file_id)
        
        # Initialize data structures
        tier_data = defaultdict(lambda: {
            'co2_high': 0,
            'co2_medium': 0,
            'co2_low': 0,
            'energy_high': 0,
            'energy_medium': 0,
            'energy_low': 0
        })
        
        sector_data = defaultdict(lambda: defaultdict(float))
        company_data = defaultdict(lambda: defaultdict(lambda: {
            'emissions': 0,
            'consumption': 0,
            'sectors': set()
        }))

        # First pass: Aggregate all data by year and company
        for entry in queryset.values('year', 'name', 'sector', 'co2_emissions', 'energy_consumption'):
            year = str(entry['year'])
            company = entry['name']
            
            company_data[year][company]['emissions'] += entry['co2_emissions'] or 0
            company_data[year][company]['consumption'] += entry['energy_consumption'] or 0
            company_data[year][company]['sectors'].add(entry['sector'])

        # Second pass: Calculate tiers and sectors
        for year, companies in sorted(company_data.items(), key=lambda x: x[0]):  # Sort years
            emissions_values = [c['emissions'] for c in companies.values()]
            consumption_values = [c['consumption'] for c in companies.values()]
            
            co2_high = np.percentile(emissions_values, 75)
            co2_medium = np.percentile(emissions_values, 50)
            energy_high = np.percentile(consumption_values, 75)
            energy_medium = np.percentile(consumption_values, 50)

            for company, data in sorted(companies.items(), key=lambda x: x[0]):  # Sort companies
                # CO2 Tier classification
                if data['emissions'] >= co2_high:
                    tier_data[year]['co2_high'] += data['emissions']
                elif data['emissions'] >= co2_medium:
                    tier_data[year]['co2_medium'] += data['emissions']
                else:
                    tier_data[year]['co2_low'] += data['emissions']
                
                # Energy Tier classification
                if data['consumption'] >= energy_high:
                    tier_data[year]['energy_high'] += data['consumption']
                elif data['consumption'] >= energy_medium:
                    tier_data[year]['energy_medium'] += data['consumption']
                else:
                    tier_data[year]['energy_low'] += data['consumption']
                
                # Sector data
                for sector in data['sectors']:  # ✅ Loop through all sectors
                    sector_data[year][sector] += data['emissions']
                    sector_data[year][f"{sector}_energy"] += data['consumption']

        # Prepare sorted response data
        sorted_years = sorted(tier_data.keys())
        sector_list = sorted({s for year in sector_data.values() for s in year.keys()})
        company_list = sorted(
            {c for year in company_data.values() for c in year.keys()},
            key=natural_sort_key
        )
        
        response_data = {
            'file_info': {
                'id': uploaded_file.id,
                'name': uploaded_file.name,
                'upload_date': uploaded_file.upload_date
            },
            'tiers': [{
                'year': year,
                **tier_data[year]
            } for year in sorted_years],
            'sectors': [{
                'year': year,
                **{s: sector_data[year].get(s, 0) for s in sector_list}
            } for year in sorted_years],
            'companies': [{
                'year': year,
                'companies': sorted([{
                    'name': company,
                    'emissions': data['emissions'],
                    'consumption': data['consumption'],
                    'sector': next(iter(data['sectors'])) if data['sectors'] else 'Unknown'
                } for company, data in company_data[year].items()], key=lambda x: x['name'])
            } for year in sorted_years],
            'metadata': {
                'years': sorted_years,
                'sectors': sector_list,
                'company_count': len(company_list),
                'company_list': company_list
            }
        }
        
        

        return Response(response_data)
    
class FileDeleteView(APIView):
    def delete(self, request, file_id):
        """
        Deletes a file by ID.

        Args:
            request: The request object.
            file_id: The ID of the file to delete.

        Returns:
            A response object with a JSON payload containing either a success message
            or an error message.

        Raises:
            UploadedFile.DoesNotExist: If the file with the given ID does not exist.
        """

        try:
            uploaded_file = UploadedFile.objects.get(id=file_id)
            uploaded_file.delete()
            return Response({"message": "File deleted successfully"}, status=status.HTTP_200_OK)
        except UploadedFile.DoesNotExist:
            return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
