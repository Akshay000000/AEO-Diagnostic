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
      {/* Header */}
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

      {/* Score Bar */}
      <div className="engine-score-bar">
        <div className="score-bar-header">
          <span className="score-bar-label">Engine Score</span>
          <span className="score-bar-value" style={{ color: barColor }}>
            {result.score}/100
          </span>
        </div>
        <div className="score-bar-track">
          <div
            className="score-bar-fill"
            style={{ width: `${result.score}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Response toggle */}
      <div className="engine-response">
        <button className="response-toggle" onClick={() => setExpanded(!expanded)}>
          <span className={`arrow ${expanded ? "open" : ""}`}>▼</span>
          {expanded ? "Hide Response" : "View Full Response"}
        </button>
        {expanded && (
          <div className="response-text">{result.response}</div>
        )}
      </div>
    </div>
  );
}

/* ── Main App ─────────────────────────────────────────────────────────── */
export default function App() {
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
          AI Engine Optimization
        </div>
        <h1>
          AEO Diagnostic<br />
          <span>Report Card</span>
        </h1>
        <p className="hero-subtitle">
          See how your product ranks when shoppers ask AI assistants.
          Query Llama&nbsp;3.3, Llama&nbsp;3.1, and Cohere simultaneously.
        </p>
      </header>

      {/* ── Input Card ────────────────────────────────────────────────── */}
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
          id="analyze-button"
          className={`analyze-btn ${loading ? "loading" : ""}`}
          onClick={analyze}
          disabled={loading || !query.trim() || !product.trim()}
        >
          {loading ? "Querying AI Engines..." : "Run AEO Diagnostic →"}
        </button>
        {error && <div className="error-message">{error}</div>}
      </div>

      {/* ── Loading State ─────────────────────────────────────────────── */}
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

      {/* ── Results ───────────────────────────────────────────────────── */}
      {data && (
        <div className="results-section">
          {/* Overall Score */}
          <div className={`score-card ${getGradeClass(data.overall_score)}`}>
            <div className="score-label">Overall AEO Score</div>
            <div
              className="score-grade"
              style={{
                color: overallGrade.color,
                animation: "scoreReveal 0.6s var(--ease)",
              }}
            >
              {overallGrade.letter}
            </div>
            <div className="score-number">{data.overall_score} / 100</div>
            <div className="score-query">
              "{data.product}" — "{data.query}"
            </div>

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
                  #{Math.round(
                    data.results
                      .filter((r) => r.position)
                      .reduce((a, r) => a + r.position, 0) /
                      (data.results.filter((r) => r.position).length || 1)
                  )}
                </div>
                <div className="stat-label">Avg Position</div>
              </div>
            </div>
          </div>

          {/* Engine Cards */}
          <div className="engine-grid">
            {data.results.map((r, i) => (
              <EngineCard key={i} result={r} />
            ))}
          </div>

          {/* Recommendations */}
          <div className="reco-card">
            <div className="reco-title">Recommendations</div>
            {data.overall_score < 40 && (
              <p className="reco-text">
                Your product has <strong>low AI visibility</strong>. Consider optimizing your
                product descriptions with keywords that match how shoppers query AI assistants.
                Focus on use-case language like "best for seniors" or "most effective for sleep".
                Strengthen your presence on review platforms and product aggregator sites that
                AI models frequently reference.
              </p>
            )}
            {data.overall_score >= 40 && data.overall_score < 70 && (
              <p className="reco-text">
                <strong>Moderate AI visibility.</strong> Your product is being mentioned but not
                consistently across all engines. Strengthen your presence on review platforms and
                ensure your product attributes match common shopper queries. Consider adding
                structured data and detailed product specifications to improve discoverability.
              </p>
            )}
            {data.overall_score >= 70 && (
              <p className="reco-text">
                <strong>Strong AI visibility!</strong> Your product is well-represented across AI
                engines. Focus on maintaining positive sentiment and appearing in the top 3
                mentions to maximize conversion from AI-assisted shopping. Monitor competitor
                movements and continue refreshing your product content.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="footer">
        <p>
          AEO Diagnostic · Built with{" "}
          <a href="https://groq.com" target="_blank" rel="noopener noreferrer">Groq</a> &{" "}
          <a href="https://cohere.com" target="_blank" rel="noopener noreferrer">Cohere</a>
        </p>
      </footer>
    </div>
  );
}
