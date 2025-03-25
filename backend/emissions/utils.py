import pandas as pd
from .models import CompanyEmissions, UploadedFile

def process_excel(file_path, file_name):
    df = pd.read_excel(file_path)
    
    # guardar nome do ficheiro na db, para referencia
    uploaded_file = UploadedFile.objects.create(
        file_name=file_name,
    )
    
    # guardar dados do ficheiro na db
    for _, row in df.iterrows():
        CompanyEmissions.objects.create(
            uploaded_file=uploaded_file,
            company_name=row["Nome da Empresa"],
            sector=row["Setor"],
            energy_consumption=row["Consumo (kWh)"],
            co2_emissions=row["Emissões CO₂ (t)"],
        )
    
    # calcular indicadores 
    # !TODO: talvez criar uma tabela para os indicadores que tb aponta para uploaded_file
    total_co2 = df["Emissões CO₂ (t)"].sum()
    avg_energy = df["Consumo (kWh)"].mean()
    top_5_co2 = df.nlargest(5, "Emissões CO₂ (t)")[["Nome da Empresa", "Emissões CO₂ (t)"]].to_dict("records")
    
    return {
        "file_id": uploaded_file.id,  #
        "total_co2": total_co2,
        "avg_energy": avg_energy,
        "top_5_co2": top_5_co2
    }