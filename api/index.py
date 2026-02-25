from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from .quiz_engine import generate_quiz_from_text
import io
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(docs_url="/api/python/docs", openapi_url="/api/python/openapi.json")

@app.post("/api/python/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    try:
        content = await file.read()
        reader = PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
        
        quiz_data = generate_quiz_from_text(text)
        return {"status": "success", "quiz": quiz_data["questions"]}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
