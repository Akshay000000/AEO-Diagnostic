# AEO Diagnostic - AI Engine Optimization Report Card

[Click here for Live Demo: AEO Diagnostic](https://aeo-diag-akshay.vercel.app/)

[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#)

AEO Diagnostic is a specialized tool designed to help brands and product owners understand how their products rank when shoppers ask AI assistants for recommendations. 

By simultaneously querying multiple top-tier AI models, this application analyzes the responses and generates a comprehensive "Report Card" detailing your product's AI visibility, mention frequency, sentiment, and ranking position.

---

## Features

- Concurrent AI Querying: Fetches responses simultaneously from industry-leading models to save time.
- Deep Sentiment Analysis: Evaluates whether AI mentions of your product are positive, neutral, or negative.
- Position Tracking: Determines how early your product is mentioned in the AI's recommendation list.
- AEO Scoring System: Calculates an overall grade (A-F) based on mention rate, sentiment quality, and list position.
- Actionable Insights: Provides tailored recommendations to improve your product's AI discoverability based on your score.
- Premium UI/UX: A sleek, responsive, dark-themed interface built with React, featuring subtle animations and modern design principles.

---

## Supported AI Engines

This tool leverages high-speed inference APIs to query the following models:
- Llama 3.3 (70B Versatile) via [Groq](https://groq.com/)
- Llama 3.1 (8B Instant) via [Groq](https://groq.com/)
- Command R+ (command-a-03-2025) via [Cohere](https://cohere.com/)

---

## Technology Stack

**Frontend:**
- [React](https://reactjs.org/) 18
- [Vite](https://vitejs.dev/)
- Vanilla CSS (Custom Design System)

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- `concurrent.futures` for parallel API requests
- [Groq Python SDK](https://github.com/groq/groq-python)
- [Cohere Python SDK](https://github.com/cohere-ai/cohere-python)

---

## Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- API Keys for [Groq](https://console.groq.com/keys) and [Cohere](https://dashboard.cohere.com/api-keys)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Start the server (Requires API keys)
GROQ_API_KEY=your_groq_key COHERE_API_KEY=your_cohere_key uvicorn main:app --reload
```
The backend will run on `http://localhost:8000`.

### 2. Frontend Setup
```bash
cd frontend
npm install

# Set up environment variables
cp .env.example .env
# Ensure .env contains: VITE_API_URL=http://localhost:8000

# Start the development server
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## Deployment

### Deploy Backend (Render)
1. Push your code to GitHub.
2. Create a new **Web Service** on [Render](https://render.com/).
3. Connect your repository.
4. Set **Root Directory** to `backend`.
5. Set **Build Command** to `pip install -r requirements.txt`.
6. Set **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
7. Add Environment Variables: `GROQ_API_KEY` and `COHERE_API_KEY`.

### Deploy Frontend (Vercel)
1. Go to [Vercel](https://vercel.com/) and create a **New Project**.
2. Import your repository.
3. Set **Root Directory** to `frontend`.
4. Framework preset should automatically detect **Vite**.
5. Add Environment Variable: `VITE_API_URL` (set to your Render backend URL, e.g., `https://your-backend.onrender.com`).
6. Click **Deploy**.

---

## License
This project is open-source and available under the [MIT License](LICENSE).
