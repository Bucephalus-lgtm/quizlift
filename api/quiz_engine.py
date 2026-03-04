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
        model_name="gemini-2.5-flash",
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

def generate_quiz_from_text(text: str, num_questions: int = 10, quiz_type: str = "mix", difficulty: str = "Medium") -> dict:
    if is_mock_mode:
        print("MOCK MODE: Returning dummy quiz due to missing GEMINI_API_KEY")
        # Adjust mock data to match requested count roughly
        mock = _get_mock_quiz()
        return {"questions": mock["questions"][:num_questions]}

    if quiz_type == "text_based":
        type_instruction = f"All {num_questions} questions MUST be strictly based on the provided text ('text_based')."
    elif quiz_type == "in_and_around":
        type_instruction = f"All {num_questions} questions MUST be 'In and Around' the topic - these should be related concepts, drawing from your broader knowledge base, to test deeper understanding ('in_and_around')."
    elif quiz_type == "ultra_difficult":
        type_instruction = f"All {num_questions} questions MUST be 'Ultra Difficult' logical combinations. For EACH question, formulate a set of 2 to 4 distinct factual statements (Statement 1:, Statement 2:, etc.). You must pick 1 or 2 static facts directly from the text, and generate the remaining statements by pulling deep static or current affairs knowledge related to the text's facts (like connecting a recent event to its historical/static origin). The options (A, B, C, D) MUST be strictly combinations of the truth values of these statements (e.g. '1 and 2', '1, 2 and 3', 'Only 4', 'All 1, 2, 3 and 4'). exactly ONE option must perfectly match the truth without any anomalies. IMPORTANT: Format the main question first, then present each statement strictly starting with 'Statement X:' on a separate new line within the question string itself (using '\\n'). ('ultra_difficult')."
    else:
        # Mix
        text_count = int(num_questions * 0.7)
        ia_count = num_questions - text_count
        type_instruction = f"{text_count} questions MUST be strictly based on the provided text ('text_based'), and {ia_count} questions MUST be 'In and Around' the topic ('in_and_around')."

    prompt = f"""
You are an expert educational AI. I will provide you with text from a document.
Your task is to generate exactly {num_questions} multiple-choice questions (MCQs) based on this text.

Requirements:
1. {type_instruction}
2. The difficulty level of the questions MUST be: {difficulty}. Adjust the vocabulary, distractors, and depth of the question accordingly.
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
      "explanation": "Detailed explanation of why B is correct, breaking down the truth of each individual statement if applicable.",
      "type": "text_based" // or "in_and_around" or "ultra_difficult"
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

from datetime import date
def generate_current_affairs_quiz(
    num_questions: int = 10, 
    difficulty: str = "Medium",
    topic: str = "All",
    location: str = "India",
    start_date: str = None,
    end_date: str = None
) -> dict:
    if is_mock_mode:
        print("MOCK MODE: Returning dummy quiz due to missing GEMINI_API_KEY")
        mock = _get_mock_quiz()
        return {"questions": mock["questions"][:num_questions]}

    today_str = date.today().isoformat()
    topic_str = "All general topics" if not topic or topic.lower() == "all" else topic
    loc_str = "India (or global impact on India)" if not location or location.lower() == "india" else location
    
    date_constraint = ""
    if start_date and end_date:
        date_constraint = f"from {start_date} to {end_date}"
    elif start_date:
        date_constraint = f"from {start_date} up to {today_str}"
    else:
        date_constraint = f"leading up to today: {today_str}"

    prompt = f"""
You are an expert educator and quiz master for current affairs and competitive exams.
Today's Date is: {today_str}.

Your task is to generate exactly {num_questions} completely factual and UP-TO-DATE multiple-choice questions (MCQs) covering recent Current Affairs.

CRITICAL FILTERS:
- Location: {loc_str}
- Topic Segment(s): {topic_str}
- Timeline of Events: MUST be strictly events that occurred {date_constraint}. Do not include outdated questions prior to this window.

Requirements:
1. Questions must cover highly relevant news events, policy changes, scientific breakthroughs, or economic shifts corresponding to the filters above.
2. The difficulty level of the questions MUST be: {difficulty}. Adjust the complexity of the current affairs topics and options accordingly.
3. Each question must have exactly 4 options, with exactly 1 correct option.
4. Provide a detailed explanation for the correct answer, which will be shown in a "Learn More" section. Include exactly when it happened if possible.
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
      "explanation": "Detailed explanation of why B is correct, including context and dates.",
      "type": "current_affairs"
    }}
  ]
}}
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

def generate_flashcards_from_text(text: str, num_flashcards: int = 10, difficulty: str = "Medium") -> dict:
    if is_mock_mode:
        print("MOCK MODE: Returning dummy flashcards due to missing GEMINI_API_KEY")
        return {"flashcards": [{"front": f"Mock Front {i}", "back": f"Mock Back {i}"} for i in range(min(num_flashcards, 2))]}

    prompt = f"""
You are an expert educational AI. I will provide you with text from a document.
Your task is to generate exactly {num_flashcards} high-quality flashcards based on this text.

Requirements:
1. Each flashcard must have a "front" (the question, concept, or term).
2. Each flashcard must have a "back" (the answer, definition, or explanation).
3. The content should be concise but highly informative, optimized for active recall.
4. The difficulty level of the flashcards MUST be: {difficulty}. Adjust the concepts and depth accordingly.
5. You MUST return the output as a valid JSON object matching this schema:
{{
  "flashcards": [
    {{
      "front": "What is the powerhouse of the cell?",
      "back": "Mitochondria"
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
