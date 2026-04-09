from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
from services.analysis import analyze_edf_to_summary, save_upload_file

router = APIRouter()

@router.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # Validate Extension
    extension = file.filename.split(".")[-1].lower()
    if extension not in ["edf"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only .edf files are currently supported for AI inference.")
        
    try:
        file_path = save_upload_file(file.file, file.filename)
            
        print(f"File successfully received: {file.filename}")

        summary = analyze_edf_to_summary(file_path)
        # Back-compat mapping for old UI.
        result = "seizure" if summary["result_label"] != "Normal" else "healthy"
        risk_percentage = summary["confidence"]
        seizure_type = "Seizure Risk" if summary["result_label"] != "Normal" else "None"

        return JSONResponse(status_code=200, content={
            "message": "Inference complete.", 
            "filename": file.filename, 
            "result": result,
            "risk_score": risk_percentage,
            "seizure_type": seizure_type
        })
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error during inference: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during inference: {e}")
