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
    def post(self, request):
        """
        Process an uploaded Excel file and store its contents in the database.

        Request should contain a single file field with the Excel file.

        The Excel file must have the following columns:

        - Empresa
        - Setor
        - Consumo de Energia (MWh)
        - Emissões de CO2 (toneladas)
        - Ano

        The API will return a JSON object with the following keys:

        - status: always set to "success"
        - file_id: the ID of the newly created UploadedFile instance
        - records_created: the number of CompanyEmissions records created

        If the file is invalid or does not conform to the expected
        schema, the API will return a 400 or 422 error with a message
        describing the error.

        If the file is larger than 10MB, the API will return a 413 error.

        The API will also return a JSON object with the sector performance
        by year, with the following keys:

        - sector
        - year
        - co2_emissions_sum
        - co2_emissions_mean
        - co2_emissions_count
        - energy_consumption_sum
        - energy_consumption_mean
        """
        MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file_obj = request.FILES['file']
        if file_obj.size > MAX_FILE_SIZE:
            return Response({"error": "File too large (max 10MB)"}, status=413)
        
        
        df = pd.read_excel(BytesIO(file_obj.read()))
        
        required_columns = set([
            "Empresa",
            "Setor",
            "Consumo de Energia (MWh)",
            "Emissões de CO2 (toneladas)",
            "Ano",
        ])
        
        if not required_columns.issubset(df.columns):
            return Response({"error": "File must obey the schema"}, status=status.HTTP_400_BAD_REQUEST)
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
            raise NotFound("File not found")

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
                primary_sector = next(iter(data['sectors'])) if data['sectors'] else 'Unknown'
                sector_data[year][primary_sector] += data['emissions']
                sector_data[year][f"{primary_sector}_energy"] += data['consumption']

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
