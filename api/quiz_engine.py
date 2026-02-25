import os
import json
import asyncio
from pydantic import BaseModel, Field
from typing import List
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
is_mock_mode = not api_key

if not is_mock_mode:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-pro",
        generation_config={
            "temperature": 0.2
        }
    )

def _get_mock_quiz() -> dict:
    return {
        "questions": [
            {
                "question": "What is QuizLift (Mock Data)?",
                "options": [
                    {"text": "A mock answer A", "is_correct": False},
                    {"text": "A PDF-to-Interactive-Quiz generator", "is_correct": True},
                    {"text": "A space rocket", "is_correct": False},
                    {"text": "A cooking app", "is_correct": False},
                ],
                "explanation": "This is a mock answer provided because no Gemini API Key was found in `.env`.",
                "type": "text_based"
            },
            {
                "question": "Mock In and Around Question",
                "options": [
                    {"text": "Option 1", "is_correct": False},
                    {"text": "Option 2", "is_correct": False},
                    {"text": "Option 3 Correct", "is_correct": True},
                    {"text": "Option 4", "is_correct": False},
                ],
                "explanation": "Mock explanation.",
                "type": "in_and_around"
            }
        ]
    }

def generate_quiz_from_text(text: str) -> dict:
    if is_mock_mode:
        print("MOCK MODE: Returning dummy quiz due to missing GEMINI_API_KEY")
        return _get_mock_quiz()

    prompt = f"""
You are an expert educational AI. I will provide you with text from a PDF.
Your task is to generate exactly 10 multiple-choice questions (MCQs) based on this text.

Requirements:
1. 7 questions MUST be strictly based on the provided text ("text_based").
2. 3 questions MUST be "In and Around" the topic - these should be related concepts, drawing from your broader knowledge base, to test deeper understanding ("in_and_around").
3. Each question must have exactly 4 options, with exactly 1 correct option.
4. Provide a detailed explanation for the correct answer, which will be shown in a "Learn More" section.
5. You MUST return the output as a valid JSON object matching this schema:
{{
  "questions": [
    {{
      "question": "The question text",
      "options": [
        {{"text": "Option A", "is_correct": false}},
        {{"text": "Option B", "is_correct": true}},
        {{"text": "Option C", "is_correct": false}},
        {{"text": "Option D", "is_correct": false}}
      ],
      "explanation": "Detailed explanation of why B is correct.",
      "type": "text_based" // or "in_and_around"
    }}
  ]
}}

Here is the source text limit to the first 30000 characters for token limits:
{text[:30000]}
    """

    try:
        response = model.generate_content(prompt)
        text_resp = response.text.strip()
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
        text_resp = text_resp.strip()
        data = json.loads(text_resp)
        return data
    except Exception as e:
        error_msg = str(e)
        import traceback
        traceback.print_exc()
        print(f"Error calling Gemini or parsing: {error_msg}")
        if "API_KEY_INVALID" in error_msg or "API key not valid" in error_msg:
            raise ValueError("The GEMINI_API_KEY entered in Vercel is invalid. Please double-check it in your Vercel Environment Variables.")
        raise ValueError(f"Failed to generate valid JSON from AI. Error: {error_msg}")
