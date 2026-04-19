import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Head from "next/head";

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>CareerCoach AI — Land Your Dream Job</title>
        <meta name="description" content="AI-powered job application coaching: tailored resume bullets, cover letters, and interview prep in seconds." />
      </Head>

      {/* ── Sticky Glass Nav ─────────────────────────────────────────── */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">CareerCoach AI</span>
          </div>
          <div className="nav-actions">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-ghost">Sign In</button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="btn-nav-primary">Get Started Free →</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/product">
                <button className="btn-nav-primary">Open App →</button>
              </Link>
              <UserButton showName={true} />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
          <div className="hero-grid" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" />
            Powered by AWS Bedrock · Nova 2 Lite
          </div>
          <h1 className="hero-title">
            Stop Applying Blindly.<br />
            <span className="gradient-text">Start Landing Interviews.</span>
          </h1>
          <p className="hero-sub">
            Paste your resume and job description. In under 60 seconds, get
            tailored bullet points, a compelling cover letter, and role-specific
            interview prep — crafted by AI.
          </p>
          <div className="hero-actions">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn-hero-primary">
                  Analyse My Application Free
                  <span className="btn-arrow">→</span>
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="btn-hero-ghost">Watch how it works</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/product">
                <button className="btn-hero-primary">
                  Open CareerCoach AI
                  <span className="btn-arrow">→</span>
                </button>
              </Link>
            </SignedIn>
          </div>
          <div className="trust-row">
            <div className="trust-item">
              <span className="trust-icon">✓</span> No credit card required
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <span className="trust-icon">✓</span> Free plan available
            </div>
            <div className="trust-divider" />
            <div className="trust-item">
              <span className="trust-icon">★</span> 4.9 / 5 rating
            </div>
          </div>
        </div>

        {/* Hero Preview Card */}
        <div className="hero-card">
          <div className="card-header">
            <div className="card-dots">
              <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
            </div>
            <span className="card-title">Coaching Report</span>
          </div>
          <div className="card-body">
            <div className="card-section">
              <div className="section-label gradient-text">## Tailored Resume Bullet Points</div>
              <div className="skeleton-line w-full" />
              <div className="skeleton-line w-5/6" />
              <div className="skeleton-line w-4/6" />
            </div>
            <div className="card-section">
              <div className="section-label gradient-text">## Cover Letter Draft</div>
              <div className="skeleton-line w-full" />
              <div className="skeleton-line w-full" />
              <div className="skeleton-line w-3/4" />
            </div>
            <div className="card-section">
              <div className="section-label gradient-text">## Interview Prep Tips</div>
              <div className="skeleton-line w-full" />
              <div className="skeleton-line w-5/6" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="section features-section">
        <div className="section-inner">
          <div className="section-label-top">FEATURES</div>
          <h2 className="section-title">Everything You Need to Get the Job</h2>
          <p className="section-sub">
            Three AI-powered outputs, perfectly tailored to every application.
          </p>
          <div className="features-grid">
            {[
              {
                icon: "📝",
                gradient: "linear-gradient(135deg,#3b6ef8,#06b6d4)",
                title: "ATS-Optimised Bullet Points",
                desc: "AI rewrites your resume bullets with the exact keywords from the job description, so your application sails through automated screening systems.",
              },
              {
                icon: "✉️",
                gradient: "linear-gradient(135deg,#7c3aed,#ec4899)",
                title: "Personalised Cover Letters",
                desc: "No more templates. Every letter connects your specific experience to the role's requirements, with an opening line that makes hiring managers keep reading.",
              },
              {
                icon: "🎯",
                gradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
                title: "Role-Specific Interview Prep",
                desc: "Know exactly what questions to expect and how to answer them using the STAR method — tailored to your background and this specific role.",
              },
            ].map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon-wrap" style={{ background: f.gradient }}>
                  <span className="feature-icon">{f.icon}</span>
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section className="section how-section">
        <div className="section-inner">
          <div className="section-label-top">HOW IT WORKS</div>
          <h2 className="section-title">Three steps. Under 60 seconds.</h2>
          <div className="steps-grid">
            {[
              { n: "01", title: "Upload Your Resume", desc: "Upload a PDF or DOCX, or paste your resume text. We extract everything automatically." },
              { n: "02", title: "Paste the Job Description", desc: "Copy the full job posting. The more detail, the better the AI can tailor your materials." },
              { n: "03", title: "Receive Your Report", desc: "Get tailored bullet points, a full cover letter, and interview prep tips — all in one click." },
            ].map((s, i) => (
              <div className="step" key={s.n}>
                <div className="step-number">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
                {i < 2 && <div className="step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section className="section pricing-section">
        <div className="section-inner">
          <div className="section-label-top">PRICING</div>
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-sub">Start free. Upgrade when you&apos;re ready.</p>
          <div className="pricing-grid">
            {/* Free */}
            <div className="pricing-card">
              <div className="plan-name">Free</div>
              <div className="plan-price">$0<span className="plan-period">/month</span></div>
              <p className="plan-desc">Perfect for occasional job seekers.</p>
              <ul className="plan-features">
                {["3 analyses per month","Tailored bullet points","Basic cover letter","Community support"].map(f => (
                  <li key={f}><span className="check">✓</span>{f}</li>
                ))}
              </ul>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn-plan-ghost">Get Started Free</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/product"><button className="btn-plan-ghost">Go to App</button></Link>
              </SignedIn>
            </div>
            {/* Premium */}
            <div className="pricing-card pricing-featured">
              <div className="popular-badge">Most Popular</div>
              <div className="plan-name">Premium</div>
              <div className="plan-price plan-price-gradient">$12<span className="plan-period">/month</span></div>
              <p className="plan-desc">For serious job seekers applying at scale.</p>
              <ul className="plan-features">
                {["Unlimited analyses","All Free features","Full interview prep tips","Conversation history","Priority AI responses","Email support"].map(f => (
                  <li key={f}><span className="check check-blue">✓</span>{f}</li>
                ))}
              </ul>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="btn-plan-primary">Start Free Trial</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/product"><button className="btn-plan-primary">Upgrade Now</button></Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">CareerCoach AI</span>
          </div>
          <p className="footer-copy">
            © 2026 CareerCoach AI · Built with Next.js, FastAPI &amp; AWS Bedrock
          </p>
        </div>
      </footer>

      <style jsx>{`
        /* ── NAV ─────────────────────────────────── */
        .nav {
          position: sticky;
          top: 0;
          z-index: 200;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(255,255,255,0.85);
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .logo-icon { font-size: 1.25rem; }
        .logo-text {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0a0f1e;
          letter-spacing: -0.02em;
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .btn-ghost {
          background: transparent;
          border: none;
          color: #374151;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }
        .btn-ghost:hover { background: #f3f4f6; }
        .btn-nav-primary {
          background: #0a0f1e;
          color: white;
          border: none;
          padding: 0.5rem 1.25rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
          font-family: inherit;
        }
        .btn-nav-primary:hover { opacity: 0.85; }

        /* ── HERO ────────────────────────────────── */
        .hero {
          position: relative;
          min-height: 88vh;
          background: #0a0f1e;
          display: grid;
          grid-template-columns: 1fr 480px;
          align-items: center;
          gap: 4rem;
          padding: 6rem 6rem 5rem;
          overflow: hidden;
        }
        @media (max-width: 1100px) {
          .hero { grid-template-columns: 1fr; padding: 4rem 2rem; }
          .hero-card { display: none; }
        }
        .hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
        }
        .orb-1 {
          width: 500px; height: 500px;
          background: #3b6ef8;
          top: -100px; left: -100px;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: #7c3aed;
          bottom: -100px; right: 200px;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: #06b6d4;
          top: 50%; right: -50px;
        }
        .hero-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }
        .hero-content {
          position: relative;
          z-index: 10;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(59,110,248,0.15);
          border: 1px solid rgba(59,110,248,0.3);
          color: #93c5fd;
          font-size: 0.8rem;
          font-weight: 500;
          padding: 0.375rem 0.875rem;
          border-radius: 999px;
          margin-bottom: 2rem;
          letter-spacing: 0.01em;
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          background: #3b82f6;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          color: white;
          line-height: 1.05;
          letter-spacing: -0.03em;
          margin-bottom: 1.5rem;
        }
        .gradient-text {
          background: linear-gradient(135deg, #3b6ef8, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: 1.125rem;
          color: #9ca3af;
          line-height: 1.7;
          max-width: 540px;
          margin-bottom: 2.5rem;
        }
        .hero-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }
        .btn-hero-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 30px rgba(59,110,248,0.4);
          font-family: inherit;
        }
        .btn-hero-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 40px rgba(59,110,248,0.6);
        }
        .btn-arrow { transition: transform 0.2s; }
        .btn-hero-primary:hover .btn-arrow { transform: translateX(3px); }
        .btn-hero-ghost {
          background: transparent;
          color: #9ca3af;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 0.875rem 1.75rem;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
          font-family: inherit;
        }
        .btn-hero-ghost:hover { border-color: rgba(255,255,255,0.25); color: white; }
        .trust-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.85rem;
          color: #6b7280;
        }
        .trust-icon { color: #3b6ef8; font-weight: 700; }
        .trust-divider {
          width: 1px;
          height: 14px;
          background: #374151;
        }

        /* ── HERO CARD ───────────────────────────── */
        .hero-card {
          position: relative;
          z-index: 10;
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0,0,0,0.5);
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }
        .card-dots { display: flex; gap: 6px; }
        .dot { width: 11px; height: 11px; border-radius: 50%; }
        .dot.red { background: #ff5f57; }
        .dot.yellow { background: #febc2e; }
        .dot.green { background: #28c840; }
        .card-title { font-size: 0.8rem; color: #6b7280; font-weight: 500; }
        .card-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .card-section { display: flex; flex-direction: column; gap: 0.5rem; }
        .section-label { font-size: 0.75rem; font-weight: 700; margin-bottom: 0.25rem; }
        .skeleton-line {
          height: 10px;
          background: rgba(255,255,255,0.08);
          border-radius: 6px;
          animation: shimmer 2s infinite;
        }
        .w-full { width: 100%; }
        .w-5\/6 { width: 83%; }
        .w-4\/6 { width: 66%; }
        .w-3\/4 { width: 75%; }
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* ── SECTIONS ────────────────────────────── */
        .section { padding: 6rem 2rem; }
        .section-inner { max-width: 1100px; margin: 0 auto; }
        .section-label-top {
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #3b6ef8;
          margin-bottom: 1rem;
          text-transform: uppercase;
        }
        .section-title {
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 800;
          color: #0a0f1e;
          letter-spacing: -0.03em;
          margin-bottom: 1rem;
        }
        .section-sub {
          font-size: 1.1rem;
          color: #6b7280;
          margin-bottom: 3.5rem;
        }

        /* ── FEATURES ────────────────────────────── */
        .features-section { background: white; }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .feature-card {
          background: white;
          border: 1px solid #f3f4f6;
          border-radius: 16px;
          padding: 2rem;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          border-color: #e5e7eb;
        }
        .feature-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .feature-icon { font-size: 1.5rem; }
        .feature-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0a0f1e;
          margin-bottom: 0.625rem;
          letter-spacing: -0.01em;
        }
        .feature-desc { font-size: 0.9375rem; color: #6b7280; line-height: 1.65; }

        /* ── HOW IT WORKS ────────────────────────── */
        .how-section { background: #f9fafb; }
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          position: relative;
        }
        @media (max-width: 768px) {
          .steps-grid { grid-template-columns: 1fr; }
          .step-connector { display: none; }
        }
        .step { position: relative; }
        .step-number {
          font-size: 3rem;
          font-weight: 900;
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: 1rem;
          letter-spacing: -0.04em;
        }
        .step-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0a0f1e;
          margin-bottom: 0.5rem;
        }
        .step-desc { font-size: 0.9375rem; color: #6b7280; line-height: 1.65; }
        .step-connector {
          position: absolute;
          top: 1.75rem;
          right: -1rem;
          width: 2rem;
          height: 1px;
          background: linear-gradient(90deg, #3b6ef8, #7c3aed);
        }

        /* ── PRICING ─────────────────────────────── */
        .pricing-section { background: white; }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 740px;
        }
        .pricing-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 2.25rem;
          position: relative;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .pricing-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
        .pricing-featured {
          background: #0a0f1e;
          border: none;
          box-shadow: 0 0 0 1px transparent;
          background-clip: padding-box;
          position: relative;
        }
        .pricing-featured::before {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          border-radius: 21px;
          z-index: -1;
        }
        .popular-badge {
          display: inline-block;
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.3rem 0.75rem;
          border-radius: 999px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1.25rem;
        }
        .plan-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0a0f1e;
          margin-bottom: 0.375rem;
          letter-spacing: -0.02em;
        }
        .pricing-featured .plan-name { color: white; }
        .plan-price {
          font-size: 2.75rem;
          font-weight: 900;
          color: #0a0f1e;
          letter-spacing: -0.04em;
          margin-bottom: 0.5rem;
          line-height: 1;
        }
        .pricing-featured .plan-price { color: white; }
        .plan-price-gradient {
          background: linear-gradient(135deg, #3b6ef8, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .plan-period {
          font-size: 1rem;
          font-weight: 500;
          opacity: 0.6;
        }
        .plan-desc {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1.5rem;
        }
        .pricing-featured .plan-desc { color: #9ca3af; }
        .plan-features {
          list-style: none;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
        }
        .plan-features li {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          font-size: 0.9rem;
          color: #374151;
        }
        .pricing-featured .plan-features li { color: #d1d5db; }
        .check {
          width: 18px;
          height: 18px;
          background: #f0fdf4;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          color: #16a34a;
          flex-shrink: 0;
          font-weight: 800;
        }
        .check-blue {
          background: rgba(59,110,248,0.15);
          color: #3b6ef8;
        }
        .btn-plan-ghost {
          width: 100%;
          background: transparent;
          border: 1.5px solid #e5e7eb;
          color: #374151;
          padding: 0.75rem;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .btn-plan-ghost:hover { border-color: #9ca3af; background: white; }
        .btn-plan-primary {
          width: 100%;
          background: linear-gradient(135deg, #3b6ef8, #7c3aed);
          color: white;
          border: none;
          padding: 0.75rem;
          border-radius: 10px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          font-family: inherit;
          box-shadow: 0 0 20px rgba(59,110,248,0.4);
        }
        .btn-plan-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        /* ── FOOTER ──────────────────────────────── */
        .footer {
          background: #0a0f1e;
          padding: 2.5rem 2rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .footer-inner {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .footer-logo .logo-text { color: white; }
        .footer-copy { font-size: 0.8rem; color: #4b5563; }
      `}</style>
    </>
  );
}
