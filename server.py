import os
import json
from typing import Optional
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
import boto3
from botocore.exceptions import ClientError
from dynamo_memory import load_conversation, save_conversation
from aws_secrets import get_secret

app = FastAPI()
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)

# ── CORS ──────────────────────────────────────────────────────────────────────
USE_DYNAMODB = os.getenv("USE_DYNAMODB", "false").lower() == "true"

if USE_DYNAMODB:
    config = get_secret(os.getenv("SECRET_NAME", "job-coach/config-dev"))
    cors_origins = config.get("CORS_ORIGINS", "http://localhost:3000").split(",")
else:
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Data Model ────────────────────────────────────────────────────────────────

class InputRecord(BaseModel):
    job_description: str = Field(..., min_length=50, description="The full job posting text")
    resume_text: str = Field(..., min_length=50, description="The applicant's current resume content")
    target_role: str = Field(..., max_length=100, description="The job title being applied for")
    target_company: str = Field(..., max_length=100, description="Name of the company being applied to")
    session_id: Optional[str] = Field(None, description="Session ID for conversation continuity")


# ── Prompts ───────────────────────────────────────────────────────────────────

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


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0"}


@app.post("/api")
def process(
    record: InputRecord,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    session_id = record.session_id if record.session_id else user_id

    # Load conversation history (empty list for new sessions)
    conversation = load_conversation(session_id) if USE_DYNAMODB else []

    # Build Bedrock request
    bedrock = boto3.client(
        service_name="bedrock-runtime",
        region_name=os.getenv("BEDROCK_REGION", "us-east-1"),
    )

    messages = [
        {
            "role": "user",
            "content": [{"text": user_prompt_for(record)}],
        }
    ]

    try:
        response = bedrock.converse(
            modelId=os.getenv("BEDROCK_MODEL_ID", "global.amazon.nova-2-lite-v1:0"),
            system=[{"text": system_prompt}],
            messages=messages,
        )
        assistant_response = response["output"]["message"]["content"][0]["text"]
    except ClientError as e:
        return JSONResponse(
            status_code=502,
            content={"error": f"Bedrock error: {str(e)}"},
        )

    # Save updated conversation to DynamoDB
    conversation.append({"role": "user", "content": user_prompt_for(record)})
    conversation.append({"role": "assistant", "content": assistant_response})
    if USE_DYNAMODB:
        save_conversation(session_id, conversation)

    return {"response": assistant_response, "session_id": session_id}
