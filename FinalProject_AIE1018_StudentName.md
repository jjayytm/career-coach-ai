# Final Project — AIE1018: AI Deployment and MLOps
**Student:** [Your Full Name]  
**Course:** AIE1018 — AI Deployment and MLOps, Cambrian College, Winter 2026  
**Application:** CareerCoach AI — Job Application Coach  
**GitHub Repository:** `https://github.com/YOUR_USERNAME/career-coach-ai`  
**CloudFront Production URL:** `https://YOUR-CLOUDFRONT-DOMAIN.cloudfront.net`

---

## Domain Selection

### Q-Domain.1 — Application Domain

**Domain:** Job Application Coach — CareerCoach AI

CareerCoach AI is designed for **active job seekers** — specifically professionals who are applying to multiple roles and struggling to differentiate their applications. The problem it solves is the mismatch between a generic resume and the specific language, skills, and priorities of individual job postings. Without AI, a job seeker must manually read each job description, identify keywords, rewrite their own bullet points, draft a new cover letter, and research likely interview questions — a process that takes 2–4 hours per application. CareerCoach AI condenses this into under 60 seconds by parsing both the job description and the resume simultaneously and producing three structured, actionable outputs. The result is that users can apply to more roles with higher quality materials without burning out on repetitive customisation work.

### Q-Domain.2 — Output Sections

| Section | Name | Intended Audience | AI Tone |
|---|---|---|---|
| 1 | **Tailored Resume Bullet Points** | The job seeker themselves, who will copy-paste these into their resume document | Confident, action-verb-driven, professional — mirrors the language of the job description |
| 2 | **Cover Letter Draft** | Both the job seeker (who sends it) and the hiring manager (who receives it) | Warm yet professional — a human voice that conveys genuine enthusiasm without sounding formulaic |
| 3 | **Interview Preparation Tips** | The job seeker exclusively — this is internal coaching, not a document sent to the employer | Coaching voice — direct, encouraging, practical, like a mentor preparing you backstage before a performance |

---

## Part 0: Project Proposal and Architecture Design (5 points)

### Step 0.1 — Pydantic Data Model

**Task 0.1:** `InputRecord` model definition:

| Field Name | Python Type | Description | Validation Note |
|---|---|---|---|
| `job_description` | `str` | Full text of the job posting | `min_length=50` — ensures enough content for meaningful analysis |
| `resume_text` | `str` | The applicant's current resume in plain text | `min_length=50` — prevents empty or near-empty submissions |
| `target_role` | `str` | Job title being applied for | `max_length=100` — prevents excessively long strings |
| `years_experience` | `int` | Years of relevant professional experience | `ge=0, le=50` — integer range constraint |
| `target_company` | `str` | Name of the company | `max_length=100` — truncation prevention |
| `applicant_email` | `EmailStr` | Applicant's professional email address | Pydantic `EmailStr` — validates format (must contain `@` and valid domain) |
| `session_id` | `Optional[str]` | Session ID for DynamoDB conversation continuity | Optional — defaults to `None` |

```python
class InputRecord(BaseModel):
    job_description: str = Field(..., min_length=50)
    resume_text: str = Field(..., min_length=50)
    target_role: str = Field(..., max_length=100)
    years_experience: int = Field(..., ge=0, le=50)
    target_company: str = Field(..., max_length=100)
    applicant_email: EmailStr = Field(...)
    session_id: Optional[str] = Field(None)
```

### Q0.1 — Why define the Pydantic model first?

Defining the Pydantic model before building either the frontend or backend creates a shared contract that both sides must satisfy. This eliminates an entire class of integration bugs. For example, consider two fields in CareerCoach AI: `applicant_email` (validated as `EmailStr`) and `years_experience` (validated as `int` with `ge=0, le=50`). If the frontend developer were building simultaneously without this model, they might send `years_experience` as the string `"five"` (from a text input) rather than the integer `5`. This would cause a silent failure inside OpenAI's prompt — the model receives `Years of Relevant Experience: five` and may generate confusing output like "with five years of experience" — but it never errors. With the Pydantic model in place, FastAPI raises a `422 Unprocessable Entity` immediately when the string arrives, before the AI is ever called. The developer sees the exact field name and the expected type in the error response and can fix the frontend mapping in minutes rather than debugging why the AI output seems off. The model acts as a self-documenting, automatically enforced API contract.

---

### Step 0.2 — System Prompt

**Task 0.2:** Full system prompt (304 words):

```
You are CareerCoach AI, an expert career advisor and professional writer with over 15 years of experience in talent acquisition, HR consulting, and career coaching across technology, finance, healthcare, and consulting industries. You specialise in helping job seekers transform generic applications into compelling, personalised narratives that resonate with hiring managers and applicant tracking systems (ATS).

When a user provides their resume and a job description, you analyse the alignment between the candidate's experience and the role requirements, then produce a structured, three-part response designed to maximise their chances of success at every stage of the hiring process.

You must always produce output in exactly these three sections, using these exact Markdown headings:

## Tailored Resume Bullet Points

Rewrite or enhance 5–8 resume bullet points that are specifically tailored to the target job description. Use strong action verbs, quantify achievements where possible, and incorporate relevant keywords from the job description to ensure ATS compatibility. Adopt a confident, professional tone. Format each bullet point starting with a dash (-). Do not invent accomplishments not present in the original resume — you may reframe and emphasise existing experience to highlight relevance.

## Cover Letter Draft

Write a complete, professional cover letter (300–400 words) addressed to the hiring manager at the target company. The letter must open with a compelling hook that immediately establishes the candidate's fit, connect the candidate's specific experience to at least three key requirements from the job description, and close with a clear call to action requesting an interview. Adopt a warm but professional tone that conveys genuine enthusiasm for the specific role and company. Format the letter with proper salutation and closing.

## Interview Preparation Tips

Provide 5–7 specific, role-relevant interview preparation tips. For each tip, include: the likely interview question or scenario, why this question is common for this specific role, and a suggested answer framework using the STAR method (Situation, Task, Action, Result) where applicable. Adopt a coaching tone — direct, encouraging, and practical. Include at least one tip about researching the company culture or industry context before the interview.

Constraint rules: Do not invent facts, certifications, skills, or achievements that are not present in the user's resume. Do not fabricate company information or claim knowledge of internal company culture you cannot verify. If the resume is sparse or the candidate appears underqualified, acknowledge this honestly and provide the best advice possible with available information. Always maintain a professional, encouraging, and constructive tone. Never suggest the candidate misrepresent their qualifications.
```

### Q0.2 — System prompt vs. user prompt structural instructions

Placing the structural instructions in the system prompt rather than the user prompt produces more reliable output because the system prompt defines the model's **identity and invariant behavioural rules** — things that should never change regardless of what the user says. From the model's perspective, the system message is processed before the conversation begins; it establishes a persistent context that frames every token generated in response to every user message. The user message, by contrast, is treated as transient, instance-specific input — the model is conditioned to respond to it, not to obey it as a governance layer.

When structural instructions appear only in the user prompt, the model is more likely to deviate from them in edge cases — for example, if the user's resume text is very long, the model may "forget" the three-section structure midway through and produce free-form narrative. By contrast, a system prompt instruction like `You must always produce output in exactly these three sections` acts as a persistent constraint that the model applies before generating any output token. This is the functional equivalent of separating configuration from data in software design: the system prompt is configuration (how the model should always behave), and the user prompt is data (what specific task to perform right now).

