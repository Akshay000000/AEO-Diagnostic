from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cohere
import os
import re
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_KEY = os.getenv("GROQ_API_KEY")
COHERE_KEY = os.getenv("COHERE_API_KEY")

class QueryRequest(BaseModel):
    query: str
    product: str

def query_llama(query: str) -> dict:
    try:
        client = Groq(api_key=GROQ_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": f"You are a helpful shopping assistant. A customer asks: '{query}'. Give a helpful recommendation mentioning specific product brands and why you recommend them. Be concise."}],
            max_tokens=1024
        )
        return {"engine": "Llama 3.3 (Groq)", "response": response.choices[0].message.content, "status": "success"}
    except Exception as e:
        return {"engine": "Llama 3.3 (Groq)", "response": str(e), "status": "error"}

def query_gemma(query: str) -> dict:
    try:
        client = Groq(api_key=GROQ_KEY)
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": f"You are a helpful shopping assistant. A customer asks: '{query}'. Give a helpful recommendation mentioning specific product brands and why you recommend them. Be concise."}],
            max_tokens=1024
        )
        return {"engine": "Llama 3.1 (Groq)", "response": response.choices[0].message.content, "status": "success"}
    except Exception as e:
        return {"engine": "Llama 3.1 (Groq)", "response": str(e), "status": "error"}

def query_cohere(query: str) -> dict:
    try:
        co = cohere.Client(api_key=COHERE_KEY)
        response = co.chat(
            message=f"You are a helpful shopping assistant. A customer asks: '{query}'. Give a helpful recommendation mentioning specific product brands and why you recommend them. Be concise.",
            model="command-a-03-2025"
        )
        return {"engine": "Cohere", "response": response.text, "status": "success"}
    except Exception as e:
        return {"engine": "Cohere", "response": str(e), "status": "error"}

def extract_mentions(response: str, product: str) -> dict:
    response_lower = response.lower()
    product_lower = product.lower()
    product_words = [w for w in product_lower.split() if len(w) > 2]
    mentioned = any(word in response_lower for word in product_words) or product_lower in response_lower
    position = None
    if mentioned:
        brands = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', response)
        for i, brand in enumerate(brands[:10]):
            if any(word in brand.lower() for word in product_words):
                position = i + 1
                break
        if position is None:
            position = 5
    sentiment = "neutral"
    positive_words = ["best", "recommend", "excellent", "great", "top", "popular", "effective"]
    negative_words = ["avoid", "poor", "bad", "inferior", "not recommended"]
    if any(w in response_lower for w in positive_words):
        sentiment = "positive"
    elif any(w in response_lower for w in negative_words):
        sentiment = "negative"
    score = 0
    if mentioned:
        score += 50
        if position and position <= 3:
            score += 30
        elif position and position <= 5:
            score += 15
        if sentiment == "positive":
            score += 20
        elif sentiment == "neutral":
            score += 10
    return {"mentioned": mentioned, "position": position, "sentiment": sentiment, "score": score}

@app.post("/analyze")
def analyze(req: QueryRequest):
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(query_llama, req.query),
            executor.submit(query_gemma, req.query),
            executor.submit(query_cohere, req.query),
        ]
        results = [f.result() for f in futures]
    report = []
    for r in results:
        if r["status"] == "success":
            analysis = extract_mentions(r["response"], req.product)
            report.append({"engine": r["engine"], "response": r["response"], "mentioned": analysis["mentioned"], "position": analysis["position"], "sentiment": analysis["sentiment"], "score": analysis["score"]})
        else:
            report.append({"engine": r["engine"], "response": r["response"], "mentioned": False, "position": None, "sentiment": "error", "score": 0})
    overall = sum(r["score"] for r in report) / len(report)
    return {"results": report, "overall_score": round(overall), "query": req.query, "product": req.product}

@app.get("/")
def root():
    return {"status": "AEO Diagnostic API running"}



