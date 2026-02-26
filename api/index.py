from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from .quiz_engine import generate_quiz_from_text
import io
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(docs_url="/api/python/docs", openapi_url="/api/python/openapi.json")

@app.post("/api/python/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    quiz_type: str = Form("mix"),
    num_questions: int = Form(10)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    if num_questions < 1 or num_questions > 50:
         raise HTTPException(status_code=400, detail="Number of questions must be between 1 and 50.")
    
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
        
        quiz_data = generate_quiz_from_text(text, num_questions=num_questions, quiz_type=quiz_type)
        return {"status": "success", "quiz": quiz_data["questions"]}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