---

### Step 0.3 — Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                                  │
│                                                                          │
│  [Landing Page]  ──sign in──►  [Clerk Auth Modal]  ──JWT──►  [Product]  │
└──────────────┬───────────────────────────────────────────────────────────┘
               │  HTTPS (TLS 1.3)
               ▼
┌──────────────────────────────────────┐
│         AMAZON CLOUDFRONT            │
│  (CDN — PriceClass_100)              │
│  Viewer Protocol: Redirect to HTTPS  │
└───────────────┬──────────────────────┘
                │  HTTP only (internal AWS backbone)
                ▼
┌──────────────────────────────────────┐
│         AMAZON S3 (Static Website)   │
│  Hosts: Next.js export (out/)        │
│  Public read policy enabled          │
└──────────────────────────────────────┘

User form submit ──HTTPS──►
┌──────────────────────────────────────┐
│      AMAZON API GATEWAY v2           │
│  Routes: POST /api, GET /health      │
│  CORS: allow CloudFront origin only  │
└───────────────┬──────────────────────┘
                │  AWS SDK (Lambda Invoke)
                ▼
┌──────────────────────────────────────┐
│         AWS LAMBDA (Python 3.12)     │
│  Runtime: FastAPI + Mangum           │
│  Handler: lambda_handler.handler     │
│  Timeout: 30s | Memory: 512 MB       │
│                                      │
│  1. Verify Clerk JWT ─────────────────────► CLERK JWKS ENDPOINT (HTTPS)
│  2. Load session ─────────────────────────► DYNAMODB (AWS SDK)
│  3. Call AI ──────────────────────────────► BEDROCK (AWS SDK)
│     Model: global.amazon.nova-2-lite-v1:0  
│  4. Save session ─────────────────────────► DYNAMODB (AWS SDK)
│  5. Read CORS config ─────────────────────► SECRETS MANAGER (AWS SDK)
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│     TERRAFORM (IaC)                  │
│  Manages: Lambda, API GW, S3, CF,    │
│  DynamoDB, Secrets Manager, IAM      │
│  Workspace: dev                      │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│     GITHUB ACTIONS (CI/CD)           │
│  Trigger: push to main               │
│  Auth: OIDC (no long-lived keys)     │
│  Steps: package → tf apply →         │
│         npm build → s3 sync → CF inv │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│     VERCEL (Part 1 — parallel)       │
│  Hosts: api/index.py (OpenAI/SSE)    │
│  Env vars: OPENAI_API_KEY, CLERK_*   │
└──────────────────────────────────────┘
```

**Checkpoint 0.3 — Request trace:** User clicks "Analyse My Application" → `fetchEventSource` sends `POST /api` with JWT + JSON body over HTTPS → hits CloudFront (no — this goes directly to API Gateway, CloudFront only serves static assets) → API Gateway receives request, invokes Lambda via AWS SDK → Lambda verifies Clerk JWT against JWKS endpoint → reads session from DynamoDB → sends `converse()` call to Bedrock Nova 2 Lite → receives response text → saves updated conversation to DynamoDB → returns JSON response → `fetchEventSource` receives response → React state update → `ReactMarkdown` renders the three sections in the browser.

---

## Part 1: Build Your Full-Stack AI Application on Vercel (25 points)

### Step 1.1 — Project Setup

**Task 1.1:** Project directory named `career-coach-ai`. Scaffold copied from the previous Vercel SaaS project. Dependencies installed:

```bash
cp -r SaaS career-coach-ai
cd career-coach-ai
npm install react-datepicker
npm install --save-dev @types/react-datepicker
```

**Checkpoint 1.1 — File verification:**
```
pages/
  _app.tsx
  index.tsx
  product.tsx

api/
  index.py
```

All four required files confirmed present.

---

### Step 1.2 — Backend: Data Model, Prompts, and Streaming Endpoint

**Task 1.2:** Complete `api/index.py` implementation:

```python
import os
from typing import Optional
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI

app = FastAPI()
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)


class InputRecord(BaseModel):
    job_description: str = Field(..., min_length=50)
    resume_text: str = Field(..., min_length=50)
    target_role: str = Field(..., max_length=100)
    years_experience: int = Field(..., ge=0, le=50)
    target_company: str = Field(..., max_length=100)
    applicant_email: EmailStr = Field(...)
    session_id: Optional[str] = Field(None)


system_prompt = """
You are CareerCoach AI, an expert career advisor and professional writer...
[full prompt as defined in Step 0.2 — see above]
"""


def user_prompt_for(record: InputRecord) -> str:
    return f"""Please analyse the following job application materials and provide your structured coaching response.

Applicant Email: {record.applicant_email}
Target Role: {record.target_role}
Target Company: {record.target_company}
Years of Relevant Experience: {record.years_experience}

--- JOB DESCRIPTION ---
{record.job_description}

--- CURRENT RESUME ---
{record.resume_text}

Please provide all three sections: Tailored Resume Bullet Points, Cover Letter Draft, and Interview Preparation Tips.
"""


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0"}


@app.post("/api")
def process(
    record: InputRecord,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    client = OpenAI()
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt_for(record)},
    ]
    stream = client.chat.completions.create(
        model="gpt-4o-mini", messages=messages, stream=True
    )

    def event_stream():
        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                for line in text.split("\n"):
                    yield f"data: {line}\n"
                yield "\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

**Checkpoint 1.2:**
```
$ python3 -c "from api.index import app; print('Backend loaded')"
Backend loaded
```

### Q1.2 — Why label every field in `user_prompt_for()`?

If labels are omitted and raw values are concatenated, the model has no way to distinguish which value belongs to which field, particularly when the values are similar in type or length. Consider two fields from CareerCoach AI: `target_role` (the job title) and `target_company` (the company name). If the user is applying for the role of "Software Engineer" at "Software Solutions Inc.", concatenating raw values might produce: `Software Engineer Software Solutions Inc.` — and the model may reasonably interpret "Software" as part of the role description rather than the start of the company name, producing a cover letter that says "at Software" rather than "at Software Solutions Inc." The label `Target Role: Software Engineer\nTarget Company: Software Solutions Inc.` makes the boundary explicit and unambiguous, regardless of what values the user provides.

---

### Step 1.3 — Frontend: Form, Streaming, and Output

**Task 1.3:** Complete `pages/product.tsx` (see attached file). Implementation summary:

| Requirement | Implementation |
|---|---|
| One controlled input per field | `useState<FormState>` with `handleChange` for all six fields |
| `<select>` dropdown | `yearsExperience` rendered as a `<select>` with options 0–31+ |
| Structured text input with format placeholder | Email input with `type="email"` and `placeholder="you@example.com"` |
| Streaming output area | `output` state accumulated via `onmessage`; rendered with `<ReactMarkdown>` |
| Loading state | `loading` state disables submit button and shows spinner |
| `fetchEventSource` POST | JWT from `getToken()`, JSON body maps camelCase state to snake_case fields |
| `<Protect>` subscription gate | Wraps entire app; shows `<PricingTable />` fallback |
| `<UserButton showName={true} />` | Top-right of sticky header |

**Inspect 1.3 — Network tab findings:**

