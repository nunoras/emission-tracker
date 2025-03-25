from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import os
from .models import UploadedFile, CompanyEmissions
from .utils import process_excel

class EmissionsAPI(APIView):
    def get(self, request):
        # file_id se fornecido (ex: /api/emissions/?file_id=2)
        file_id = request.query_params.get("file_id")
        if file_id:
            emissions = CompanyEmissions.objects.filter(uploaded_file_id=file_id).values()
        else:
            emissions = CompanyEmissions.objects.all().values()
        return Response(emissions)
    
    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"error": "Nenhum ficheiro enviado"}, status=status.HTTP_400_BAD_REQUEST)
        
        file_path = default_storage.save("temp.xlsx", ContentFile(file.read()))
        
        try:
            results = process_excel(file_path, file.name)
            return Response(results)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

class FileHistoryAPI(APIView):
    def get(self, request):
        files = UploadedFile.objects.all().values("id", "file_name", "upload_date", "year")
        return Response(files)