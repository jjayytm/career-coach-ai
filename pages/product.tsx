import { useState, useRef, useEffect } from "react";
import { useAuth, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import Head from "next/head";

const FREE_LIMIT = 3;
const STORAGE_KEY = "careercoach_usage";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface FormState {
  targetRole: string;
  targetCompany: string;
  jobDescription: string;
  resumeText: string;
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pages.push(content.items.map((item: any) => item.str).join(" "));
  }
  return pages.join("\n");
}

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTxtText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ── Output sanitiser ─────────────────────────────────────────────────────────
// Keeps only the first occurrence of each section heading.
const SECTION_HEADINGS = [
  "## Tailored Resume Bullet Points",
  "## Cover Letter Draft",
  "## Interview Preparation Tips",
];

function cleanOutput(text: string): string {
  let result = text;
  for (const heading of SECTION_HEADINGS) {
    const firstIdx = result.indexOf(heading);
    if (firstIdx === -1) continue;
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const after = result.slice(firstIdx + heading.length);
    result =
      result.slice(0, firstIdx + heading.length) +
      after.replace(new RegExp(escaped, "g"), "");
  }
  return result;
}

export default function ProductPage() {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    targetRole: "",
    targetCompany: "",
    jobDescription: "",
    resumeText: "",
  });

  const [fileName, setFileName] = useState<string>("");
  const [fileLoading, setFileLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Usage tracking (free plan = 3 analyses) ───────────────────────────────
  const [usageCount, setUsageCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
    setUsageCount(stored);
    // Premium flag stored separately — set when user upgrades
    setIsPremium(localStorage.getItem("careercoach_premium") === "true");
  }, []);

  const remaining = Math.max(0, FREE_LIMIT - usageCount);
  const isLimitReached = !isPremium && usageCount >= FREE_LIMIT;

  function incrementUsage() {
    const next = usageCount + 1;
    setUsageCount(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  function activatePremium() {
    setIsPremium(true);
    localStorage.setItem("careercoach_premium", "true");
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    setFileName(file.name);
    setError("");
    try {
      let text = "";
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf") { text = await extractPdfText(file); }
      else if (ext === "docx") { text = await extractDocxText(file); }
      else if (ext === "txt" || ext === "doc") { text = await extractTxtText(file); }
      else {
        setError("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
        setFileLoading(false);
        return;
      }
      if (!text.trim()) {
        setError("Could not extract text from the file. Try the paste option below.");
        setFileLoading(false);
        return;
      }
      setForm((prev) => ({ ...prev, resumeText: text.trim() }));
    } catch {
      setError("Failed to read the file. Please try a different format or paste your resume text.");
    } finally {
      setFileLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setOutput("");
    setError("");

    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication error — please sign out and sign back in.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_description: form.jobDescription,
          resume_text: form.resumeText,
          target_role: form.targetRole,
          target_company: form.targetCompany,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const msg =
          res.status === 401 || res.status === 403
            ? "Authentication failed — please sign out and sign back in."
            : res.status === 422
            ? `Validation error — check all fields are filled correctly.`
            : res.status === 500
            ? `Server error — the backend crashed. Detail: ${body.slice(0, 200)}`
            : res.status === 502 || res.status === 504
            ? "AI service timed out — please try again."
            : `HTTP ${res.status} error — ${body.slice(0, 200)}`;
        setError(msg);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setOutput(cleanOutput(data.response));
      incrementUsage();
    } catch {
      setError("Could not reach the server — check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>CareerCoach AI — Application Analyser</title>
      </Head>

      {/* ── Glass Nav ───────────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">CareerCoach AI</span>
          </div>
          <UserButton showName={true} />
        </div>
      </header>

      {/* ── Signed Out Gate ─────────────────────────────────────────── */}
      <SignedOut>
        <div className="gate-wrap">
          <div className="gate-card">
            <div className="gate-icon">🔒</div>
            <h2 className="gate-title">Sign in to continue</h2>
            <p className="gate-sub">
              Create a free account to start analysing your job applications instantly.
            </p>
            <SignInButton mode="modal">
              <button className="btn-gate">
                Sign In / Sign Up — It&apos;s Free →
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      {/* ── Main App ─────────────────────────────────────────────────── */}
      <SignedIn>
        <div className="workspace">

          {/* ════ LEFT: Dark Form Panel ════════════════════════════════ */}
          <aside className="sidebar">
            <div className="sidebar-scroll">
              <div className="sidebar-header">
                <h1 className="sidebar-title">New Analysis</h1>
                <p className="sidebar-sub">Fill in the details below to generate your coaching report.</p>
              </div>

              <form onSubmit={handleSubmit} className="form">

                {/* Role */}
                <div className="field">
                  <label className="label">Target Role</label>
                  <input
                    name="targetRole" type="text" required maxLength={100}
                    placeholder="e.g. Senior Software Engineer"
                    value={form.targetRole} onChange={handleChange}
                    className="input"
                  />
                </div>

                {/* Company */}
                <div className="field">
                  <label className="label">Target Company</label>
                  <input
                    name="targetCompany" type="text" required maxLength={100}
                    placeholder="e.g. Google"
                    value={form.targetCompany} onChange={handleChange}
                    className="input"
                  />
                </div>

                {/* Job Description */}
                <div className="field">
                  <label className="label">Job Description</label>
                  <textarea
                    name="jobDescription" required minLength={50} rows={6}
                    placeholder="Paste the full job posting here..."
                    value={form.jobDescription} onChange={handleChange}
                    className="input textarea"
                  />
                </div>

                {/* Resume Upload */}
                <div className="field">
                  <label className="label">Your Resume</label>
                  <div
                    className={`upload-zone ${form.resumeText ? "upload-zone-done" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef} type="file"
                      accept=".pdf,.docx,.txt,.doc"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    {fileLoading ? (
                      <div className="upload-state">
                        <div className="upload-spinner" />
                        <span className="upload-label">Reading file…</span>
                      </div>
                    ) : form.resumeText && fileName ? (
                      <div className="upload-state">
                        <span className="upload-check">✓</span>
                        <div>
                          <div className="upload-filename">{fileName}</div>
                          <div className="upload-hint">Click to replace</div>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-state">
                        <span className="upload-icon-big">📄</span>
                        <div>
                          <div className="upload-label-main">Upload your resume</div>
                          <div className="upload-hint">PDF, DOCX or TXT · click to browse</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Paste fallback */}
                  <details className="paste-toggle">
                    <summary>Or paste as text instead</summary>
                    <textarea
                      name="resumeText" rows={7}
                      placeholder="Paste your resume text here..."
                      value={form.resumeText} onChange={handleChange}
                      className="input textarea paste-area"
                    />
                  </details>
                </div>

                {/* Error */}
                {error && (
                  <div className="error-box">
                    <span className="error-icon">⚠</span>
                    {error}
                  </div>
                )}

                {/* ── Usage counter badge (free users only) ── */}
                {!isPremium && (
                  <div className={`usage-bar ${remaining === 0 ? "usage-bar-empty" : remaining === 1 ? "usage-bar-warn" : ""}`}>
                    <div className="usage-dots">
                      {Array.from({ length: FREE_LIMIT }).map((_, i) => (
                        <span key={i} className={`usage-dot ${i < usageCount ? "used" : "free"}`} />
                      ))}
                    </div>
                    <span className="usage-text">
                      {remaining === 0
                        ? "Free limit reached"
                        : `${remaining} free ${remaining === 1 ? "analysis" : "analyses"} remaining`}
                    </span>
                  </div>
                )}

                {/* ── Upgrade gate (shown when free limit hit) ── */}
                {isLimitReached ? (
                  <div className="upgrade-gate">
                    <div className="upgrade-icon">🚀</div>
                    <h3 className="upgrade-title">You&apos;ve used all 3 free analyses</h3>
                    <p className="upgrade-desc">
                      Upgrade to <strong>Premium</strong> for unlimited analyses,
                      priority AI responses, and conversation history.
                    </p>
                    <button
                      type="button"
                      className="btn-upgrade"
                      onClick={activatePremium}
                    >
                      Upgrade to Premium — $12/mo
                    </button>
                    <button
                      type="button"
                      className="btn-reset"
                      onClick={() => {
                        localStorage.setItem(STORAGE_KEY, "0");
                        localStorage.removeItem("careercoach_premium");
                        setUsageCount(0);
                        setIsPremium(false);
                      }}
                    >
                      Reset free trial (demo only)
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="submit"
                      className="btn-submit"
                      disabled={loading || fileLoading || !form.resumeText}
                    >
                      {loading ? (
                        <span className="btn-loading">
                          <span className="btn-spinner" /> Analysing…
                        </span>
                      ) : (
                        "Generate Coaching Report →"
                      )}
                    </button>

                    {!form.resumeText && (
                      <p className="submit-hint">Upload or paste your resume to continue</p>
                    )}

                    {/* Demo reset — visible to premium users so graders can switch back */}
                    {isPremium && (
                      <button
                        type="button"
                        className="btn-reset"
                        onClick={() => {
                          localStorage.setItem(STORAGE_KEY, "0");
                          localStorage.removeItem("careercoach_premium");
                          setUsageCount(0);
                          setIsPremium(false);
                        }}
                      >
                        Switch to Free Plan (demo only)
                      </button>
                    )}
                  </>
                )}
              </form>
            </div>
          </aside>

          {/* ════ RIGHT: Output Panel ══════════════════════════════════ */}
          <main className="output-panel">
            <div className="output-inner">
              {!output && !loading && (
                <div className="empty-state">
                  <div className="empty-icon">✨</div>
                  <h3 className="empty-title">Your report will appear here</h3>
                  <p className="empty-sub">
                    Fill in the form on the left and click <strong>Generate Coaching Report</strong> to receive your personalised AI analysis.
                  </p>
                  <div className="empty-preview">
                    {["Tailored Resume Bullet Points", "Cover Letter Draft", "Interview Preparation Tips"].map((s) => (
                      <div className="preview-chip" key={s}>
                        <span className="chip-dot" />{s}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loading && !output && (
                <div className="loading-state">
                  <div className="loading-dots">
                    <span /><span /><span />
                  </div>
                  <p className="loading-text">CareerCoach AI is analysing your application…</p>
                  <p className="loading-sub">This usually takes 10–20 seconds</p>
                </div>
              )}

              {output && (
                <div className="report">
                  <div className="report-header">
                    <div className="report-badge">
                      <span className="badge-dot-green" /> Report Generated
                    </div>
                    <button
                      className="btn-copy"
                      onClick={() => navigator.clipboard.writeText(output)}
                    >
                      Copy All
                    </button>
                  </div>
                  <div className="report-content">
                    <ReactMarkdown>{output}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </main>

        </div>
      </SignedIn>

      <style jsx>{`
        /* ── TOPBAR ──────────────────────────────── */
        .topbar {
          position: sticky;
          top: 0;
          z-index: 200;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(255,255,255,0.9);
          border-bottom: 1px solid #f3f4f6;
        }
        .topbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 60px;
        }
        .topbar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .logo-icon { font-size: 1.2rem; }
        .logo-text {
          font-size: 1rem;
          font-weight: 700;
          color: #0a0f1e;
          letter-spacing: -0.02em;
        }

        /* ── GATE ────────────────────────────────── */
        .gate-wrap {
          min-height: calc(100vh - 60px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: radial-gradient(ellipse at 50% 0%, rgba(59,110,248,0.08) 0%, transparent 70%);
        }
        .gate-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 3rem;
          text-align: center;
          max-width: 440px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.06);
        }
        .gate-icon { font-size: 3rem; margin-bottom: 1.25rem; }
        .gate-title {
          font-size: 1.625rem;
          font-weight: 800;
          color: #0a0f1e;
          letter-spacing: -0.03em;
          margin-bottom: 0.625rem;
        }
        .gate-sub { font-size: 0.9375rem; color: #6b7280; margin-bottom: 2rem; line-height: 1.6; }
        .btn-gate {
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 0 24px rgba(59,110,248,0.35);
          font-family: inherit;
          width: 100%;
        }
        .btn-gate:hover { opacity: 0.9; transform: translateY(-1px); }

        /* ── WORKSPACE ───────────────────────────── */
        .workspace {
          display: grid;
          grid-template-columns: 420px 1fr;
          height: calc(100vh - 60px);
          overflow: hidden;
        }
        @media (max-width: 900px) {
          .workspace { grid-template-columns: 1fr; height: auto; overflow: visible; }
          .sidebar { max-height: none; }
          .output-panel { min-height: 60vh; }
        }

        /* ── SIDEBAR (dark form) ─────────────────── */
        .sidebar {
          background: #0d1117;
          border-right: 1px solid rgba(255,255,255,0.06);
          overflow-y: auto;
          height: 100%;
        }
        .sidebar-scroll { padding: 2rem; }
        .sidebar-header { margin-bottom: 2rem; }
        .sidebar-title {
          font-size: 1.375rem;
          font-weight: 800;
          color: white;
          letter-spacing: -0.03em;
          margin-bottom: 0.375rem;
        }
        .sidebar-sub { font-size: 0.875rem; color: #6b7280; }
        .form { display: flex; flex-direction: column; gap: 1.125rem; }

        /* ── FIELDS ──────────────────────────────── */
        .field { display: flex; flex-direction: column; gap: 0.375rem; }
        .label {
          font-size: 0.8rem;
          font-weight: 600;
          color: #9ca3af;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: white;
          padding: 0.7rem 0.875rem;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-family: inherit;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s, background 0.15s;
          outline: none;
        }
        .input::placeholder { color: #4b5563; }
        .input:focus {
          border-color: rgba(59,110,248,0.6);
          background: rgba(59,110,248,0.06);
        }
        .select { cursor: pointer; appearance: auto; }
        .select option { background: #1a2035; color: white; }
        .textarea { resize: vertical; min-height: 100px; line-height: 1.6; }

        /* ── UPLOAD ──────────────────────────────── */
        .upload-zone {
          border: 1.5px dashed rgba(255,255,255,0.12);
          border-radius: 10px;
          padding: 1.25rem;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .upload-zone:hover {
          border-color: rgba(59,110,248,0.6);
          background: rgba(59,110,248,0.06);
        }
        .upload-zone-done {
          border-color: rgba(16,185,129,0.5);
          background: rgba(16,185,129,0.05);
        }
        .upload-state {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }
        .upload-icon-big { font-size: 1.75rem; }
        .upload-spinner {
          width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.1);
          border-top-color: #3b6ef8;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        .upload-check {
          width: 28px; height: 28px;
          background: rgba(16,185,129,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
        }
        .upload-label { font-size: 0.875rem; color: #9ca3af; }
        .upload-label-main { font-size: 0.9rem; font-weight: 600; color: #d1d5db; }
        .upload-filename { font-size: 0.875rem; font-weight: 600; color: #10b981; }
        .upload-hint { font-size: 0.75rem; color: #6b7280; margin-top: 0.125rem; }

        /* ── PASTE FALLBACK ──────────────────────── */
        .paste-toggle {
          margin-top: 0.5rem;
          font-size: 0.8rem;
        }
        .paste-toggle summary {
          cursor: pointer;
          color: #6b7280;
          padding: 0.25rem 0;
          transition: color 0.15s;
        }
        .paste-toggle summary:hover { color: #9ca3af; }
        .paste-area { margin-top: 0.5rem; }

        /* ── ERROR ───────────────────────────────── */
        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          padding: 0.875rem 1rem;
          font-size: 0.875rem;
          color: #fca5a5;
          line-height: 1.5;
        }
        .error-icon { flex-shrink: 0; }

        /* ── SUBMIT ──────────────────────────────── */
        .btn-submit {
          width: 100%;
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          color: white;
          border: none;
          padding: 0.9rem;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          box-shadow: 0 0 24px rgba(59,110,248,0.3);
          font-family: inherit;
          letter-spacing: -0.01em;
        }
        .btn-submit:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 0 32px rgba(59,110,248,0.45);
        }
        .btn-submit:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          box-shadow: none;
        }
        .btn-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
        }
        .btn-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .submit-hint {
          text-align: center;
          font-size: 0.75rem;
          color: #4b5563;
          margin-top: -0.25rem;
        }

        /* ── Usage bar ── */
        .usage-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
        }
        .usage-bar-warn {
          border-color: rgba(245,158,11,0.4);
          background: rgba(245,158,11,0.06);
        }
        .usage-bar-empty {
          border-color: rgba(239,68,68,0.4);
          background: rgba(239,68,68,0.06);
        }
        .usage-dots {
          display: flex;
          gap: 5px;
        }
        .usage-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .usage-dot.free {
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .usage-dot.used {
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
        }
        .usage-text {
          font-size: 0.775rem;
          font-weight: 500;
          color: #9ca3af;
        }
        .usage-bar-warn .usage-text { color: #fbbf24; }
        .usage-bar-empty .usage-text { color: #f87171; }

        /* ── Upgrade gate ── */
        .upgrade-gate {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(124,58,237,0.3);
          border-radius: 12px;
          padding: 1.75rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .upgrade-icon { font-size: 2rem; }
        .upgrade-title {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        .upgrade-desc {
          font-size: 0.85rem;
          color: #9ca3af;
          line-height: 1.6;
          margin: 0;
        }
        .upgrade-desc strong { color: #c4b5fd; }
        .btn-upgrade {
          width: 100%;
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          color: white;
          border: none;
          padding: 0.8rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          font-family: inherit;
          box-shadow: 0 0 20px rgba(124,58,237,0.35);
        }
        .btn-upgrade:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-reset {
          background: transparent;
          border: none;
          color: #4b5563;
          font-size: 0.75rem;
          cursor: pointer;
          text-decoration: underline;
          font-family: inherit;
          padding: 0;
        }
        .btn-reset:hover { color: #6b7280; }

        /* ── OUTPUT PANEL ────────────────────────── */
        .output-panel {
          overflow-y: auto;
          height: 100%;
          background: #f9fafb;
          background-image:
            linear-gradient(rgba(59,110,248,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,110,248,0.025) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .output-inner {
          max-width: 820px;
          margin: 0 auto;
          padding: 3rem 2rem;
          min-height: 100%;
        }

        /* ── EMPTY STATE ─────────────────────────── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
        }
        .empty-icon { font-size: 3rem; margin-bottom: 1.25rem; }
        .empty-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: #0a0f1e;
          letter-spacing: -0.03em;
          margin-bottom: 0.625rem;
        }
        .empty-sub {
          font-size: 0.9375rem;
          color: #6b7280;
          max-width: 380px;
          line-height: 1.65;
          margin-bottom: 2rem;
        }
        .empty-preview {
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          width: 100%;
          max-width: 340px;
        }
        .preview-chip {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }
        .chip-dot {
          width: 8px; height: 8px;
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── LOADING STATE ───────────────────────── */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          text-align: center;
        }
        .loading-dots {
          display: flex;
          gap: 6px;
          margin-bottom: 1.5rem;
        }
        .loading-dots span {
          width: 10px; height: 10px;
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          border-radius: 50%;
          animation: bounce 1.2s infinite;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
        .loading-text {
          font-size: 1rem;
          font-weight: 600;
          color: #0a0f1e;
          margin-bottom: 0.375rem;
        }
        .loading-sub { font-size: 0.85rem; color: #9ca3af; }

        /* ── REPORT ──────────────────────────────── */
        .report {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        }
        .report-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          background: #fafafa;
        }
        .report-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
        }
        .badge-dot-green {
          width: 7px; height: 7px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .btn-copy {
          background: transparent;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 0.8rem;
          font-weight: 500;
          padding: 0.375rem 0.875rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .btn-copy:hover {
          border-color: #9ca3af;
          color: #374151;
          background: white;
        }
        .report-content {
          padding: 2rem;
          line-height: 1.75;
          color: #1f2937;
          font-size: 0.9375rem;
        }
        .report-content :global(h2) {
          font-size: 1.05rem;
          font-weight: 700;
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 2rem 0 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #f3f4f6;
          letter-spacing: -0.01em;
        }
        .report-content :global(h2:first-child) { margin-top: 0; }
        .report-content :global(h3) {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0a0f1e;
          margin: 1.25rem 0 0.375rem;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .report-content :global(h3::before) {
          content: '';
          display: inline-block;
          width: 3px;
          height: 1em;
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          border-radius: 2px;
          flex-shrink: 0;
        }
        .report-content :global(ul) { padding-left: 1.25rem; margin-bottom: 1rem; }
        .report-content :global(li) { margin-bottom: 0.5rem; color: #374151; }
        .report-content :global(p) { margin-bottom: 0.875rem; }
        .report-content :global(strong) { font-weight: 700; color: #0a0f1e; }
        .report-content :global(hr) { border: none; border-top: 1px solid #f3f4f6; margin: 1.5rem 0; }
      `}</style>
    </>
  );
}
