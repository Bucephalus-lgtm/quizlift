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
async def upload_document(
    file: UploadFile = File(...),
    quiz_type: str = Form("mix"),
    num_questions: int = Form(10)
):
    valid_extensions = (".pdf", ".docx", ".doc")
    if not any(file.filename.lower().endswith(ext) for ext in valid_extensions):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and DOC files are allowed.")
    
    if num_questions < 1 or num_questions > 50:
         raise HTTPException(status_code=400, detail="Number of questions must be between 1 and 50.")
    
    try:
        content = await file.read()
        text = ""
        filename = file.filename.lower()

        if filename.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(content))
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
        elif filename.endswith(".docx"):
            import docx
            doc = docx.Document(io.BytesIO(content))
            text = "\n".join([para.text for para in doc.paragraphs])
        elif filename.endswith(".doc"):
            # Safe parsing for binary .doc files by extracting printable ASCII and UTF-16LE strings.
            # This is 100% secure as it does not execute or evaluate any macros/OLE structures.
            import re
            ascii_text = b" ".join(re.findall(rb'[ -~]{4,}', content)).decode('ascii', errors='ignore')
            utf16_text = b" ".join(re.findall(rb'(?:[\x20-\x7E]\x00){4,}', content)).decode('utf-16le', errors='ignore')
            text = ascii_text + "\n" + utf16_text

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract readable text from the document.")
        
        quiz_data = generate_quiz_from_text(text, num_questions=num_questions, quiz_type=quiz_type)
        return {"status": "success", "quiz": quiz_data["questions"]}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
