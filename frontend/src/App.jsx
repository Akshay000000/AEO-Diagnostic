import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const grade = (score) => {
  if (score >= 80) return { letter: "A", color: "#22c55e" };
  if (score >= 60) return { letter: "B", color: "#84cc16" };
  if (score >= 40) return { letter: "C", color: "#eab308" };
  if (score >= 20) return { letter: "D", color: "#f97316" };
  return { letter: "F", color: "#ef4444" };
};

const EngineCard = ({ result }) => {
  const [expanded, setExpanded] = useState(false);
  const g = grade(result.score);

  return (
    <div style={{
      background: "#0d0d0d",
      border: "1px solid #222",
      borderRadius: 16,
      padding: "1.5rem",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: result.mentioned ? g.color : "#333"
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: 4 }}>{result.engine}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: "0.7rem", padding: "3px 10px", borderRadius: 980,
              background: result.mentioned ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
              color: result.mentioned ? "#22c55e" : "#ef4444",
              fontWeight: 600, letterSpacing: "0.05em"
            }}>
              {result.mentioned ? "MENTIONED" : "NOT MENTIONED"}
            </span>
            {result.position && (
              <span style={{
                fontSize: "0.7rem", padding: "3px 10px", borderRadius: 980,
                background: "rgba(255,106,0,0.15)", color: "#ff6a00",
                fontWeight: 600
              }}>
                #{result.position} mention
              </span>
            )}
            <span style={{
              fontSize: "0.7rem", padding: "3px 10px", borderRadius: 980,
              background: "rgba(255,255,255,0.05)", color: "#888",
              fontWeight: 600, textTransform: "capitalize"
            }}>
              {result.sentiment}
            </span>
          </div>
        </div>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          border: `2px solid ${g.color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0
        }}>
          <span style={{ fontSize: "1.3rem", fontWeight: 800, color: g.color }}>{g.letter}</span>
        </div>
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: "0.75rem", color: "#666" }}>AEO Score</span>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: g.color }}>{result.score}/100</span>
        </div>
        <div style={{ height: 6, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${result.score}%`,
            background: g.color, borderRadius: 3,
            transition: "width 1s ease"
          }} />
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none", border: "1px solid #222", borderRadius: 8,
          color: "#666", fontSize: "0.75rem", padding: "6px 12px",
          cursor: "pointer", width: "100%", textAlign: "left",
          display: "flex", justifyContent: "space-between"
        }}
      >
        <span>Full AI response</span>
        <span>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{
          marginTop: "0.75rem", padding: "1rem",
          background: "#0a0a0a", borderRadius: 8,
          fontSize: "0.82rem", color: "#aaa", lineHeight: 1.7,
          border: "1px solid #1a1a1a"
        }}>
          {result.response}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!query.trim() || !product.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, product }),
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError("Failed to connect to backend. Make sure it's running.");
    }
    setLoading(false);
  };

  const overallGrade = data ? grade(data.overall_score) : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#000", color: "#fff",
      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "2rem 1rem"
    }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{
            fontSize: "0.75rem", fontWeight: 700, color: "#ff6a00",
            letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.75rem"
          }}>
            AI Engine Optimization
          </div>
          <h1 style={{
            fontSize: "clamp(2rem,6vw,3.5rem)", fontWeight: 800,
            letterSpacing: "-0.04em", lineHeight: 1.05, margin: "0 0 1rem"
          }}>
            AEO Diagnostic<br />
            <span style={{ color: "rgba(255,255,255,0.25)" }}>Report Card</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "1rem", maxWidth: 500, margin: "0 auto" }}>
            See how your product ranks when shoppers ask AI assistants.
            Query Claude, Gemini, and Cohere simultaneously.
          </p>
        </div>

        <div style={{
          background: "#0d0d0d", border: "1px solid #222",
          borderRadius: 20, padding: "2rem", marginBottom: "2rem"
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ff6a00", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Shopper query
            </label>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='e.g. "best magnesium supplement for seniors"'
              style={{
                width: "100%", background: "#000", border: "1px solid #333",
                borderRadius: 10, padding: "0.85rem 1rem", color: "#fff",
                fontSize: "0.95rem", fontFamily: "inherit", outline: "none",
                boxSizing: "border-box"
              }}
              onKeyDown={e => e.key === "Enter" && analyze()}
            />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ff6a00", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Your product / brand
            </label>
            <input
              value={product}
              onChange={e => setProduct(e.target.value)}
              placeholder='e.g. "Nature Made Magnesium"'
              style={{
                width: "100%", background: "#000", border: "1px solid #333",
                borderRadius: 10, padding: "0.85rem 1rem", color: "#fff",
                fontSize: "0.95rem", fontFamily: "inherit", outline: "none",
                boxSizing: "border-box"
              }}
              onKeyDown={e => e.key === "Enter" && analyze()}
            />
          </div>
          <button
            onClick={analyze}
            disabled={loading || !query.trim() || !product.trim()}
            style={{
              width: "100%", background: loading ? "#333" : "#ff6a00",
              color: loading ? "#666" : "#000", border: "none",
              borderRadius: 980, padding: "0.9rem",
              fontSize: "0.95rem", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s", fontFamily: "inherit",
              letterSpacing: "-0.01em"
            }}
          >
            {loading ? "Querying Claude, Gemini & Cohere..." : "Run AEO Diagnostic →"}
          </button>
          {error && <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.75rem", textAlign: "center" }}>{error}</p>}
        </div>

        {data && (
          <>
            <div style={{
              background: "#0d0d0d", border: `1px solid ${overallGrade.color}33`,
              borderRadius: 20, padding: "2rem", marginBottom: "1.5rem",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#666", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                Overall AEO Score
              </div>
              <div style={{ fontSize: "5rem", fontWeight: 800, color: overallGrade.color, lineHeight: 1, marginBottom: "0.5rem" }}>
                {overallGrade.letter}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
                {data.overall_score}/100
              </div>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>
                "{data.product}" for query: "{data.query}"
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#22c55e" }}>
                    {data.results.filter(r => r.mentioned).length}/3
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Engines mentioned</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ff6a00" }}>
                    {data.results.filter(r => r.sentiment === "positive").length}/3
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Positive sentiment</div>
                </div>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>
                    #{Math.round(data.results.filter(r => r.position).reduce((a, r) => a + r.position, 0) / (data.results.filter(r => r.position).length || 1))}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Avg position</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: "1rem" }}>
              {data.results.map((r, i) => <EngineCard key={i} result={r} />)}
            </div>

            <div style={{
              background: "#0d0d0d", border: "1px solid #222",
              borderRadius: 16, padding: "1.5rem", marginTop: "1.5rem"
            }}>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ff6a00", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "1rem" }}>
                Recommendations
              </div>
              {data.overall_score < 40 && (
                <p style={{ fontSize: "0.85rem", color: "#aaa", lineHeight: 1.7 }}>
                  Your product has low AI visibility. Consider optimizing your product descriptions with keywords that match how shoppers query AI assistants. Focus on use-case language like "best for seniors" or "most effective for sleep".
                </p>
              )}
              {data.overall_score >= 40 && data.overall_score < 70 && (
                <p style={{ fontSize: "0.85rem", color: "#aaa", lineHeight: 1.7 }}>
                  Moderate AI visibility. Your product is being mentioned but not consistently across all engines. Strengthen your presence on review platforms and ensure your product attributes match common shopper queries.
                </p>
              )}
              {data.overall_score >= 70 && (
                <p style={{ fontSize: "0.85rem", color: "#aaa", lineHeight: 1.7 }}>
                  Strong AI visibility. Your product is well-represented across AI engines. Focus on maintaining positive sentiment and appearing in the top 3 mentions to maximize conversion from AI-assisted shopping.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