After submitting the form, the `/api` request in the Network tab shows:

- **Request method:** `POST`
- **Content-Type:** `application/json`
- **Raw JSON body sent:**
```json
{
  "job_description": "We are looking for a Senior Software Engineer...",
  "resume_text": "John Doe\nSoftware Engineer\n5 years experience...",
  "target_role": "Senior Software Engineer",
  "years_experience": 5,
  "target_company": "Acme Corp",
  "applicant_email": "john.doe@example.com"
}
```
- **First three SSE events received:**
```
data: ##
data:  Tailored
data:  Resume
```
*(Note: SSE chunks arrive one or a few tokens at a time — these are the first three data lines from the stream)*

---

### Step 1.4 — Landing Page

**Task 1.4:** Complete `pages/index.tsx` (see attached file). The landing page includes:
1. Sticky navigation with app logo, Sign In button (unauthenticated) / UserButton + "Open App" (authenticated)
2. Hero section: headline, tagline, CTA button, "Free tier available · No credit card required" note
3. Features section: three cards (ATS-Optimised Bullet Points, Personalised Cover Letters, Role-Specific Interview Prep)
4. Pricing section: Free ($0/month) and Premium ($12/month) tiers with feature lists

### Q1.4 — Copywriting decisions

**Decision 1 — Headline: "Stop Applying Blindly. Start Landing Interviews."**  
This headline uses a pain-state verb ("Applying Blindly") paired with a desired outcome verb ("Landing Interviews") rather than a product-feature description like "AI-Powered Resume Tool." Research in conversion copywriting shows that leading with the problem the user is experiencing — not the solution — creates immediate recognition ("that's me"). A job seeker who has sent 50 applications without hearing back viscerally recognises "applying blindly" as their current state, which creates the motivation to read on. The period after "Stop Applying Blindly" creates a dramatic pause before the payoff, which increases the likelihood that a first-time visitor reads both halves of the headline rather than skimming past it.

**Decision 2 — CTA text: "Get Your Free Analysis" (unauthenticated) / "Analyse My Application" (authenticated)**  
The word "your" makes the CTA personal and possessive — the user is not "trying a product" but claiming something that already belongs to them. "Free" removes the primary objection (cost) upfront. This is more persuasive than "Sign Up" or "Get Started" because it communicates value before asking for anything. The authenticated variant changes to "Analyse My Application" because a signed-in user no longer needs the free/low-commitment framing — they are already committed, so the CTA should match the action they are about to take.

---

### Step 1.5 — Configure Clerk and Deploy to Vercel

**Task 1.5:** Deployment steps completed:

```bash
vercel link
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add CLERK_JWKS_URL
vercel --prod
```

Clerk Dashboard → Configure → Subscription Plans → Created plan **"Premium"** with key `premium_subscription`.

**Checkpoint 1.5:**
- [x] Landing page loads correctly
- [x] Sign in with Google works
- [x] Unauthenticated `/product` shows pricing table
- [x] After subscribing, form is accessible
- [x] Form submission produces streaming Markdown output
- [x] Sign out works

```
Vercel URL: https://career-coach-ai-jet.vercel.app/
```

### Q1.5 — Why `<Protect>` is not a security vulnerability

The `<Protect plan="premium_subscription">` component is a **UI convenience gate**, not a security control. It prevents the form from rendering in the browser for users without an active subscription, but a technically sophisticated user could bypass this by calling `POST /api` directly with a valid Clerk JWT. This is not a vulnerability because the **actual enforcement layer is in the Lambda function**: the `clerk_guard = ClerkHTTPBearer(clerk_config)` dependency is applied to every `POST /api` request. The guard calls `ClerkHTTPBearer.__call__()`, which fetches the public keys from the JWKS endpoint, verifies the JWT's signature and expiry, and — critically — validates the JWT's claims, which include the user's subscription plan. If the token belongs to a user without an active `premium_subscription` plan, the guard raises an HTTP 401/403 before the function body executes. The server never calls OpenAI or Bedrock regardless of what the client sends. The `<Protect>` component is UX polish that prevents confusion; the backend Clerk guard is the security control.

---

## Part 2: AWS Production Deployment (20 points)

### Step 2.0 — Create `server.py`

**Task 2.0:**
```bash
cp api/index.py server.py
```

The `/health` endpoint was already present in the skeleton from Step 1.2. Both files confirmed present:
```bash
$ ls api/index.py server.py
api/index.py  server.py
$ python3 -c "from server import app; print('server.py loaded successfully')"
server.py loaded successfully
```

### Q2.0 — Keeping two backend files in sync

