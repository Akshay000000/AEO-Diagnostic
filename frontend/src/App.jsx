import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ── Grade helpers ────────────────────────────────────────────────────── */
function getGrade(score) {
  if (score >= 80) return { letter: "A", color: "var(--success)" };
  if (score >= 60) return { letter: "B", color: "var(--accent-light)" };
  if (score >= 40) return { letter: "C", color: "var(--warning)" };
  if (score >= 20) return { letter: "D", color: "var(--danger)" };
  return { letter: "F", color: "var(--danger)" };
}

function getGradeClass(score) {
  if (score >= 80) return "grade-a";
  if (score >= 60) return "grade-b";
  if (score >= 40) return "grade-c";
  if (score >= 20) return "grade-d";
  return "grade-f";
}

function getBarColor(score) {
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "var(--accent-light)";
  if (score >= 40) return "var(--warning)";
  return "var(--danger)";
}

function getEngineIcon(engine) {
  const e = engine.toLowerCase();
  if (e.includes("3.3")) return { label: "3.3", className: "llama33" };
  if (e.includes("3.1")) return { label: "3.1", className: "llama31" };
  if (e.includes("cohere")) return { label: "Co", className: "cohere" };
  return { label: "AI", className: "llama33" };
}

/* ── Engine Card Component ────────────────────────────────────────────── */
function EngineCard({ result }) {
  const [expanded, setExpanded] = useState(false);
  const icon = getEngineIcon(result.engine);
  const barColor = getBarColor(result.score);

  return (
    <div className="engine-card">
      <div className="engine-header">
        <div className="engine-name-group">
          <div className={`engine-icon ${icon.className}`}>{icon.label}</div>
          <span className="engine-name">{result.engine}</span>
        </div>
        <div className="engine-badges">
          <span className={`badge ${result.mentioned ? "mentioned" : "not-mentioned"}`}>
            {result.mentioned ? "✓ Mentioned" : "✗ Not Found"}
          </span>
          {result.mentioned && result.position && (
            <span className="badge neutral">#{result.position}</span>
          )}
          <span className={`badge ${result.sentiment}`}>
            {result.sentiment === "positive" ? "↑ Positive" :
             result.sentiment === "negative" ? "↓ Negative" :
             result.sentiment === "error" ? "⚠ Error" : "→ Neutral"}
          </span>
        </div>
      </div>
      <div className="engine-score-bar">
        <div className="score-bar-header">
          <span className="score-bar-label">Engine Score</span>
          <span className="score-bar-value" style={{ color: barColor }}>{result.score}/100</span>
        </div>
        <div className="score-bar-track">
          <div className="score-bar-fill" style={{ width: `${result.score}%`, background: barColor }} />
        </div>
      </div>
      <div className="engine-response">
        <button className="response-toggle" onClick={() => setExpanded(!expanded)}>
          <span className={`arrow ${expanded ? "open" : ""}`}>▼</span>
          {expanded ? "Hide Response" : "View Full Response"}
        </button>
        {expanded && <div className="response-text">{result.response}</div>}
      </div>
    </div>
  );
}

