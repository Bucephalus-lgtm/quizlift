# QuizLift: Intelligent Document Comprehension & Contextual Assessment

**QuizLift** is a high-performance AI platform designed to bridge the gap between passive reading and active recall. By transforming static PDF documents into dynamic, multi-modal assessment modules, QuizLift empowers users to validate their understanding of complex materials in real-time.

![Landing Page - Document Upload](./public/initial_state.png)


## 🧠 Advanced AI Logic: Beyond Simple Extraction
Unlike standard Q&A systems, QuizLift utilizes a dual-engine questioning strategy powered by **Google Gemini 1.5/2.5**:

*   **Direct Semantic Mapping:** Challenges the user with questions directly derived from the document's explicit text for foundational verification.
*   **Conceptual "In & Around" Logic:** Synthesizes the document's core themes to generate questions about related concepts and logical extensions, ensuring a deep conceptual grasp rather than mere rote memorization.

![Interactive Quiz Interface](./public/quiz_state.png)


## ✨ Core Features
1.  **Seamless Document Ingestion:** Instantly process dense reading materials, lecture slides, or technical documentation (PDF, DOCX, DOC) via a drag-and-drop interface.
2.  **Context-Aware MCQ Generation:** High-fidelity parsing ensures all generated questions are strictly relevant to the uploaded content.
3.  **Real-Time Feedback Loop:** Interactive UI provides immediate validation and detailed explanations for every answer choice.
4.  **Premium Experience:** A sleek, dark-mode interface built with modern web aesthetics for a focused, distraction-free learning environment.

## 🛠 Technology Stack
*   **Frontend:** Next.js (App Router), React, Tailwind CSS, Framer Motion, Shadcn UI
*   **Backend:** Python FastAPI (Optimized for Vercel Serverless Functions)
*   **AI Orchestration:** Google Gemini Pro / Flash 
*   **Styling:** Modern Dark-mode Glassmorphism

---

## 🚀 Local Development Setup

### 1. Prerequisites
*   **Node.js** (v18 or higher)
*   **Python** (3.12 or higher)
*   **Google AI Studio API Key** (for Gemini)

### 2. Environment Configuration
Create a `.env` file in the appropriate directory (or set globally) with your API key:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Backend Execution (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```
*Backend runs on `http://localhost:8000`*

### 4. Frontend Execution (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*Frontend accessible at `http://localhost:3000`*

## 📝 Disclaimer
QuizLift is an AI-driven tool for educational assistance. While it strives for high accuracy in question generation, users are encouraged to verify critical information against the original source text.
