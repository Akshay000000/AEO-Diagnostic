# AEO Diagnostic - AI Engine Optimization Report Card

See how your product ranks when shoppers ask Grok (Llama) and Cohere.

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
GROQ_API_KEY=your_key COHERE_API_KEY=your_key uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Render backend URL
npm run dev
```

## Deploy

### Backend → Render
1. Push to GitHub
2. New Web Service on render.com
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add env vars: GROQ_API_KEY, COHERE_API_KEY

### Frontend → Vercel
1. New project on vercel.com
2. Root directory: `frontend`
3. Add env var: VITE_API_URL = your Render URL
4. Deploy

## APIs Used
- Groq - Llama 3.3 70B Versatile
- Groq - Llama 3.1 8B Instant
- Cohere (command-a-03-2025)
