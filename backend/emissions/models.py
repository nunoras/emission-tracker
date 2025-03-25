from django.db import models

class UploadedFile(models.Model):
    file_name = models.CharField(max_length=255)
    upload_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file_name

class CompanyEmissions(models.Model):
    file = models.ForeignKey(UploadedFile, on_delete=models.CASCADE, related_name="emissions")
    name = models.CharField(max_length=100)
    sector = models.CharField(max_length=100)
    energy_consumption = models.FloatField()
    co2_emissions = models.FloatField()
    year = models.IntegerField()
    
    def __str__(self):
        return f"self.name (self.year)"