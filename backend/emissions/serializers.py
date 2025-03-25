from rest_framework import serializers
from .models import CompanyEmissions, UploadedFile

class CompanyEmissionsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyEmissions
        fields = '__all__'
        