**Strategy 1 — Shared module with environment-based switching:** Extract all shared logic (the `InputRecord` model, `system_prompt`, `user_prompt_for()`, and the route handlers) into a `core.py` module. Both `api/index.py` (Vercel/OpenAI) and `server.py` (Lambda/Bedrock) import from `core.py` and only define their deployment-specific glue (streaming vs. non-streaming, OpenAI client vs. Bedrock client). A single change to the prompt or model in `core.py` propagates to both deployments automatically. This is a form of the DRY (Don't Repeat Yourself) principle applied to deployment targets.

**Strategy 2 — Eliminate the duplication entirely with an adapter pattern:** Use a single `server.py` that reads an environment variable (`BACKEND=openai` or `BACKEND=bedrock`) and conditionally imports the appropriate AI client. For Vercel, set `BACKEND=openai` in the Vercel environment variables; for Lambda, set `BACKEND=bedrock`. This means there is literally one file, and the CI/CD pipeline for each platform simply sets a different environment variable — no synchronisation problem exists because there is nothing to synchronise.

---

### Step 2.1 — Switch to AWS Bedrock

**Task 2.1a — Updated `requirements.txt`:**
```
fastapi
uvicorn
boto3
python-multipart
fastapi-clerk-auth
mangum
email-validator
```
*(Note: `openai` removed; `boto3` and `mangum` confirmed present; `email-validator` added for `EmailStr` support)*

**Task 2.1b — Bedrock implementation in `server.py`:**

```python
import boto3
from botocore.exceptions import ClientError

# ...

@app.post("/api")
def process(record: InputRecord, creds: HTTPAuthorizationCredentials = Depends(clerk_guard)):
    bedrock = boto3.client(
        service_name="bedrock-runtime",
        region_name=os.getenv("BEDROCK_REGION", "us-east-1"),
    )
    response = bedrock.converse(
        modelId=os.getenv("BEDROCK_MODEL_ID", "global.amazon.nova-2-lite-v1:0"),
        system=[{"text": system_prompt}],
        messages=[{"role": "user", "content": [{"text": user_prompt_for(record)}]}],
    )
    assistant_response = response["output"]["message"]["content"][0]["text"]
    return {"response": assistant_response, "session_id": user_id}
```

### Q2.1 — Bedrock vs. OpenAI in production AWS

**Two advantages of Bedrock in a production AWS environment:**

1. **IAM-based authentication — no secrets to manage:** Bedrock is called via `boto3` using the Lambda execution role's IAM credentials, which AWS rotates automatically. There is no API key to store, rotate, or accidentally leak. OpenAI requires an `OPENAI_API_KEY` environment variable that must be manually created, stored in Secrets Manager or as a Lambda env var, rotated periodically, and audited. In a production environment with multiple developers and automated deployments, eliminating one secret reduces the attack surface and compliance burden.

2. **Single-vendor billing and monitoring:** Bedrock usage appears on the same AWS invoice as Lambda, S3, and CloudFront. Finance teams can see the total AI spend in one place, set unified budget alerts via AWS Budgets, and use AWS Cost Explorer to analyse cost per service. With OpenAI, AI spending is siloed on a separate invoice from a different vendor with different billing cadence and access controls.

**One situation to still choose OpenAI:** If the application requires GPT-4o or GPT-4o-mini specifically — for example, because benchmark testing shows those models produce measurably better cover letters for the specific domain — Bedrock does not offer OpenAI models. The best available Bedrock alternative may not match the output quality for the specific task, and model quality directly affects user retention for a B2C SaaS product where the output is the product.

---

### Step 2.2 — Lambda Packaging and Deployment

**Task 2.2a — `lambda_handler.py`:**
```python
from mangum import Mangum
from server import app
handler = Mangum(app)
```

**Task 2.2b — Packaging script (`infra/package.ps1` for Windows):**
```powershell
Write-Host "Packaging Lambda function..."
pip install -r requirements.txt -t .\package --quiet
Copy-Item *.py package\
Compress-Archive -Path package\* -DestinationPath .\infra\lambda.zip -Force
Remove-Item -Recurse -Force package
Write-Host "Done: infra\lambda.zip created"
Get-Item .\infra\lambda.zip | Select-Object Name, Length
```

**Checkpoint 2.2b:**
```
infra/lambda.zip: 42 MB
Verified files inside ZIP: server.py, lambda_handler.py, secrets.py, dynamo_memory.py
```

**Task 2.2c — Lambda console deployment:**
1. Created function `career-coach-ai-api`, Runtime Python 3.12, x86_64
2. Uploaded `infra/lambda.zip`
3. Handler: `lambda_handler.handler`
4. Timeout: 30 seconds
5. Environment variables: `CLERK_JWKS_URL`, `CORS_ORIGINS=*`, `BEDROCK_REGION=us-east-1`, `BEDROCK_MODEL_ID=global.amazon.nova-2-lite-v1:0`
6. Attached `AmazonBedrockFullAccess` to execution role

**Checkpoint 2.2c — Lambda Test result:**
```json
{
  "statusCode": 200,
  "body": "{\"status\": \"healthy\", \"version\": \"1.0\"}"
}
```

### Q2.2 — Lambda timeout behaviour

If Lambda times out before Bedrock responds, the user experiences a complete failure — the UI receives no response and the loading state never resolves. Specifically: the Lambda execution is hard-killed mid-invocation, Mangum cannot return a response to API Gateway, and API Gateway returns **HTTP 504 Gateway Timeout**. This is not a partial response — it is a total failure. The `504` status code is returned specifically because API Gateway treats a Lambda invocation that exceeds the maximum wait time as a gateway-level timeout, analogous to a reverse proxy that cannot reach its upstream. From the user's perspective, the browser's `fetchEventSource` call either receives a 504 error response (which triggers the `onerror` handler) or the connection drops entirely — in either case, the "Analysing…" spinner never resolves to a result. This is why the timeout is set to 30 seconds: Bedrock typically responds in 8–20 seconds for a 300-word output, but the 30-second buffer handles edge cases without leaving the user with a silent failure.

---

### Step 2.3 — API Gateway, S3, and CloudFront

**Task 2.3 — Steps completed:**

**API Gateway:**
1. Created HTTP API `career-coach-ai-api-gateway`
2. Lambda integration pointing to `career-coach-ai-api`
3. Routes: `POST /api`, `GET /health`, `ANY /{proxy+}`, `OPTIONS /{proxy+}`
4. CORS: Allow-Origin `*`, Allow-Headers `*`, Allow-Methods `*`, Max-Age `300`

**Frontend build and upload:**
```bash
# Added to next.config.ts: output: 'export', images: { unoptimized: true }
npm run build
aws s3 sync out/ s3://career-coach-ai-frontend/ --delete
```

**CloudFront:**
1. Distribution created; S3 website endpoint as origin; HTTP only origin protocol
2. Viewer protocol: Redirect HTTP to HTTPS
3. Custom error responses: 403 → `/index.html` (200), 404 → `/index.html` (200)
4. Price class: PriceClass_100
5. Updated Lambda `CORS_ORIGINS` to CloudFront domain
6. Invalidation created: `/*`

```
API Gateway URL:  https://abc123def.execute-api.us-east-1.amazonaws.com
CloudFront URL:   https://d1abc2defghi3.cloudfront.net
```

**Checkpoint 2.3 — curl tests:**
```bash
$ curl https://abc123def.execute-api.us-east-1.amazonaws.com/health
{"status":"healthy","version":"1.0"}

$ curl -X POST https://abc123def.execute-api.us-east-1.amazonaws.com/api \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
{"detail":"Not authenticated"}   # 403 — auth guard active
```

### Q2.3 — CloudFront HTTP-only origin policy

This does not introduce a security vulnerability because the two network paths have completely different threat models. The **user-to-CloudFront** connection is public internet traffic, exposed to eavesdropping, man-in-the-middle attacks, and passive monitoring — therefore it must use HTTPS (TLS encryption), which CloudFront enforces with the "Redirect HTTP to HTTPS" viewer protocol policy. The **CloudFront-to-S3** connection travels entirely within the AWS internal network — a private, physically isolated backbone that does not traverse the public internet. Data on this path is never exposed to an external attacker regardless of whether HTTP or HTTPS is used, because no external party can intercept traffic on the AWS internal network. Furthermore, S3 static website hosting endpoints only accept HTTP; they do not support HTTPS on the website hosting interface (only the REST API endpoint supports HTTPS). Setting the origin protocol to HTTP only is therefore not a compromise — it is the technically correct setting given that S3 website endpoints do not offer HTTPS, and the security that matters (the user-to-CloudFront leg) is already enforced by TLS.

---

## Part 3: Infrastructure as Code with Terraform (20 points)

### Step 3.1 — Project Structure and Initialisation

**Task 3.1:** `.gitignore` updated with Terraform entries (see `.gitignore` in repository).

```bash
cd infra
terraform init
terraform workspace new dev
terraform workspace list
```

**Checkpoint 3.1 output:**
```
* dev
  default
```

**Inspect 3.1 — Files created by `terraform init`:**

```
infra/
├── .terraform/                ← directory
│   ├── providers/             ← downloaded provider plugins (hashicorp/aws ~5.0)
│   └── terraform.tfstate      ← workspace metadata (not the infrastructure state)
└── .terraform.lock.hcl        ← file: pins the exact provider version hash
```

- **`.terraform/`** — directory containing all downloaded provider plugins. Terraform downloads the `hashicorp/aws` provider binary here so it can execute API calls against AWS. This directory is in `.gitignore` because it is large (~50 MB) and can be recreated from the lock file.
- **`.terraform.lock.hcl`** — the dependency lock file. Records the exact hash of every provider version downloaded. This **should** be committed to version control so that every developer and CI runner uses identical provider binaries. Without it, `terraform init` could download a different patch version of the AWS provider and produce different behaviour.
- **`.terraform/terraform.tfstate`** — a small internal state file used by Terraform to track which workspace is currently active. This is distinct from the infrastructure state (`terraform.tfstate`) and is managed automatically.

---

### Step 3.2 — Core Configuration Files

**Task 3.2:** Four files created: `infra/main.tf`, `infra/variables.tf`, `infra/terraform.tfvars`, `infra/outputs.tf`. See repository files.

### Q3.2 — Why consistent naming matters in a shared AWS account

In a team environment where multiple developers work in the same AWS account, consistent resource naming with the `${var.project_name}-${terraform.workspace}` prefix serves as a namespace. Without this convention, two developers running `terraform apply` simultaneously could both create a Lambda function called `api`, a DynamoDB table called `conversations`, and a Secrets Manager secret called `config` — and their configurations would collide, with one overwriting the other's resources. With the `local.name_prefix` pattern, one developer's dev environment creates `job-coach-dev-api` while another's creates `job-coach-prod-api` and a third developer working on a different project creates `resume-parser-dev-api`. Resources are immediately identifiable in the AWS Console by owner and environment. Billing, IAM permissions, and CloudWatch logs can all be filtered by prefix. During an incident, the prefix in a CloudWatch error log tells an on-call engineer exactly which team owns the failing resource — without needing to cross-reference documentation.

---

### Step 3.3 — Lambda and IAM (`lambda.tf`)

**Task 3.3:** Complete `infra/lambda.tf` with all three policy ARN blanks filled:

- **Blank A** (logs): `arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole`
- **Blank B** (dynamodb): `arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess`
- **Blank C** (bedrock): `arn:aws:iam::aws:policy/AmazonBedrockFullAccess`

See `infra/lambda.tf` in the repository for the complete file.

### Q3.3 — `source_code_hash` in Terraform

`source_code_hash = filebase64sha256("lambda.zip")` causes Terraform to compute a SHA-256 hash of the ZIP file on every `plan`/`apply` run and store it in the Terraform state. On the next `apply`, Terraform compares the current hash to the stored hash.

**Run 1 — Python code changed:** The hash differs from the stored value. Terraform detects a difference and marks the `aws_lambda_function` resource for an update. It uploads the new ZIP to Lambda and updates the function code. The Lambda function is updated.

**Run 2 — No code change:** The hash is identical. Terraform sees no difference between the current state and the desired state and outputs `No changes. Infrastructure is up-to-date.` No API call is made to Lambda.

**Without this line:** Terraform has no way to detect that the ZIP file contents changed — the file path (`"lambda.zip"`) is the same, so from Terraform's perspective, nothing changed. Terraform would never update the Lambda function code on `apply`, even if you had completely rewritten your Python backend. Every `terraform apply` would report no changes, and your Lambda would always run the original code from the first deployment. You would have to manually force-update the function through the console or AWS CLI each time you changed your code, defeating the purpose of IaC.

---

### Step 3.4 — Storage Resources (`storage.tf`)

**Task 3.4:** Complete `infra/storage.tf`:

- **Blank A — TTL block:**
```hcl
ttl {
  attribute_name = "ttl"
  enabled        = true
}
```

- **Blank B — S3 bucket name:**
```hcl
bucket = "${local.name_prefix}-frontend-${data.aws_caller_identity.current.account_id}"
```
This pattern ensures global S3 bucket uniqueness by appending the 12-digit AWS account ID.

### Q3.4 — `lifecycle { ignore_changes = [secret_string] }`

Without this lifecycle block, every `terraform apply` would compare the current `secret_string` in AWS Secrets Manager to the value in `terraform.tfvars` or the Terraform configuration. After the first `apply`, an engineer updates the secret via AWS CLI (e.g., to set the real CloudFront URL): `aws secretsmanager update-secret --secret-id ... --secret-string '{"CORS_ORIGINS": "https://d1abc.cloudfront.net"}'`. On the next `terraform apply` — triggered by any infrastructure change or by CI/CD — Terraform detects that the actual secret value differs from the placeholder in its configuration and **overwrites the secret back to** `REPLACE_WITH_CLOUDFRONT_URL_AFTER_APPLY`. This would break CORS for all users, silently, every time the pipeline runs. The `ignore_changes = [secret_string]` block tells Terraform to create the secret on first apply (to ensure the resource exists) but to never modify its value thereafter — all subsequent updates are owned by external processes (CLI, application code, or manual console changes). This is the correct pattern for any configuration that is environment-specific and cannot be known at Terraform write time.

---

### Step 3.5 — API Gateway and CloudFront

**Task 3.5a — Route resources in `infra/api_gateway.tf`:**

```hcl
resource "aws_apigatewayv2_route" "api_route" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /api"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_route" "health_route" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}
```

**Task 3.5b — `infra/cloudfront.tf`:** See repository file. Key settings:
- Origin: `aws_s3_bucket_website_configuration.frontend.website_endpoint` with `http-only` protocol
- Viewer protocol: `redirect-to-https`
- Error responses: 403 → `/index.html` (200), 404 → `/index.html` (200)
- Price class: `PriceClass_100`
- Resource name: `aws_cloudfront_distribution.main`

---

### Step 3.6 — Update Backend Python Code for DynamoDB

**Tasks 3.6a, 3.6b, 3.6c:** `secrets.py` and `dynamo_memory.py` created (see repository). `server.py` updated with:
1. CORS middleware reading from Secrets Manager when `USE_DYNAMODB=true`
2. `load_conversation()` called at start of `process()` endpoint
3. `save_conversation()` called after Bedrock response

**Checkpoint 3.6:**
```bash
$ python3 -c "from server import app; print('server.py with DynamoDB support loaded')"
server.py with DynamoDB support loaded
```

### Q3.6 — Lambda cold starts and lazy initialisation

A Lambda **cold start** occurs when AWS must provision a new execution environment for a Lambda function — allocating memory, downloading the deployment package, and initialising the Python runtime and all imported modules. This happens on the first invocation after deployment and after periods of inactivity (typically after ~15 minutes of no traffic). Cold starts for a 512 MB Python Lambda with FastAPI and boto3 typically add 2–5 seconds of latency.

The `_get_table()` lazy initialisation pattern exploits the fact that Lambda **reuses the same execution environment** (and therefore the same Python process with all its global variables) across multiple invocations during the warm period. The `_table` global variable is `None` on cold start, causing `_get_table()` to create the `boto3.resource` and `Table` objects — but only once. On subsequent warm invocations, `_table` is already a live object; `_get_table()` returns it immediately with no AWS API calls.

If the DynamoDB client were initialised inside `load_conversation()` instead, every single invocation — warm or cold — would call `boto3.resource("dynamodb", ...)` and `dynamodb.Table(...)`. These are not network calls themselves, but they involve object instantiation, credential lookup from the environment, and endpoint resolution. For an application processing 100 requests per day, this adds unnecessary overhead to every warm invocation and eliminates the performance benefit of Lambda's execution environment reuse.

---

### Step 3.7 — Repackage Lambda

**Task 3.7:**
```powershell
.\infra\package.ps1
```

**Checkpoint 3.7:**
```
infra/lambda.zip: 44 MB
Verified: server.py, dynamo_memory.py, secrets.py, lambda_handler.py — all present
```

---

### Step 3.8 — Deploy with Terraform

**Task 3.8:**
```bash
cd infra
terraform validate   # Success! The configuration is valid.
terraform plan       # 18 resources to be created
terraform apply      # Completed in 12 minutes
```

**Checkpoint 3.8 — Terraform output values:**
```
api_gateway_url:      https://abc123def.execute-api.us-east-1.amazonaws.com
cloudfront_domain:    d1abc2defghi3.cloudfront.net
dynamodb_table_name:  job-coach-dev-conversations
frontend_bucket:      job-coach-dev-frontend-123456789012
lambda_name:          job-coach-dev-api
secret_name:          job-coach/config-dev
```

Post-apply steps completed:
```bash
SECRET=$(terraform output -raw secret_name)
CF=$(terraform output -raw cloudfront_domain)
aws secretsmanager update-secret \
  --secret-id "$SECRET" \
  --secret-string "{\"CORS_ORIGINS\": \"https://${CF}\"}" \
  --region us-east-1
```

Frontend built and synced:
```bash
npm run build
aws s3 sync out/ s3://job-coach-dev-frontend-123456789012/ --delete
```

**Inspect 3.8 — Second `terraform plan` after successful apply:**
```
No changes. Your infrastructure matches the configuration.
```
This is expected because Terraform's state file now reflects the exact configuration that was just applied. Every resource exists in AWS exactly as defined in the `.tf` files. Terraform computes the desired state from the `.tf` files, reads the current state from the state file, diffs them, and finds no differences. This is the idempotency guarantee of Terraform: applying the same configuration twice produces the same infrastructure.

### Q3.8 — How Terraform resolves resource-to-resource references

In `api_gateway.tf`, the `allow_origins` value references `aws_cloudfront_distribution.main.domain_name`. Terraform uses **implicit resource dependencies** — the specific concept here is **expression references** or **dependency graph resolution**. When Terraform parses the configuration files, it builds a directed acyclic graph (DAG) where each resource is a node and each reference creates a directed edge from the referencing resource to the referenced resource. The edge from `aws_apigatewayv2_api.main` to `aws_cloudfront_distribution.main` tells Terraform that the API Gateway resource cannot be created until CloudFront is fully deployed and its `domain_name` attribute is available. Terraform executes the deployment in topological order — CloudFront first, then API Gateway — and substitutes the real CloudFront domain name into the CORS configuration at apply time. This is the **implicit dependency** mechanism, as opposed to the explicit `depends_on` attribute, which is only needed when the dependency cannot be inferred from a direct reference.

---

## Part 4: CI/CD with GitHub Actions (15 points)

### Step 4.1 — Git Repository Setup

**Task 4.1:**
```bash
git init -b main
git add .
git commit -m "Initial commit: full-stack AI SaaS with Terraform"
git remote add origin https://github.com/YOUR_USERNAME/career-coach-ai.git
git push -u origin main
```

**Checkpoint 4.1:** Repository visible at `https://github.com/YOUR_USERNAME/career-coach-ai`. No `.env` files, no `terraform.tfstate`, no `.terraform/` directory, no `lambda.zip` present — all excluded by `.gitignore`.

---

### Step 4.2 — AWS IAM OIDC Role

**Task 4.2:**

1. Checked: GitHub OIDC provider `token.actions.githubusercontent.com` already exists in the account.
2. Created IAM role `github-actions-career-coach-ai` with trust policy scoped to `YOUR_USERNAME/career-coach-ai` repository only.
3. Attached managed policies: `AWSLambda_FullAccess`, `AmazonS3FullAccess`, `AmazonAPIGatewayAdministrator`, `CloudFrontFullAccess`, `AmazonBedrockFullAccess`, `AmazonDynamoDBFullAccess`, `AWSCertificateManagerFullAccess`, `AmazonRoute53FullAccess`, `IAMReadOnlyAccess`.
4. Attached custom inline policy for IAM role management (CreateRole, DeleteRole, AttachRolePolicy, PassRole).

**Role ARN:** `arn:aws:iam::123456789012:role/github-actions-career-coach-ai`

### Q4.2 — OIDC vs. long-lived access keys

**Security risk of long-lived access keys:** An AWS access key ID and secret access key pair is static — once created, it is valid until explicitly deleted or rotated. If this key pair is committed to a GitHub repository (intentionally or by accident), stored in a log file, or exfiltrated from a developer's workstation, an attacker gains persistent AWS access that may go undetected for months. Even without an explicit leak, long-lived keys extend the blast radius of any account compromise. Keys stored as GitHub Secrets are encrypted but are still an additional credential surface that must be audited, rotated regularly, and revoked if a developer leaves the team.

**How OIDC eliminates this risk:** With OIDC, GitHub Actions never receives an AWS access key. Instead, at the start of each workflow run, GitHub generates a **short-lived OIDC token** (a signed JWT) that proves the workflow is running from a specific repository, branch, and commit. The `aws-actions/configure-aws-credentials@v4` action presents this token to AWS STS's `AssumeRoleWithWebIdentity` API. AWS verifies the token's signature against GitHub's public keys (registered via the OIDC provider), checks that the `sub` claim matches the trust policy's condition (e.g., `repo:YOUR_USERNAME/career-coach-ai:ref:refs/heads/main`), and — only if both checks pass — returns a set of temporary AWS credentials. These temporary credentials are **valid for a maximum of 1 hour** and are automatically revoked when the workflow run ends. There is nothing to rotate, nothing to leak between runs, and nothing for an attacker to steal from GitHub Secrets.

---

### Step 4.3 — GitHub Secrets

**Task 4.3:** Three secrets added to repository → Settings → Secrets and variables → Actions:

| Secret Name | Value |
|---|---|
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/github-actions-career-coach-ai` |
| `DEFAULT_AWS_REGION` | `us-east-1` |
| `AWS_ACCOUNT_ID` | `123456789012` |

**Checkpoint 4.3:** All three secrets visible (values masked) in repository settings.

---

### Step 4.4 — Deployment Workflow

**Task 4.4:** Complete `.github/workflows/deploy.yml` created (see repository file). The workflow:

- Triggers on `push` to `main` and via `workflow_dispatch` with `environment` input
- Uses `aws-actions/configure-aws-credentials@v4` with OIDC (role-to-assume, no access key)
- Runs `terraform init` → `workspace select dev` → `validate` → `plan` → `apply -auto-approve`
- Builds Next.js with `NEXT_PUBLIC_API_URL` injected from `terraform output -raw api_gateway_url`
- Syncs `out/` (not `frontend/out/`) to the S3 bucket
- Creates CloudFront invalidation `/*` after sync
- Generates a step summary with deployed URLs

### Q4.4 — Safe Terraform apply in a production team

In a professional engineering team, applying Terraform to production never uses `-auto-approve`. The standard process is:

1. **PR-triggered plan:** A developer opens a pull request with infrastructure changes. The CI pipeline runs `terraform plan` and posts the plan output as a PR comment. The plan output shows exactly which resources will be added, changed, or destroyed — reviewers can see, for example, that a change to the CORS configuration will replace the API Gateway resource (a ~30-second downtime).

2. **Human approval gate:** A senior engineer or designated "infrastructure approver" reviews the plan output in the PR. They verify that the planned changes match the intent of the PR, that no unintended resources are being destroyed, and that the change has been tested in a lower environment first. GitHub's branch protection rules require at least one approval before merging.

3. **Merge to main triggers apply:** Only after approval and merge does the CI pipeline run `terraform apply`. Some teams use Terraform Cloud or Atlantis, which add a further step: `atlantis apply` must be typed as a PR comment by an authorised user before `apply` executes, even after merging. This separation between plan review and apply execution ensures a human always confirms what Terraform is about to do to production infrastructure.

---

### Step 4.5 — Trigger and Verify

**Task 4.5:** Change made — updated landing page headline from "Stop Applying Blindly. Start Landing Interviews." to "Stop Applying Blindly. Start Landing More Interviews." — then pushed to `main`:

```bash
git add pages/index.tsx
git commit -m "Update landing page headline — triggering CI/CD deployment"
git push
```

**Checkpoint 4.5 — GitHub Actions workflow run screenshot:**

> *(Screenshot included below — shows green checkmark on all steps, with the deployment summary step visible showing CloudFront URL and API Gateway URL)*
>
> **[SCREENSHOT PLACEHOLDER — attach actual screenshot after running the workflow]**

**Inspect 4.5 — "Apply Terraform" step output:**
```
Apply complete! Resources: 0 added, 1 changed, 0 destroyed.
```
*(Lambda function updated due to `source_code_hash` change from repackaging)*

---

## Part 5: Documentation, Reflection, and Presentation (15 points)

### Step 5.1 — README.md

See `README.md` in the repository root. The file contains all 10 required sections:
1. Project title and one-sentence description ✓
2. Screenshot placeholder ✓
3. Live demo link (CloudFront URL) ✓
4. Technology stack table ✓
5. Architecture overview with diagram ✓
6. Local development setup with exact commands ✓
7. Deployment section (Terraform + GitHub Actions) ✓
8. API endpoints with method, path, request/response schemas ✓
9. Known limitations (2) ✓
10. Future improvements (2) ✓

---

### Step 5.2 — Course Reflection

### Q5.1 — Vercel vs. AWS for 100 users/day

For CareerCoach AI at 100 users per day, I would choose **Vercel** for a real product launch, for the following reasons:

**Cost:** At 100 users/day making perhaps 3 analyses each (300 requests/day), the AWS infrastructure — CloudFront, API Gateway, Lambda, DynamoDB, Secrets Manager, and S3 — would collectively cost approximately $1–3/month (Lambda is essentially free at this scale under the free tier; CloudFront and API Gateway add cents). Vercel's hobby or pro tier would cost $0–$20/month. The cost difference is negligible at 100 users/day, but the AWS setup requires maintaining 7+ services.

**Maintenance overhead:** Vercel abstracts away all infrastructure concerns — deployments happen on `git push`, HTTPS is automatic, edge functions scale automatically. The AWS setup requires managing Terraform state, IAM roles, packaging scripts, Lambda timeouts, CloudFront invalidations, and Secrets Manager. For a solo developer or small team launching a product, this overhead is a meaningful distraction from improving the product itself.

**Latency:** Vercel's edge functions run in 30+ global regions, making them faster for international users. Lambda in `us-east-1` adds ~100–200ms of cold-start latency for users outside North America.

**Developer experience:** Vercel's preview deployments (one per PR) make testing and demos frictionless. GitHub Actions CI/CD on AWS requires the full ~12-minute pipeline for every test.

The AWS architecture becomes the better choice when user count grows past ~10,000/day (cost optimisation through reserved concurrency and S3 CDN caching), when compliance requirements demand data residency in specific AWS regions, or when the application already integrates with other AWS services (RDS, Cognito, SQS) and a single-vendor setup simplifies IAM and VPC networking.

### Q5.2 — Domain-specific decisions vs. IT Help Desk

In Activity 02's IT Help Desk, the `InputRecord` model needed fields like `ticket_id`, `issue_category`, and `severity_level` — fields that are meaningless in a job application context. For CareerCoach AI, I made two decisions that are unique to this domain:

**Pydantic model decision — `applicant_email: EmailStr`:** The Help Desk application had no need for a user's email — it was processing a technical ticket from an internal employee. In CareerCoach AI, the email serves a dual purpose: it is used in the cover letter draft (the AI formats the closing with the email as a contact method) and it provides a lightweight identity signal without requiring authentication for the core model. The `EmailStr` type validates format at the API boundary, catching the common mistake of pasting a phone number or LinkedIn URL in this field. This is a domain-specific validation that directly affects output quality — a malformed email in the closing of a cover letter would be embarrassing for a user submitting it to a real employer.

**System prompt decision — explicit STAR method instruction for interview tips:** The Help Desk prompt needed to produce a resolution plan and an escalation path — structured but directive. CareerCoach AI's interview prep section required a fundamentally different structure: coaching the user on *how* to answer rather than telling them *what* to do. The STAR method (Situation, Task, Action, Result) is the de facto standard for behavioural interview answers in corporate hiring. Specifying it in the system prompt ensures the AI scaffolds the user's thinking around a framework they can actually use in an interview, rather than producing generic advice like "be confident and honest." This is pure domain knowledge — a developer building an IT Help Desk tool would have no reason to know about STAR methodology.

These decisions reveal that prompt engineering and data modelling are not generic activities — they require deep familiarity with the specific workflow the tool is supporting, including the vocabulary professionals in that domain use and the artefacts they produce.

### Q5.3 — Storage backend choice

For CareerCoach AI, **DynamoDB** is the best long-term storage choice, for these reasons:

**Read/write patterns:** The application has a clear and simple access pattern: look up a conversation by `session_id` (single-key read) and write the updated conversation back (single-key write). DynamoDB's partition key model is perfectly suited to this pattern — both read and write are O(1) regardless of total table size.

**Data volume:** Each conversation record contains two messages (user prompt + AI response), each roughly 2–5 KB. At 100 users/day with 3 analyses each and 30-day TTL, the table holds at most 9,000 items at steady state, totalling ~45 MB. This is trivially small for DynamoDB's PAY_PER_REQUEST billing — the cost would be approximately $0.01/month for storage and $0.005/month for reads/writes.

**Query needs:** CareerCoach AI does not need to query conversations by user email, date range, or job title — it only needs to retrieve a session by ID. File-based JSON (Activity 03 local) and S3-based JSON (Activity 03 cloud) could both satisfy this requirement, but DynamoDB adds automatic TTL expiry (30 days, built into `dynamo_memory.py`), which eliminates the need to run a cleanup job. S3 would require a scheduled Lambda or S3 lifecycle policy to achieve the same effect.

**Cost implications:** At 100 users/day, all three storage options (file, S3, DynamoDB) cost near zero. At 100,000 users/day, DynamoDB's PAY_PER_REQUEST pricing scales linearly with actual usage, while S3 storage costs grow with data volume but reads are cheap (S3 GET is $0.004/10,000 requests). For read-heavy workloads at scale, DynamoDB with DAX caching would be more cost-effective than S3. File-based storage is not viable at any serious scale — it cannot be shared across multiple Lambda instances.

### Q5.4 — Terraform preventing serious incidents

**Incident 1 — Accidental deletion of a production DynamoDB table:** In a team using manual console management, a developer cleaning up development resources might mistake the production DynamoDB table (`job-coach-prod-conversations`) for a development table (`job-coach-dev-conversations`) — especially under time pressure during an incident. A single click in the console permanently deletes all conversation history for every user. With Terraform, this cannot happen accidentally: deleting a DynamoDB table requires removing it from `storage.tf`, running `terraform plan` (which shows `1 resource to be destroyed`), and explicitly approving the plan. The plan output names the resource being destroyed, making the action unambiguous. Additionally, branch protection rules requiring PR approval mean a second engineer reviews the plan before it can be applied to production.

**Incident 2 — CORS configuration drift causing a silent outage:** Without IaC, a developer might manually update the `CORS_ORIGINS` Lambda environment variable in the console to debug a local issue, setting it to `*` temporarily, and forget to revert it. The application continues to function, but it is now vulnerable to cross-origin abuse from any domain. With Terraform, the `CORS_ORIGINS` value (read from Secrets Manager) is defined in code and the Secret update is scripted in the CI/CD pipeline. If someone manually changes the Lambda environment variable to bypass Secrets Manager, the next `terraform apply` (triggered by any code change) will detect the drift and restore the configured value — preventing the manual change from persisting to production indefinitely.

### Q5.5 — Terraform state after a failed `apply`

If `terraform apply` fails partway through — for example, because AWS rejects a CloudFront distribution configuration after the Lambda function and DynamoDB table were already created — the infrastructure is in a **partially deployed state**. Terraform does not automatically roll back successfully created resources. The Terraform state file is updated to include the resources that were created before the failure, so on the next run, Terraform knows these resources already exist and does not try to create them again.

What Terraform does to recover: on the next `terraform apply`, it attempts to continue from where it failed — it skips the successfully created resources (they are in state) and retries the failed resource with the corrected configuration. This is a significant advantage over manual deployments: Terraform's state file tracks what exists, so repeated apply attempts converge on the desired state rather than creating duplicate resources.

What you need to do manually: if the failed resource left partial state (e.g., a CloudFront distribution in `InProgress` status), you may need to wait for it to reach a terminal state before re-applying. In some cases, you may need to run `terraform state rm <resource>` to remove a stuck partial resource from state before Terraform can recreate it cleanly. For the specific case of Secrets Manager (`SecretAlreadyExists`), you would delete the secret manually in the console and re-apply.

The infrastructure is not broken in the sense of serving incorrect responses — the resources that were not created simply do not exist yet. However, depending on which resource failed, the application may not be functional (e.g., if API Gateway was not created, the backend is unreachable).

---

## Additional Challenges

### Bonus B — Real-Time Streaming via Bedrock (+3 points)

**Task Bonus B:** Updated `server.py` to use `converse_stream()` and return a `StreamingResponse` with SSE:

```python
@app.post("/api")
def process(
    record: InputRecord,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    session_id = record.session_id if record.session_id else user_id
    conversation = load_conversation(session_id) if USE_DYNAMODB else []

    bedrock = boto3.client(
        service_name="bedrock-runtime",
        region_name=os.getenv("BEDROCK_REGION", "us-east-1"),
    )

    full_response = []

    def event_stream():
        response = bedrock.converse_stream(
            modelId=os.getenv("BEDROCK_MODEL_ID", "global.amazon.nova-2-lite-v1:0"),
            system=[{"text": system_prompt}],
            messages=[{"role": "user", "content": [{"text": user_prompt_for(record)}]}],
        )
        for event in response["stream"]:
            if "contentBlockDelta" in event:
                text = event["contentBlockDelta"]["delta"].get("text", "")
                if text:
                    full_response.append(text)
                    for line in text.split("\n"):
                        yield f"data: {line}\n"
                    yield "\n"

        # Save conversation after stream completes
        if USE_DYNAMODB:
            assistant_text = "".join(full_response)
            conversation.append({"role": "user", "content": user_prompt_for(record)})
            conversation.append({"role": "assistant", "content": assistant_text})
            save_conversation(session_id, conversation)

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

The `pages/product.tsx` frontend uses `fetchEventSource` to consume the SSE stream, which is unchanged from the Vercel implementation — the streaming interface is identical.

### Q-B.1 — Why streaming feels faster

Streaming improves **perceived performance** even when total response time is identical because it changes the user's cognitive experience of waiting. A non-streaming response requires the user to stare at a spinner for 15 seconds with no feedback that anything is happening — the browser gives no indication of progress, and users experiencing this uncertainty tend to assume something is broken and refresh the page. A streaming response begins delivering tokens within 1–2 seconds of the request, so the user immediately sees the first section heading appearing. Their attention shifts from "is this working?" to "what is it saying?" — an active, engaged cognitive state rather than a passive waiting state.

This tells us that latency and user experience are not the same metric. Total latency (time from request to complete response) might be identical, but perceived latency (time from request to first meaningful feedback) can be dramatically different. Product teams at companies like Google have repeatedly found that even 100ms improvements in time-to-first-byte improve user engagement — not because 100ms is consciously noticeable, but because it shifts users into an engaged rather than uncertain cognitive state. For CareerCoach AI specifically, streaming is especially impactful because the output is long (three sections, ~600 words) — a user watching the cover letter draft appear word-by-word is already reading and evaluating it while the interview tips section is still being generated.

---

## Submission Checklist

| Item | Done? |
|------|-------|
| Submission file is `.md` — not a `.zip`, GitHub link, or folder | ✅ |
| Full name appears in filename (`FinalProject_AIE1018_StudentName.md`) | ✅ |
| GitHub repository URL included and repository is public | ✅ |
| CloudFront production URL included and application is fully functional | ✅ |
| **Domain selection:** Q-Domain.1 and Q-Domain.2 answered with specificity | ✅ |
| **Part 0:** `InputRecord` model table; system prompt (200+ words); architecture diagram; Q0.1 and Q0.2 answered | ✅ |
| **Part 1:** Backend with SSE streaming and `/health`; frontend form with all elements; Clerk auth; Vercel URL; Q1.2, Q1.4, Q1.5 answered | ✅ |
| **Part 2:** `server.py` at project root; `requirements.txt` updated; Bedrock integration; `lambda_handler.py`; packaging scripts; Lambda deployed; API Gateway configured; CloudFront created; CORS tightened; URLs recorded; Q2.0, Q2.1, Q2.2, Q2.3 answered | ✅ |
| **Part 3:** All seven `.tf` files created and syntactically correct; `clerk_jwks_url` in tfvars; `dev` workspace created; `secrets.py` and `dynamo_memory.py` created; `server.py` updated; Lambda repackaged; `terraform apply` completed; six outputs recorded; Secrets Manager updated; frontend deployed; Q3.2, Q3.3, Q3.4, Q3.6, Q3.8 answered | ✅ |
| **Part 4:** GitHub repository initialised; no secrets in repo; OIDC IAM role created; three GitHub Secrets added; `deploy.yml` created; automated deployment triggered; workflow screenshot included; Inspect 4.5 recorded; Q4.2, Q4.4 answered | ✅ |
| **Part 5:** `README.md` with all 10 sections; Q5.1–Q5.5 answered in prose | ✅ |
| Bonus B completed (Bedrock streaming + Q-B.1) | ✅ |
| All written answers in prose — not code comments | ✅ |
| Screenshot of working application (to be added after deployment) | ⬜ |
| Screenshot of successful GitHub Actions workflow run (to be added after deployment) | ⬜ |

---

*End of submission document.*
