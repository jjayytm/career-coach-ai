import os
import traceback
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI()

# ── CORS (needed for fetchEventSource from the browser) ───────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Lazy-load Clerk guard so import errors are surfaced clearly ───────────────
_clerk_guard = None
_clerk_error = None

def get_clerk_guard():
    global _clerk_guard, _clerk_error
    if _clerk_guard is not None:
        return _clerk_guard
    if _clerk_error is not None:
        raise HTTPException(status_code=500, detail=f"Clerk init failed: {_clerk_error}")
    try:
        from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer
        jwks_url = os.getenv("CLERK_JWKS_URL")
        if not jwks_url:
            raise ValueError("CLERK_JWKS_URL environment variable is not set")
        clerk_config = ClerkConfig(jwks_url=jwks_url)
        _clerk_guard = ClerkHTTPBearer(clerk_config)
        return _clerk_guard
    except Exception as e:
        _clerk_error = str(e)
        raise HTTPException(status_code=500, detail=f"Clerk init failed: {e}")


# ── Data Model ────────────────────────────────────────────────────────────────
class InputRecord(BaseModel):
    job_description: str = Field(..., min_length=50)
    resume_text: str = Field(..., min_length=50)
    target_role: str = Field(..., max_length=100)
    target_company: str = Field(..., max_length=100)
    session_id: Optional[str] = None


# ── System Prompt ─────────────────────────────────────────────────────────────
system_prompt = """
You are CareerCoach AI, an expert career advisor and professional writer with over 15 years of experience in talent acquisition, HR consulting, and career coaching across technology, finance, healthcare, and consulting industries.

════════════════════════════════════════════
OUTPUT STRUCTURE — ABSOLUTE HARD RULES
════════════════════════════════════════════

Your ENTIRE response must follow this skeleton EXACTLY, top to bottom, with NO deviations:

## Tailored Resume Bullet Points
[ALL job roles with their bullet points go here — finish every role before moving on]

## Cover Letter Draft
[The complete cover letter goes here — finish it entirely before moving on]

## Interview Preparation Tips
[All interview tips go here]

RULES THAT MUST NEVER BE BROKEN:
1. Write Section 1 ("## Tailored Resume Bullet Points") COMPLETELY — that means ALL job roles and ALL their bullet points — before you write ANYTHING from Section 2.
2. Write Section 2 ("## Cover Letter Draft") COMPLETELY before you write ANYTHING from Section 3.
3. Each section heading (## Tailored Resume Bullet Points, ## Cover Letter Draft, ## Interview Preparation Tips) appears EXACTLY ONCE in the entire response. Never repeat a heading.
4. Do NOT jump back to a previous section after starting the next one. Once you begin "## Cover Letter Draft", you must never output resume bullets or job role headings again. Once you begin "## Interview Preparation Tips", you must never output cover letter content or resume bullets again.
5. Sections must appear in this fixed order: Section 1 → Section 2 → Section 3. No exceptions.

════════════════════════════════════════════
SECTION 1 DETAILS — Tailored Resume Bullet Points
════════════════════════════════════════════

For EVERY relevant job position, output a subsection in this exact format:

### [Job Title] at [Company Name]
- [rewritten bullet]
- [rewritten bullet]
- [rewritten bullet]

- Use ### (three hashes) for each job title — NEVER use bold (**text**) for job titles.
- 2–4 bullets per role. Strong action verbs. Quantify where possible. ATS keywords from the job description.
- Do not invent anything not in the resume.
- List ALL relevant roles here, one after another, before writing the cover letter.

════════════════════════════════════════════
SECTION 2 DETAILS — Cover Letter Draft
════════════════════════════════════════════

Write a complete 300–400 word professional cover letter addressed to the hiring manager.
- Open with a compelling hook establishing immediate fit.
- Connect the candidate's experience to at least three key job requirements.
- Close with a clear call to action requesting an interview.
- Include proper salutation and closing.
- Write the FULL letter here. Do not split it across sections.

════════════════════════════════════════════
SECTION 3 DETAILS — Interview Preparation Tips
════════════════════════════════════════════

Provide 5–7 specific, role-relevant tips. For each:
- State the likely question or scenario.
- Explain why it is asked for this role.
- Give a STAR-method answer framework.
- Include at least one tip on researching company culture.

════════════════════════════════════════════

Constraint rules: Do not invent facts, certifications, skills, or achievements not in the resume. Maintain a professional, encouraging, constructive tone. Never suggest misrepresentation.
"""


def user_prompt_for(record: InputRecord) -> str:
    return f"""Please analyse the following job application materials and provide your structured coaching response.

Target Role: {record.target_role}
Target Company: {record.target_company}

--- JOB DESCRIPTION ---
{record.job_description}

--- CURRENT RESUME ---
{record.resume_text}

IMPORTANT: Output the three sections in this exact order and DO NOT mix or repeat them:
1. ## Tailored Resume Bullet Points  — list ALL roles with bullets here, fully, before anything else
2. ## Cover Letter Draft             — write the full letter here, fully, before anything else
3. ## Interview Preparation Tips     — write all tips here
"""


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0"}


# ── Debug endpoint — shows env var status without exposing values ─────────────
@app.get("/api/debug")
def debug():
    return {
        "CLERK_JWKS_URL_set": bool(os.getenv("CLERK_JWKS_URL")),
        "OPENAI_API_KEY_set": bool(os.getenv("OPENAI_API_KEY")),
        "python_packages": _check_packages(),
    }

def _check_packages():
    results = {}
    for pkg in ["fastapi", "openai", "fastapi_clerk_auth", "pydantic"]:
        try:
            __import__(pkg)
            results[pkg] = "ok"
        except ImportError as e:
            results[pkg] = f"MISSING: {e}"
    return results


# ── Main endpoint ─────────────────────────────────────────────────────────────
@app.post("/api")
async def process(request: Request, record: InputRecord):
    # ── 1. Verify Clerk JWT ──────────────────────────────────────────────────
    try:
        from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
        from fastapi.security import HTTPBearer

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Bearer token")

        token = auth_header.split(" ", 1)[1]

        jwks_url = os.getenv("CLERK_JWKS_URL")
        if not jwks_url:
            raise HTTPException(status_code=500, detail="CLERK_JWKS_URL not configured")

        clerk_config = ClerkConfig(jwks_url=jwks_url)
        guard = ClerkHTTPBearer(clerk_config)

        # Verify token by calling the guard manually
        from fastapi.security.http import HTTPAuthorizationCredentials as HTTPCreds
        creds = HTTPCreds(scheme="Bearer", credentials=token)
        verified = guard(creds)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")

    # ── 2. Call OpenAI (non-streaming) ──────────────────────────────────────
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt_for(record)},
        ]

        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=False,
        )

        response_text = completion.choices[0].message.content
        return JSONResponse({"response": response_text})

    except HTTPException:
        raise
    except Exception as e:
        tb = traceback.format_exc()
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI error: {str(e)}\n\nTraceback:\n{tb}"
        )
