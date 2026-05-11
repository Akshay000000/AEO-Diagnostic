from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cohere
import os
import re
import json
import httpx
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from groq import Groq
from typing import Optional

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

# ─────────────────────────────────────────────
# EXISTING AEO DIAGNOSTIC CODE (unchanged)
# ─────────────────────────────────────────────

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


# ─────────────────────────────────────────────
# MESHERY AI ADAPTER PROOF OF CONCEPT
# ─────────────────────────────────────────────

MESHERY_SYSTEM_PROMPT = """You are the Meshery AI Adapter — an intelligent infrastructure assistant for the Meshery cloud-native management platform.

Your job is to translate natural language infrastructure intent into a valid Meshery design manifest.

You must ALWAYS respond with a JSON object that conforms to Meshery's design schema (designs.meshery.io/v1beta1). 
Do NOT include any explanation or text outside the JSON.

Schema structure:
{
  "apiVersion": "designs.meshery.io/v1beta1",
  "kind": "Design",
  "metadata": {
    "name": "<descriptive-design-name>",
    "description": "<one sentence describing the design>"
  },
  "components": [
    {
      "id": "<unique-id>",
      "kind": "<Kubernetes resource kind, e.g. Deployment, Service, ConfigMap>",
      "model": "<model name, e.g. kubernetes, istio, prometheus>",
      "displayName": "<human readable name>",
      "configuration": {
        "metadata": {
          "name": "<resource name>",
          "namespace": "<namespace, default to 'default'>"
        },
        "spec": {}
      }
    }
  ],
  "relationships": [
    {
      "from": "<component id>",
      "to": "<component id>",
      "kind": "<relationship kind, e.g. Network, Hierarchical>"
    }
  ]
}

Rules:
- Always include at least 2-3 components
- Always define relationships between components where applicable
- Use realistic Kubernetes/cloud-native resource kinds
- Keep specs minimal but valid
- Generate unique IDs using format: comp-1, comp-2, etc.
"""

class DesignRequest(BaseModel):
    intent: str
    provider: Optional[str] = "groq"  # groq | cohere | ollama
    ollama_url: Optional[str] = "http://localhost:11434"
    ollama_model: Optional[str] = "mistral"

def parse_design_response(raw: str) -> dict:
    """Extract JSON from LLM response even if it has extra text."""
    raw = raw.strip()
    # Try direct parse first
    try:
        return json.loads(raw)
    except Exception:
        pass
    # Try extracting JSON block
    match = re.search(r'\{[\s\S]*\}', raw)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    # Return raw as fallback
    return {"raw": raw, "parse_error": "Could not parse as valid JSON"}

def generate_with_groq(intent: str) -> dict:
    try:
        client = Groq(api_key=GROQ_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": MESHERY_SYSTEM_PROMPT},
                {"role": "user", "content": intent}
            ],
            max_tokens=2048,
            temperature=0.2
        )
        raw = response.choices[0].message.content
        return {
            "provider": "Groq (Llama 3.3)",
            "design": parse_design_response(raw),
            "status": "success"
        }
    except Exception as e:
        return {"provider": "Groq (Llama 3.3)", "design": None, "status": "error", "error": str(e)}

def generate_with_cohere(intent: str) -> dict:
    try:
        co = cohere.Client(api_key=COHERE_KEY)
        response = co.chat(
            message=intent,
            preamble=MESHERY_SYSTEM_PROMPT,
            model="command-a-03-2025",
            temperature=0.2
        )
        raw = response.text
        return {
            "provider": "Cohere (Command-A)",
            "design": parse_design_response(raw),
            "status": "success"
        }
    except Exception as e:
        return {"provider": "Cohere (Command-A)", "design": None, "status": "error", "error": str(e)}

def generate_with_ollama(intent: str, ollama_url: str, model: str) -> dict:
    """
    BYOM local inference via Ollama.
    Users point this to their own Ollama instance — zero cloud dependency.
    """
    try:
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": MESHERY_SYSTEM_PROMPT},
                {"role": "user", "content": intent}
            ],
            "stream": False,
            "options": {"temperature": 0.2}
        }
        resp = httpx.post(
            f"{ollama_url}/api/chat",
            json=payload,
            timeout=60.0
        )
        resp.raise_for_status()
        raw = resp.json()["message"]["content"]
        return {
            "provider": f"Ollama ({model})",
            "design": parse_design_response(raw),
            "status": "success"
        }
    except Exception as e:
        return {"provider": f"Ollama ({model})", "design": None, "status": "error", "error": str(e)}

@app.post("/meshery/design")
def generate_design(req: DesignRequest):
    """
    Meshery AI Adapter endpoint.
    Accepts natural language infrastructure intent and returns
    a Meshery design manifest (designs.meshery.io/v1beta1).

    Supports BYOM (Bring Your Own Model):
    - provider=groq   → Groq cloud (Llama 3.3)
    - provider=cohere → Cohere cloud (Command-A)
    - provider=ollama → Local Ollama instance (zero cloud dependency)
    """
    provider = req.provider.lower()

    if provider == "groq":
        result = generate_with_groq(req.intent)
    elif provider == "cohere":
        result = generate_with_cohere(req.intent)
    elif provider == "ollama":
        result = generate_with_ollama(req.intent, req.ollama_url, req.ollama_model)
    else:
        return {"error": f"Unknown provider '{provider}'. Use: groq, cohere, ollama"}

    return {
        "intent": req.intent,
        "provider": result["provider"],
        "status": result["status"],
        "design": result.get("design"),
        "error": result.get("error")
    }

@app.post("/meshery/design/multi")
def generate_design_multi(req: DesignRequest):
    """
    Query all available cloud providers simultaneously and return
    the best design based on schema validity.
    Demonstrates BYOM multi-provider switching.
    """
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {
            "groq": executor.submit(generate_with_groq, req.intent),
            "cohere": executor.submit(generate_with_cohere, req.intent),
        }
        results = {k: v.result() for k, v in futures.items()}

    # Pick best result — prefer one with valid parsed design over raw fallback
    best = None
    for key, r in results.items():
        if r["status"] == "success" and r.get("design") and "parse_error" not in r["design"]:
            best = r
            break

    if not best:
        best = list(results.values())[0]

    return {
        "intent": req.intent,
        "best_provider": best["provider"],
        "design": best["design"],
        "all_results": [
            {
                "provider": r["provider"],
                "status": r["status"],
                "valid_schema": r.get("design") is not None and "parse_error" not in (r.get("design") or {})
            }
            for r in results.values()
        ]
    }

@app.get("/")
def root():
    return {
        "status": "AEO Diagnostic + Meshery AI Adapter running",
        "endpoints": {
            "aeo": "POST /analyze",
            "meshery_single": "POST /meshery/design",
            "meshery_multi": "POST /meshery/design/multi"
        },
        "providers": ["groq", "cohere", "ollama"]
    }