/* ── Meshery Design Viewer ────────────────────────────────────────────── */
function DesignViewer({ design, provider, intent }) {
  const [tab, setTab] = useState("visual");

  if (!design) return null;

  const components = design.components || [];
  const relationships = design.relationships || [];
  const hasParseError = design.parse_error;

  return (
    <div className="design-viewer">
      <div className="design-header">
        <div className="design-meta">
          <div className="design-tag">designs.meshery.io/v1beta1</div>
          <span className="design-provider-badge">{provider}</span>
        </div>
        <h3 className="design-name">{design.metadata?.name || "Generated Design"}</h3>
        <p className="design-description">{design.metadata?.description || intent}</p>
      </div>

      {hasParseError ? (
        <div className="design-raw">
          <div className="raw-label">⚠ Raw LLM Output (schema parse failed)</div>
          <pre className="raw-text">{design.raw}</pre>
        </div>
      ) : (
        <>
          <div className="design-tabs">
            <button className={`design-tab ${tab === "visual" ? "active" : ""}`} onClick={() => setTab("visual")}>Visual</button>
            <button className={`design-tab ${tab === "json" ? "active" : ""}`} onClick={() => setTab("json")}>JSON Manifest</button>
          </div>

          {tab === "visual" && (
            <div className="design-visual">
              <div className="components-grid">
                {components.map((c, i) => (
                  <div key={i} className="component-node">
                    <div className="component-model">{c.model || "kubernetes"}</div>
                    <div className="component-kind">{c.kind}</div>
                    <div className="component-name">{c.configuration?.metadata?.name || c.displayName}</div>
                    <div className="component-ns">{c.configuration?.metadata?.namespace || "default"}</div>
                  </div>
                ))}
              </div>
              {relationships.length > 0 && (
                <div className="relationships-section">
                  <div className="rel-label">Relationships ({relationships.length})</div>
                  <div className="relationships-list">
                    {relationships.map((r, i) => (
                      <div key={i} className="relationship-item">
                        <span className="rel-from">{r.from}</span>
                        <span className="rel-arrow">──{r.kind}──▶</span>
                        <span className="rel-to">{r.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="design-stats-row">
                <div className="design-stat">
                  <span className="ds-num">{components.length}</span>
                  <span className="ds-label">Components</span>
                </div>
                <div className="design-stat">
                  <span className="ds-num">{relationships.length}</span>
                  <span className="ds-label">Relationships</span>
                </div>
                <div className="design-stat">
                  <span className="ds-num">{[...new Set(components.map(c => c.model || "kubernetes"))].length}</span>
                  <span className="ds-label">Models</span>
                </div>
              </div>
            </div>
          )}

          {tab === "json" && (
            <pre className="json-manifest">{JSON.stringify(design, null, 2)}</pre>
          )}
        </>
      )}
    </div>
  );
}

/* ── Meshery Tab ──────────────────────────────────────────────────────── */
function MesheryTab() {
  const [intent, setIntent] = useState("");
  const [provider, setProvider] = useState("groq");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("mistral");
  const [mode, setMode] = useState("single"); // single | multi
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const EXAMPLES = [
    "Deploy a highly available Kubernetes cluster with Prometheus monitoring",
    "Set up an Istio service mesh with mTLS between microservices",
    "Deploy a Redis cache with a Node.js backend and Nginx ingress",
  ];

  async function generate() {
    if (!intent.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const endpoint = mode === "multi" ? "/meshery/design/multi" : "/meshery/design";
      const body = { intent: intent.trim(), provider, ollama_url: ollamaUrl, ollama_model: ollamaModel };
      const res = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      setResult(await res.json());
    } catch (e) {
      setError(e.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="meshery-tab">
      {/* Intro */}
      <div className="meshery-intro">
        <div className="meshery-badge">
          <span className="meshery-dot" />
          Natural Language → Infrastructure
        </div>
        <p className="meshery-subtitle">
          Describe your infrastructure intent in plain English. The AI Adapter generates a valid
          Meshery design manifest aligned with <code>designs.meshery.io/v1beta1</code>.
        </p>
      </div>

      {/* Input */}
      <div className="input-card meshery-input-card">
        <div className="field-group">
          <label className="field-label">Infrastructure Intent</label>
          <textarea
            className="field-input intent-textarea"
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder='e.g. "Deploy a highly available Kubernetes cluster with Prometheus monitoring"'
            rows={3}
          />
          <div className="examples-row">
            {EXAMPLES.map((ex, i) => (
              <button key={i} className="example-pill" onClick={() => setIntent(ex)}>
                {ex.slice(0, 40)}…
              </button>
            ))}
          </div>
        </div>

        {/* Provider selector */}
        <div className="provider-row">
          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">LLM Provider (BYOM)</label>
            <div className="provider-pills">
              {["groq", "cohere", "ollama"].map((p) => (
                <button
                  key={p}
                  className={`provider-pill ${provider === p ? "active" : ""}`}
                  onClick={() => setProvider(p)}
                >
                  {p === "groq" ? "Groq (Llama 3.3)" : p === "cohere" ? "Cohere (Command-A)" : "Ollama (Local)"}
                </button>
              ))}
            </div>
          </div>
          <div className="field-group" style={{ flex: 1 }}>
            <label className="field-label">Query Mode</label>
            <div className="provider-pills">
              <button className={`provider-pill ${mode === "single" ? "active" : ""}`} onClick={() => setMode("single")}>Single Provider</button>
              <button className={`provider-pill ${mode === "multi" ? "active" : ""}`} onClick={() => setMode("multi")}>Multi Provider</button>
            </div>
          </div>
        </div>

        {provider === "ollama" && (
          <div className="ollama-config">
            <div className="field-group">
              <label className="field-label">Ollama URL</label>
              <input className="field-input" value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} placeholder="http://localhost:11434" />
            </div>
            <div className="field-group">
              <label className="field-label">Model</label>
              <input className="field-input" value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} placeholder="mistral" />
            </div>
          </div>
        )}

        <button
          className={`analyze-btn meshery-btn ${loading ? "loading" : ""}`}
          onClick={generate}
          disabled={loading || !intent.trim()}
        >
          {loading ? "Generating design manifest..." : "Generate Meshery Design →"}
        </button>
        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner meshery-spinner" />
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>
            Translating intent to infrastructure...
          </p>
          <div className="loading-engines">
            <div className="loading-engine-pill"><span className="status-dot meshery-dot-pulse" /> Parsing intent</div>
            <div className="loading-engine-pill"><span className="status-dot meshery-dot-pulse" /> Generating components</div>
            <div className="loading-engine-pill"><span className="status-dot meshery-dot-pulse" /> Building relationships</div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="results-section">
          {mode === "multi" && result.all_results && (
            <div className="multi-provider-summary">
              <div className="mps-label">Provider Comparison</div>
              <div className="mps-row">
                {result.all_results.map((r, i) => (
                  <div key={i} className={`mps-item ${r.valid_schema ? "valid" : "invalid"}`}>
                    <span className="mps-name">{r.provider}</span>
                    <span className="mps-status">{r.valid_schema ? "✓ Valid schema" : "⚠ Parse error"}</span>
                  </div>
                ))}
              </div>
              <div className="mps-best">Best result from: <strong>{result.best_provider}</strong></div>
            </div>
          )}
          <DesignViewer
            design={result.design}
            provider={result.provider || result.best_provider}
            intent={result.intent}
          />
        </div>
      )}
    </div>
  );
}

/* ── Main App ─────────────────────────────────────────────────────────── */
export default function App() {
  const [activeTab, setActiveTab] = useState("aeo");
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function analyze() {
    if (!query.trim() || !product.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), product: product.trim() }),
      });
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      setData(await res.json());
    } catch (e) {
      setError(e.message || "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  }

  const overallGrade = data ? getGrade(data.overall_score) : null;

  return (
    <div className="app-container">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <header className="hero">
        <div className="hero-badge">
          <span className="dot" />
          AI Engine Optimization + Meshery AI Adapter
        </div>
        <h1>
          AEO Diagnostic<br />
          <span>+ Meshery Design</span>
        </h1>
        <p className="hero-subtitle">
          Score your product's AI visibility across engines — or generate Meshery infrastructure
          designs from natural language. Powered by Groq, Cohere, and Ollama (BYOM).
        </p>

        {/* Tab switcher */}
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === "aeo" ? "active" : ""}`}
            onClick={() => setActiveTab("aeo")}
          >
            AEO Diagnostic
          </button>
          <button
            className={`tab-btn ${activeTab === "meshery" ? "active" : ""}`}
            onClick={() => setActiveTab("meshery")}
          >
            ✦ Meshery AI Adapter
          </button>
        </div>
      </header>

      {/* ── AEO Tab ───────────────────────────────────────────────────── */}
      {activeTab === "aeo" && (
        <>
          <div className="input-card">
            <div className="field-group">
              <label className="field-label" htmlFor="query-input">Shopper Query</label>
              <input
                id="query-input"
                className="field-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g. "best magnesium supplement for seniors"'
                onKeyDown={(e) => e.key === "Enter" && analyze()}
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="product-input">Your Product / Brand</label>
              <input
                id="product-input"
                className="field-input"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder='e.g. "Nature Made Magnesium"'
                onKeyDown={(e) => e.key === "Enter" && analyze()}
              />
            </div>
            <button
              className={`analyze-btn ${loading ? "loading" : ""}`}
              onClick={analyze}
              disabled={loading || !query.trim() || !product.trim()}
            >
              {loading ? "Querying AI Engines..." : "Run AEO Diagnostic →"}
            </button>
            {error && <div className="error-message">{error}</div>}
          </div>

          {loading && (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 500 }}>
                Analyzing across AI engines...
              </p>
              <div className="loading-engines">
                <div className="loading-engine-pill"><span className="status-dot" /> Llama 3.3</div>
                <div className="loading-engine-pill"><span className="status-dot" /> Llama 3.1</div>
                <div className="loading-engine-pill"><span className="status-dot" /> Cohere</div>
              </div>
            </div>
          )}

          {data && (
            <div className="results-section">
              <div className={`score-card ${getGradeClass(data.overall_score)}`}>
                <div className="score-label">Overall AEO Score</div>
                <div className="score-grade" style={{ color: overallGrade.color, animation: "scoreReveal 0.6s var(--ease)" }}>
                  {overallGrade.letter}
                </div>
                <div className="score-number">{data.overall_score} / 100</div>
                <div className="score-query">"{data.product}" — "{data.query}"</div>
                <div className="stats-row">
                  <div className="stat-item">
                    <div className="stat-value" style={{ color: "var(--success)" }}>
                      {data.results.filter((r) => r.mentioned).length}/{data.results.length}
                    </div>
                    <div className="stat-label">Engines Mentioned</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value" style={{ color: "var(--accent-light)" }}>
                      {data.results.filter((r) => r.sentiment === "positive").length}/{data.results.length}
                    </div>
                    <div className="stat-label">Positive Sentiment</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value" style={{ color: "var(--text-primary)" }}>
                      #{Math.round(data.results.filter((r) => r.position).reduce((a, r) => a + r.position, 0) / (data.results.filter((r) => r.position).length || 1))}
                    </div>
                    <div className="stat-label">Avg Position</div>
                  </div>
                </div>
              </div>
              <div className="engine-grid">
                {data.results.map((r, i) => <EngineCard key={i} result={r} />)}
              </div>
              <div className="reco-card">
                <div className="reco-title">Recommendations</div>
                {data.overall_score < 40 && (
                  <p className="reco-text">Your product has <strong>low AI visibility</strong>. Consider optimizing your product descriptions with keywords that match how shoppers query AI assistants.</p>
                )}
                {data.overall_score >= 40 && data.overall_score < 70 && (
                  <p className="reco-text"><strong>Moderate AI visibility.</strong> Your product is being mentioned but not consistently across all engines.</p>
                )}
                {data.overall_score >= 70 && (
                  <p className="reco-text"><strong>Strong AI visibility!</strong> Your product is well-represented across AI engines.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Meshery Tab ───────────────────────────────────────────────── */}
      {activeTab === "meshery" && <MesheryTab />}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="footer">
        <p>
          AEO Diagnostic + Meshery AI Adapter · Built with{" "}
          <a href="https://groq.com" target="_blank" rel="noopener noreferrer">Groq</a>,{" "}
          <a href="https://cohere.com" target="_blank" rel="noopener noreferrer">Cohere</a> &{" "}
          <a href="https://ollama.com" target="_blank" rel="noopener noreferrer">Ollama</a>
        </p>
      </footer>
    </div>
  );
}