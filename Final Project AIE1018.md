# Final Project: Build and Ship Your Own Production AI SaaS

**AIE1018 — AI Deployment and MLOps**
**Cambrian College — Winter 2026**

| **Item** | **Details** |
|---|---|
| **Weight** | 20% of final grade |
| **Due Date** | Check the submission folder on Moodle |
| **Submission Format** | Single document (`.ipynb`, `.py`, `.md`, `.pdf`, or `.docx`) containing all answers, code, screenshots, and both URLs |
| **Estimated Time** | 8–12 hours |
| **Topics Covered** | FastAPI, Next.js, Clerk Auth, Vercel, AWS Lambda, API Gateway, S3, CloudFront, AWS Bedrock, Terraform, GitHub Actions CI/CD |

---

## Welcome to the Final Project

Throughout this semester you have built production-grade AI applications piece by piece — deploying to Vercel, securing with Clerk, switching to AWS serverless infrastructure, managing state in DynamoDB, defining infrastructure as code with Terraform, and automating deployments with GitHub Actions. Each applied activity focused on one layer of the stack in a domain you were given.

This final project is different. **You choose the domain. You own every decision.**

Your task is to design and deploy an original AI-powered SaaS application that integrates every major skill from the course into a single, coherent, production-ready product. There is no prescribed use case — only a required technical pipeline. A recruiter should be able to visit your deployed URL, use your application, and immediately understand what you built and why it works.

**How to use this document:**

| Symbol | Meaning |
|--------|---------|
| ✏️ **Task** | Complete this step and include the result in your submission |
| 🔍 **Inspect** | Observe something carefully and record what you find |
| 🧠 **Check Your Understanding** | Answer the question in your submission document as prose |
| ✅ **Checkpoint** | Verify your work is correct before moving forward |

**What to submit:**
A single document (your choice of format) containing all written answers, completed code, screenshots, and URLs. Your document must include your **GitHub repository URL** and your **CloudFront production URL**. A grader should be able to read your document and evaluate your work without running any code, other than visiting your two URLs.

---

## Choose Your Application Domain

Before writing a single line of code, you must decide what you are building. Your application must use AI to solve a real, specific problem for a defined audience. Generic applications such as "a chatbot" or "a question answering tool" will not receive full marks on the proposal section.

**Domain examples** (choose one of these or propose your own):

- A **Legal Document Summariser** — lawyers upload contracts; the AI returns a plain-language summary, a list of risky clauses, and a client-friendly email
- A **Code Review Assistant** — developers paste code; the AI returns a structured review with a severity-graded issue list, a corrected version, and an explanation suitable for a junior developer
- A **Job Application Coach** — job seekers paste a job description and resume; the AI returns tailored bullet points, a cover letter draft, and interview preparation tips
- A **Personal Finance Advisor** — users describe their financial situation; the AI returns a budget analysis, a savings plan, and a risk-awareness notice
- A **Restaurant Menu Explainer** — users paste a menu; the AI returns dish descriptions in plain language, dietary flags, and a recommendation for a first-time visitor
- An **Academic Paper Summariser** — researchers paste an abstract or introduction; the AI returns a lay-person summary, key findings, and a list of follow-up questions

Your application must produce **structured, multi-section output** — at least three clearly labelled sections — just as the healthcare consultation app from the Week 1 course materials and the IT Help Desk in Activity 02 did.

🧠 **Q-Domain.1** — State your chosen domain clearly. Who is the specific target user, and what problem does your application solve for them that they cannot easily solve without AI assistance? Write 3–5 sentences.

```
Your answer:


```

🧠 **Q-Domain.2** — Describe the three (or more) output sections your application will produce. For each section, state its name, its intended audience (the professional using the tool vs. the end-user affected), and the tone the AI should adopt in that section.

```
Your answer:


```

---

## Part 0: Project Proposal and Architecture Design (5 points)

### Step 0.1 — Define Your Pydantic Data Model

Before writing any endpoints or UI, the data model is the contract between your frontend and backend. Every field name you define here must appear consistently in both.

✏️ **Task 0.1:** Design your `InputRecord` Pydantic model. It must contain **at least five fields** that capture everything needed to generate your structured output. At least one field must require a specific format (e.g., a date, an email address, a URL, or a constrained string length).

Document your model in your submission using this format:

| Field Name | Python Type | Description | Validation Note |
|---|---|---|---|
| `field_one` | `str` | What it represents | Any constraints |
| … | … | … | … |

🧠 **Q0.1** — Why does defining the Pydantic model before building the frontend and backend save time compared to building them simultaneously and integrating later? Give a specific example of a bug that the model catches before it reaches OpenAI or Bedrock.

```
Your answer:


```

---

### Step 0.2 — Design Your System Prompt

✏️ **Task 0.2:** Write your system prompt. It must:

- Establish the AI's role and expertise domain
- Define the exact heading names for each output section (use `##` Markdown headings)
- Specify the tone and language for each section
- Include at least one constraint rule (e.g., "Do not invent facts not present in the input")

Your system prompt must be **at least 200 words**. Paste it in full in your submission document.

🧠 **Q0.2** — Your system prompt defines three or more output sections. Explain why putting detailed structural instructions in the system prompt produces more reliable output than embedding them in the user prompt. What is the functional role difference between the system and user messages from the model's perspective?

```
Your answer:


```

---

### Step 0.3 — Architecture Diagram

✏️ **Task 0.3:** Draw or describe your full system architecture. Include every component that will exist by the end of the project:

- Frontend (Next.js, hosted on _____)
- Backend (FastAPI, running on _____)
- AI model (OpenAI / AWS Bedrock — which model, and why)
- Memory / storage layer (which service, and what it stores)
- Authentication (Clerk)
- Deployment automation (Terraform, GitHub Actions)
- Secrets management (Secrets Manager / Vercel env vars)

You may draw a box-and-arrow diagram (photo of whiteboard is fine) or write a structured description. Label every arrow with the protocol used (HTTPS, AWS SDK call, etc.).

✅ **Checkpoint 0.3:** Can you trace a single user request — from the moment they click "Submit" on your form to the moment the AI response appears in their browser — through every component in your diagram? If not, your architecture has a gap.

---

## Part 1: Build Your Full-Stack AI Application on Vercel (25 points)

### Learning Goal
Implement the complete full-stack AI streaming pattern on Vercel with Clerk authentication and subscription gating, applied to your chosen domain.

---

### Step 1.1 — Project Setup

✏️ **Task 1.1:** Create a new project directory named after your application (e.g., `legal-summariser`). Copy your most recent Vercel SaaS project into it as a starting scaffold:

```bash
cp -r SaaS YourProjectName
cd YourProjectName
npm install react-datepicker
npm install --save-dev @types/react-datepicker
```

Confirm the following files are present before touching any logic:

- `api/index.py` — Python backend
- `pages/product.tsx` — product page
- `pages/index.tsx` — landing page
- `pages/_app.tsx` — app wrapper
- `vercel.json` — Vercel routing config

✅ **Checkpoint 1.1:** `ls pages/` and `ls api/` both return the expected files.

---

### Step 1.2 — Backend: Data Model, Prompts, and Streaming Endpoint

✏️ **Task 1.2:** Replace `api/index.py` with your application's backend. Your implementation must include:

1. **Your `InputRecord` Pydantic model** from Step 0.1
2. **Your `system_prompt` string** from Step 0.2
3. **A `user_prompt_for(record)` function** that injects all input fields with clear labels
4. **A POST `/api` endpoint** that verifies the Clerk JWT, accepts your `InputRecord`, calls OpenAI with `stream=True`, and returns a `StreamingResponse` using Server-Sent Events
5. **A GET `/health` endpoint** — required for the Lambda test in Part 2 and for the API Gateway route in Part 3

Use this endpoint skeleton and fill in every `# TODO`:

```python
import os
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI

app = FastAPI()
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)


class InputRecord(BaseModel):
    # TODO: paste your five-field model from Step 0.1
    pass


system_prompt = """
# TODO: paste your system prompt from Step 0.2
"""


def user_prompt_for(record: InputRecord) -> str:
    # TODO: return a clearly labelled f-string with all fields
    pass


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
                # TODO: split on newlines and yield correctly formatted SSE events
                pass

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

> ⚠️ The SSE event format must exactly match what `fetchEventSource` expects on the frontend. Review the streaming pattern from Activities 02–04 before implementing.

✅ **Checkpoint 1.2:** Your endpoint skeleton loads without import errors:
```bash
python3 -c "from api.index import app; print('Backend loaded')"
```

🧠 **Q1.2** — Your `user_prompt_for()` function labels every field explicitly (e.g., `"Ticket ID: {record.ticket_id}"`). What goes wrong if you omit the labels and just concatenate raw values? Write a concrete example using two of your own fields where omitting labels could cause the model to confuse them.

```
Your answer:


```

---

### Step 1.3 — Frontend: Form, Streaming, and Output

✏️ **Task 1.3:** Replace `pages/product.tsx` with a form component for your application. Your form must include:

| Requirement | Implementation |
|---|---|
| One controlled input per model field | `useState` + `onChange` for each |
| At least one `<select>` dropdown | For any categorical field |
| A `DatePicker` component | If your model includes a date field; otherwise a structured text input with a placeholder showing the expected format |
| A streaming output area | Accumulates SSE chunks; renders as Markdown using `ReactMarkdown` |
| A loading state | Disables submit button while a request is in flight |
| `fetchEventSource` POST | Sends JWT + JSON body; maps camelCase state to snake_case fields |
| `<Protect>` subscription gate | Shows `<PricingTable />` to users without an active subscription |
| `<UserButton showName={true} />` | Positioned in the top-right corner |

> ⚠️ **camelCase → snake\_case mapping:** Your React state uses camelCase (`reportedBy`) but your Pydantic model uses snake_case (`reported_by`). The mapping happens inside `JSON.stringify({...})` in your `fetchEventSource` call. A mismatch causes a `422 Unprocessable Entity` error from FastAPI.

🔍 **Inspect 1.3:** Open your browser's Network tab after submitting the form. Find the `/api` request. Record the following in your submission document:
- The request method and Content-Type header
- The raw JSON body sent (with field names exactly as sent)
- The first three SSE events received (the raw `data: ...` lines)

---

### Step 1.4 — Landing Page

✏️ **Task 1.4:** Update `pages/index.tsx` to reflect your application's domain. Your landing page must include:

1. A professional header with your app name and a Sign In / UserButton toggle
2. A hero section with a headline, tagline, and call-to-action button
3. A features section highlighting at least three specific capabilities of your AI tool
4. A pricing preview showing your Free and Premium tier distinctions

🧠 **Q1.4** — Your landing page is not just decoration — it is the primary conversion tool for a SaaS product. Describe two specific copywriting decisions you made (e.g., word choice, feature framing, CTA text) and explain why you expect those decisions to persuade a first-time visitor to sign up.

```
Your answer:


```

---

### Step 1.5 — Configure Clerk and Deploy to Vercel

✏️ **Task 1.5:** Complete the following in order:

```bash
# Link project to Vercel
vercel link

# Add all four environment variables (select all environments for each)
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add CLERK_JWKS_URL

# Deploy to production
vercel --prod
```

In your Clerk Dashboard → Configure → Subscription Plans, create a plan called **Premium** with key `premium_subscription`.

✅ **Checkpoint 1.5:** Visit your production URL. Complete this checklist:

- [ ] Landing page loads correctly
- [ ] Sign in with at least one provider works (Google or GitHub recommended)
- [ ] Unauthenticated access to `/product` shows the pricing table
- [ ] After signing in and subscribing, the form is accessible
- [ ] Submitting the form produces streaming output with correctly formatted Markdown sections
- [ ] Signing out works

Write your Vercel production URL here:
```
Vercel URL: https://___________________________________
```

🧠 **Q1.5** — The `<Protect plan="premium_subscription">` component performs its check on the client side. A determined user could inspect the bundle and attempt to call `/api` directly. Why is this not a security vulnerability in your application? Where is the actual enforcement layer, and how does it work?

```
Your answer:


```

---

## Part 2: AWS Production Deployment (20 points)

### Learning Goal
Re-deploy your working Vercel application to production-grade AWS infrastructure: Lambda for the backend, S3 + CloudFront for the frontend, and AWS Bedrock to replace OpenAI.

---

### Step 2.0 — Create `server.py` for Lambda Deployment

Your Vercel project uses `api/index.py` because Vercel expects Python backends in an `api/` subdirectory. AWS Lambda expects a flat file structure — all Python files at the same directory level as `lambda_handler.py`. Before packaging for Lambda, you will create a `server.py` file at your project root.

**Your Vercel deployment from Part 1 remains untouched.** You are not modifying `api/index.py`. You are creating a parallel backend file that will evolve independently through Parts 2–4 as you add Bedrock, DynamoDB, and Secrets Manager integration.

✏️ **Task 2.0:** Create `server.py` at your project root by copying your existing backend:

```bash
cp api/index.py server.py
```

Confirm the `/health` endpoint is present in `server.py` (you added it to the skeleton in Step 1.2). If it is missing, add it now:

```python
@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0"}
```

✅ **Checkpoint 2.0:** Confirm both files exist and `server.py` loads independently:
```bash
ls api/index.py server.py
python3 -c "from server import app; print('server.py loaded successfully')"
```

From this point forward, **all changes to the backend (Bedrock integration, DynamoDB, Secrets Manager) happen in `server.py`**. Your `api/index.py` and your Part 1 Vercel deployment remain exactly as they are.

🧠 **Q2.0** — You are now maintaining two backend files: `api/index.py` (for Vercel) and `server.py` (for Lambda). In a real engineering team, having two files with diverging logic is a maintenance risk. Describe one strategy a team could use to keep these in sync automatically, and one strategy that avoids having two files entirely.

```
Your answer:


```

---

### Step 2.1 — Switch to AWS Bedrock and Update Dependencies

✏️ **Task 2.1a — Update `requirements.txt`:** Remove the `openai` package and ensure `boto3` and `mangum` are present. Your final `requirements.txt` should contain exactly these packages:

```
fastapi
uvicorn
boto3
python-multipart
fastapi-clerk-auth
mangum
```

✏️ **Task 2.1b — Update `server.py` for Bedrock:** Replace the OpenAI import and call with AWS Bedrock. Remove `from openai import OpenAI` and add `import boto3` and `from botocore.exceptions import ClientError`. Your Bedrock implementation must:

- Create a Bedrock client: `boto3.client(service_name="bedrock-runtime", region_name=os.getenv("BEDROCK_REGION", "us-east-1"))`
- Use model ID `global.amazon.nova-2-lite-v1:0` (or confirm the current ID in the [Bedrock model catalogue](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html))
- Pass your system prompt via the `system` parameter of `converse()`
- Build the `messages` list in Bedrock format (`[{"role": "user", "content": [{"text": "..."}]}]`)
- Return the response text from `response["output"]["message"]["content"][0]["text"]`

> ⚠️ For this step, use the non-streaming `converse()` call and return a standard `JSONResponse`. This simplifies the initial Lambda deployment. Real-time Bedrock streaming via `converse_stream()` is explored in Bonus B — Bedrock fully supports streaming, and you will implement it there.

🧠 **Q2.1** — You have now used both OpenAI and AWS Bedrock to call AI models. List two concrete advantages of using Bedrock in a production AWS environment compared to calling the OpenAI API. Then list one situation where you would still choose OpenAI despite those advantages.

```
Your answer:


```

---

### Step 2.2 — Create Packaging Script and Deploy to Lambda

#### Create `lambda_handler.py`

✏️ **Task 2.2a:** Create `lambda_handler.py` at your project root. This file is the Lambda entry point that bridges Lambda's event format and FastAPI:

```python
# lambda_handler.py
from mangum import Mangum
from server import app   # imports from server.py at the project root

# Mangum translates Lambda's event/context format into ASGI requests
# that FastAPI understands. Without this, Lambda cannot invoke FastAPI.
handler = Mangum(app)
```

#### Create Packaging Scripts

✏️ **Task 2.2b:** Create the packaging script for your operating system. These scripts install all Python dependencies into a flat directory and zip everything into `infra/lambda.zip` — the format Lambda requires.

> **Why `pip` and not `uv`?** Lambda packaging requires installing packages directly into a target folder (`pip install -t`), not into a virtual environment. `uv` manages isolated virtual environments and does not support the `-t` flag, so plain `pip` is used here.

**Mac/Linux — create `infra/package.sh`:**

```bash
#!/bin/bash
set -e

echo "Packaging Lambda function..."

# Install all dependencies into a flat target directory
pip install -r requirements.txt -t ./package --quiet

# ⚠️  macOS Apple Silicon (M1/M2/M3) users:
# Packages compiled for Apple Silicon are NOT compatible with Lambda's Linux x86_64 runtime.
# Replace the pip install line above with:
#
# pip install -r requirements.txt -t ./package \
#   --platform manylinux2014_x86_64 \
#   --only-binary=:all: \
#   --python-version 3.12 \
#   --quiet

# Copy all root-level Python source files into the package
cp *.py package/

# Create the ZIP from inside the package directory
cd package
zip -r ../infra/lambda.zip . --quiet
cd ..

# Clean up the temporary directory
rm -rf package

echo "Done: infra/lambda.zip created"
ls -lh infra/lambda.zip
```

**Windows PowerShell — create `infra/package.ps1`:**

```powershell
Write-Host "Packaging Lambda function..."

pip install -r requirements.txt -t .\package --quiet
Copy-Item *.py package\
Compress-Archive -Path package\* -DestinationPath .\infra\lambda.zip -Force
Remove-Item -Recurse -Force package

Write-Host "Done: infra\lambda.zip created"
Get-Item .\infra\lambda.zip | Select-Object Name, Length
```

Create the `infra/` directory if it does not yet exist, then run your script:

```bash
# Mac/Linux (from project root):
mkdir -p infra
chmod +x infra/package.sh
./infra/package.sh

# Windows (from project root):
New-Item -ItemType Directory -Force -Path infra
.\infra\package.ps1
```

✅ **Checkpoint 2.2b — Verify the ZIP:**
```bash
ls -lh infra/lambda.zip            # Expected: 20–100 MB
unzip -l infra/lambda.zip | grep -E "server\.py|lambda_handler\.py"
# Both files should be listed inside the ZIP
```

#### Deploy to Lambda

✏️ **Task 2.2c:** In the AWS Console:

1. **Lambda** → **Create function** → Author from scratch
2. Name: `YOUR-APP-NAME-api`, Runtime: Python 3.12, Architecture: x86_64
3. Click **Create function**
4. **Code source** → **Upload from** → **.zip file** → upload `infra/lambda.zip`
5. **Runtime settings** → **Edit** → set Handler to `lambda_handler.handler` → Save
6. **Configuration** → **General configuration** → **Edit** → set Timeout to **30 seconds** → Save
7. **Configuration** → **Environment variables** → **Edit** → add:
   - `CLERK_JWKS_URL` — your Clerk JWKS URL
   - `CORS_ORIGINS` — `*` (temporarily; tightened in Step 2.3)
   - `BEDROCK_REGION` — your AWS region (e.g., `us-east-1`)
   - `BEDROCK_MODEL_ID` — `global.amazon.nova-2-lite-v1:0`
8. **Configuration** → **Permissions** → click the execution role name → attach `AmazonBedrockFullAccess`

✅ **Checkpoint 2.2c:** Use the Lambda console **Test** tab. Create a test event using the **API Gateway AWS Proxy** template, set the `rawPath` to `/health` and the `http.method` to `GET`. Expected response body: `{"status": "healthy", "version": "1.0"}`.

🧠 **Q2.2** — The default Lambda timeout is 3 seconds. Your application calls an AI model that may take 8–20 seconds to respond. Describe what the user experiences if the Lambda times out before Bedrock responds. What HTTP status code does API Gateway return in this case, and why?

```
Your answer:


```

---

### Step 2.3 — API Gateway, S3, and CloudFront

✏️ **Task 2.3:** Follow these steps to complete the AWS deployment:

**API Gateway:**
1. **API Gateway** → Create API → **HTTP API** → Build
2. Add Lambda integration pointing to your Lambda function
3. Add routes: `POST /api`, `GET /health`, `ANY /{proxy+}`, `OPTIONS /{proxy+}`
4. Configure CORS: Allow-Origin `*`, Allow-Headers `*`, Allow-Methods `*`, Max-Age `300`
5. Note the **Invoke URL**

**Frontend — Build and Upload:**

> ⚠️ Your Next.js project root is your Vercel project directory — there is no `frontend/` subdirectory in a Vercel SaaS project. Build from the project root and sync from the `out/` directory.

```bash
# From your project root (where package.json lives)
# Ensure next.config.ts has: output: 'export' and images: { unoptimized: true }
npm run build
aws s3 sync out/ s3://YOUR-FRONTEND-BUCKET/ --delete
```

Enable **Static Website Hosting** on the S3 bucket (index: `index.html`, error: `index.html`).

**CloudFront:**
1. Create distribution; origin: S3 website endpoint (without `http://`); **Origin protocol policy: HTTP only** ← critical
2. Viewer protocol: Redirect HTTP to HTTPS; Default root object: `index.html`
3. Add custom error responses: both 403 and 404 → `/index.html` → HTTP 200
4. Price class: North America and Europe
5. Once deployed, **update Lambda** `CORS_ORIGINS` environment variable to: `https://YOUR-CLOUDFRONT-DOMAIN.cloudfront.net` — no trailing slash, must start with `https://`
6. Create a CloudFront invalidation: path `/*`

✅ **Checkpoint 2.3:** Run the following tests:

```bash
# Test backend health
curl https://YOUR-API-GATEWAY-URL/health
# Expected: {"status":"healthy","version":"1.0"}

# Test your main endpoint (unauthenticated — expect a 401 or 403, confirming the guard is active)
curl -X POST https://YOUR-API-GATEWAY-URL/api \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
# Expected: an authentication error (401/403), not a 404 or 500
```

Then visit `https://YOUR-CLOUDFRONT-DOMAIN.cloudfront.net` — your app should load over HTTPS and a signed-in, subscribed user should be able to submit the form and receive an AI response.

Write your AWS URLs here:
```
API Gateway URL:  https://___________________________________
CloudFront URL:   https://___________________________________
```

🧠 **Q2.3** — The CloudFront origin protocol policy is set to `HTTP only` even though the user always connects via HTTPS. Explain why this does not introduce a security vulnerability. What is the difference between the user-to-CloudFront connection and the CloudFront-to-S3 connection in terms of encryption and network path?

```
Your answer:


```

---

## Part 3: Infrastructure as Code with Terraform (20 points)

### Learning Goal
Codify your entire AWS infrastructure so it can be destroyed and rebuilt from scratch with a single command. Add DynamoDB for persistent conversation memory and Secrets Manager for centralised runtime configuration.

---

### Step 3.1 — Project Structure and Initialisation

✏️ **Task 3.1:** Open (or create) the `.gitignore` file in your project root and add the following Terraform-specific entries:

```
# Terraform
.terraform/
terraform.tfstate
terraform.tfstate.backup
*.tfstate*
crash.log

# terraform.lock.hcl SHOULD be committed (pins provider versions)
# Do NOT add it to .gitignore
```

Then initialise Terraform and create the `dev` workspace:

```bash
cd infra
terraform init
terraform workspace new dev
terraform workspace list   # should show * dev
```

✅ **Checkpoint 3.1:** After `terraform init`, a `.terraform/` directory and `.terraform.lock.hcl` file are created. After `terraform workspace new dev`, the list shows `* dev` as active.

🔍 **Inspect 3.1:** Run `ls -la infra/` after init. List the files and directories created by `terraform init` in your submission document. Explain the purpose of each.

---

### Step 3.2 — Core Configuration Files

✏️ **Task 3.2:** Create the following four files:

**`infra/main.tf`:**
```hcl
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}
data "aws_region"          "current" {}

locals {
  name_prefix  = "${var.project_name}-${terraform.workspace}"
  s3_origin_id = "${var.project_name}-s3-${terraform.workspace}"
}
```

**`infra/variables.tf`:**
```hcl
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Short name used as a prefix for all resource names (lowercase, hyphens only)"
  type        = string
  default     = "myapp"
}

variable "environment" {
  description = "Environment label used in resource tags"
  type        = string
  default     = "dev"
}

variable "bedrock_model_id" {
  description = "Bedrock model ID. Use the global. cross-region inference prefix for best availability."
  type        = string
  default     = "global.amazon.nova-2-lite-v1:0"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "clerk_jwks_url" {
  description = "Clerk JWKS URL for JWT verification (not secret — safe to store in tfvars)"
  type        = string
  default     = ""
}
```

**`infra/terraform.tfvars`:**
```hcl
aws_region       = "us-east-1"       # Change if you use a different region
project_name     = "YOUR-APP-NAME"   # Replace with your app name (lowercase, hyphens only)
environment      = "dev"
bedrock_model_id = "global.amazon.nova-2-lite-v1:0"
lambda_timeout   = 30
clerk_jwks_url   = "https://YOUR-CLERK-APP.clerk.accounts.dev/.well-known/jwks.json"
# Replace the clerk_jwks_url above with your actual JWKS URL from the Clerk Dashboard
# (Configure → API Keys → JWKS URL)
```

> **⚠️ Heads up — Bedrock model access (2026):** AWS no longer requires manual model activation. Foundation models are automatically available on first invocation. If you encounter a `ThrottlingException`, the `global.` prefix routes to the region with the highest available quota, which usually resolves it. If you see a `ValidationException` referencing the model ID, verify the current format in the [Bedrock model catalogue](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html).

**`infra/outputs.tf`:**
```hcl
output "api_gateway_url"     { value = aws_apigatewayv2_api.main.api_endpoint }
output "cloudfront_domain"   { value = aws_cloudfront_distribution.main.domain_name }
output "dynamodb_table_name" { value = aws_dynamodb_table.conversations.name }
output "frontend_bucket"     { value = aws_s3_bucket.frontend.bucket }
output "lambda_name"         { value = aws_lambda_function.api.function_name }
output "secret_name"         { value = aws_secretsmanager_secret.config.name }
```

🧠 **Q3.2** — The `terraform.tfvars` file sets the `project_name` variable. This value appears in the name of every resource Terraform creates (via `local.name_prefix`). Why is consistent naming across all resources important in a team environment where multiple developers are working in the same AWS account?

```
Your answer:


```

---

### Step 3.3 — Lambda and IAM (`lambda.tf`)

✏️ **Task 3.3:** Create `infra/lambda.tf`. Fill in the three policy ARN blanks (A, B, C). AWS managed policy ARNs follow the format `arn:aws:iam::aws:policy/PolicyName`:

```hcl
resource "aws_iam_role" "lambda_exec" {
  name = "${local.name_prefix}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Action = "sts:AssumeRole"; Effect = "Allow"
      Principal = { Service = "lambda.amazonaws.com" } }]
  })
  tags = { Project = var.project_name; ManagedBy = "terraform" }
}

resource "aws_iam_role_policy_attachment" "logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "___________"  # ✏️ Blank A: AWSLambdaBasicExecutionRole
}

resource "aws_iam_role_policy_attachment" "dynamodb" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "___________"  # ✏️ Blank B: AmazonDynamoDBFullAccess
}

resource "aws_iam_role_policy_attachment" "bedrock" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "___________"  # ✏️ Blank C: AmazonBedrockFullAccess
}

resource "aws_iam_role_policy" "secrets" {
  name = "${local.name_prefix}-secrets-policy"
  role = aws_iam_role.lambda_exec.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow"; Action = ["secretsmanager:GetSecretValue"]
      Resource = "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/*"
    }]
  })
}

resource "aws_lambda_function" "api" {
  filename         = "lambda.zip"
  source_code_hash = filebase64sha256("lambda.zip")
  function_name    = "${local.name_prefix}-api"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "lambda_handler.handler"
  runtime          = "python3.12"
  timeout          = var.lambda_timeout
  memory_size      = 512

  environment {
    variables = {
      USE_DYNAMODB     = "true"
      DYNAMODB_TABLE   = aws_dynamodb_table.conversations.name
      BEDROCK_REGION   = var.aws_region
      BEDROCK_MODEL_ID = var.bedrock_model_id
      CLERK_JWKS_URL   = var.clerk_jwks_url
      SECRET_NAME      = "${var.project_name}/config-${terraform.workspace}"
      ENVIRONMENT      = terraform.workspace
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.logs,
    aws_iam_role_policy_attachment.dynamodb,
    aws_iam_role_policy_attachment.bedrock,
  ]
  tags = { Project = var.project_name; ManagedBy = "terraform" }
}
```

🧠 **Q3.3** — The Lambda resource includes `source_code_hash = filebase64sha256("lambda.zip")`. Explain precisely what Terraform does with this value, and what would happen across two separate `terraform apply` runs — one where your Python code has changed and one where it has not — if you removed this line entirely.

```
Your answer:


```

---

### Step 3.4 — Storage Resources (`storage.tf`)

✏️ **Task 3.4:** Create `infra/storage.tf`. Complete Blank A (the DynamoDB TTL block) and Blank B (the S3 bucket name):

```hcl
resource "aws_dynamodb_table" "conversations" {
  name         = "${local.name_prefix}-conversations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "session_id"

  attribute { name = "session_id"; type = "S" }

  # ✏️ Blank A: Add the TTL block here.
  # Attribute name: "ttl". Look up the ttl block syntax in the Terraform AWS provider docs.
  _______________

  tags = { Project = var.project_name; ManagedBy = "terraform" }
}

resource "aws_s3_bucket" "frontend" {
  bucket = "___________"  # ✏️ Blank B: "${local.name_prefix}-frontend-${data.aws_caller_identity.current.account_id}"
  tags   = { Project = var.project_name; ManagedBy = "terraform" }
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  index_document { suffix = "index.html" }
  error_document { key    = "index.html" }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend_public" {
  bucket     = aws_s3_bucket.frontend.id
  depends_on = [aws_s3_bucket_public_access_block.frontend]
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Sid = "PublicRead"; Effect = "Allow"; Principal = "*"
      Action = "s3:GetObject"; Resource = "${aws_s3_bucket.frontend.arn}/*" }]
  })
}

resource "aws_secretsmanager_secret" "config" {
  name                    = "${var.project_name}/config-${terraform.workspace}"
  description             = "Runtime config for ${var.project_name} (${terraform.workspace})"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "config" {
  secret_id     = aws_secretsmanager_secret.config.id
  secret_string = jsonencode({ CORS_ORIGINS = "REPLACE_WITH_CLOUDFRONT_URL_AFTER_APPLY" })
  lifecycle { ignore_changes = [secret_string] }
}
```

🧠 **Q3.4** — The `lifecycle { ignore_changes = [secret_string] }` block prevents Terraform from ever overwriting the secret's value after its first creation. Explain why this is essential for secrets that are updated externally (e.g., via the CLI after deployment). What would happen on every `terraform apply` without this block?

```
Your answer:


```

---

### Step 3.5 — API Gateway and CloudFront

✏️ **Task 3.5a:** Create `infra/api_gateway.tf`. Complete the two missing route resources (Blank A: `POST /api`, Blank B: `GET /health`):

```hcl
resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api-gateway"
  protocol_type = "HTTP"
  cors_configuration {
    allow_headers = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    # Terraform resolves this reference automatically — CloudFront is created before
    # the API Gateway CORS setting is applied, so the correct URL is always used.
    allow_origins = ["https://${aws_cloudfront_distribution.main.domain_name}"]
    max_age       = 300
  }
  tags = { Project = var.project_name; ManagedBy = "terraform" }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# ✏️ Blank A: Create a route resource named "api_route" for POST /api
# Required arguments: api_id, route_key = "POST /api", target
_______________

# ✏️ Blank B: Create a route resource named "health_route" for GET /health using the same pattern
_______________

resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
```

✏️ **Task 3.5b:** Create `infra/cloudfront.tf`. Reference the complete CloudFront configuration from Activity 04 as your guide. Your distribution must:
- Use the S3 website endpoint as origin (`aws_s3_bucket_website_configuration.frontend.website_endpoint`), with **HTTP only** origin protocol
- Redirect HTTP viewers to HTTPS
- Return `/index.html` with status 200 for both 403 and 404 errors
- Use `PriceClass_100` (North America and Europe)

> **Important:** Name your CloudFront resource exactly `main` — i.e., `resource "aws_cloudfront_distribution" "main" { ... }` — so that the references in `outputs.tf` and `api_gateway.tf` resolve correctly.

---

### Step 3.6 — Update Backend Python Code for DynamoDB

Now that your Terraform configuration creates a DynamoDB table and Secrets Manager secret, your Python backend must be updated to actually use them. This mirrors what you built in Activity 04, Part 5.

✏️ **Task 3.6a:** Create `secrets.py` at your project root:

```python
# secrets.py — reads runtime configuration from AWS Secrets Manager.
# Results are cached per Lambda execution environment (cold start),
# so repeated calls within the same invocation incur no extra latency.

import boto3
import json
import os

_cache = {}


def get_secret(secret_name: str) -> dict:
    """Retrieve a secret from Secrets Manager and return it as a Python dict."""
    if secret_name in _cache:
        return _cache[secret_name]

    region = os.getenv("AWS_REGION", "us-east-1")
    client = boto3.client("secretsmanager", region_name=region)

    try:
        response = client.get_secret_value(SecretId=secret_name)
        secret_dict = json.loads(response["SecretString"])
        _cache[secret_name] = secret_dict
        return secret_dict
    except Exception as e:
        print(f"Warning: could not retrieve secret '{secret_name}': {e}")
        return {}
```

✏️ **Task 3.6b:** Create `dynamo_memory.py` at your project root:

```python
# dynamo_memory.py — stores and retrieves conversation history from DynamoDB.
# Uses lazy initialisation so the DynamoDB client is created once per
# Lambda execution environment and reused across warm invocations.

import boto3
import os
from datetime import datetime, timedelta
from typing import List, Dict

_table = None


def _get_table():
    """Return the DynamoDB Table object, initialising it on first call."""
    global _table
    if _table is None:
        dynamodb = boto3.resource(
            "dynamodb",
            region_name=os.getenv("AWS_REGION", "us-east-1")
        )
        _table = dynamodb.Table(os.getenv("DYNAMODB_TABLE", "myapp-dev-conversations"))
    return _table


def load_conversation(session_id: str) -> List[Dict]:
    """Load conversation history for a session. Returns [] if not found."""
    try:
        response = _get_table().get_item(Key={"session_id": session_id})
        return response.get("Item", {}).get("messages", [])
    except Exception as e:
        print(f"Error loading conversation: {e}")
        return []


def save_conversation(session_id: str, messages: List[Dict]) -> None:
    """Save conversation history. Sets a 30-day TTL for automatic cleanup."""
    try:
        ttl = int((datetime.utcnow() + timedelta(days=30)).timestamp())
        _get_table().put_item(Item={
            "session_id": session_id,
            "messages": messages,
            "updated_at": datetime.utcnow().isoformat(),
            "ttl": ttl
        })
    except Exception as e:
        print(f"Error saving conversation: {e}")
```

✏️ **Task 3.6c:** Update `server.py` to import and use both new modules. Apply the following three changes:

**Change 1 — Add imports near the top of `server.py`:**
```python
from fastapi.middleware.cors import CORSMiddleware
from dynamo_memory import load_conversation, save_conversation
from secrets import get_secret
```

**Change 2 — Replace the CORS configuration block:**

The CORS origins must now be read from Secrets Manager in production (where `USE_DYNAMODB = "true"`) and from the environment variable in local development:

```python
USE_DYNAMODB = os.getenv("USE_DYNAMODB", "false").lower() == "true"

if USE_DYNAMODB:
    config = get_secret(os.getenv("SECRET_NAME", "myapp/config-dev"))
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
```

**Change 3 — Add conversation load and save inside your chat/process endpoint:**

```python
@app.post("/api")
def process(
    record: InputRecord,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    session_id = record.session_id if hasattr(record, "session_id") else user_id

    # Load conversation history (empty list for new sessions)
    conversation = load_conversation(session_id) if USE_DYNAMODB else []

    # ... build prompts, call Bedrock, get assistant_response ...

    # Save updated conversation
    conversation.append({"role": "user",      "content": user_prompt_for(record)})
    conversation.append({"role": "assistant",  "content": assistant_response})
    if USE_DYNAMODB:
        save_conversation(session_id, conversation)

    return {"response": assistant_response, "session_id": session_id}
```

> ⚠️ If your `InputRecord` does not include a `session_id` field, add one as an optional field: `session_id: Optional[str] = None`. This allows the frontend to maintain conversation continuity across form submissions.

✅ **Checkpoint 3.6:** Test locally with `USE_DYNAMODB=false` (the default):
```bash
python3 -c "from server import app; print('server.py with DynamoDB support loaded')"
```

🧠 **Q3.6** — The `_get_table()` function in `dynamo_memory.py` uses a module-level variable (`_table`) and only initialises the DynamoDB client on the first call. This is called *lazy initialisation*. Explain what a Lambda "cold start" is and why this pattern reduces latency on warm invocations. What would happen to performance if you initialised the DynamoDB client inside `load_conversation()` instead?

```
Your answer:


```

---

### Step 3.7 — Repackage Your Lambda

Now that `server.py`, `dynamo_memory.py`, and `secrets.py` have all been updated, you must rebuild the ZIP before applying Terraform.

✏️ **Task 3.7:** From your project root, run your packaging script:

```bash
# Mac/Linux:
./infra/package.sh

# Windows:
.\infra\package.ps1
```

✅ **Checkpoint 3.7:**
```bash
ls -lh infra/lambda.zip   # 20–100 MB
unzip -l infra/lambda.zip | grep -E "server\.py|dynamo_memory\.py|secrets\.py|lambda_handler\.py"
# All four files should be listed
```

---

### Step 3.8 — Deploy with Terraform

✏️ **Task 3.8:** Validate and apply your Terraform configuration:

```bash
cd infra
terraform validate
# Expected: Success! The configuration is valid.

terraform plan
# Review the list of resources to be created

terraform apply
# Type "yes" when prompted — deployment takes 5–15 minutes (primarily CloudFront)
```

After `apply` completes, update the Secrets Manager secret with your actual CloudFront URL:

```bash
SECRET=$(terraform output -raw secret_name)
CF=$(terraform output -raw cloudfront_domain)

# Update if your aws_region variable is set to a different region than us-east-1
aws secretsmanager update-secret \
  --secret-id "$SECRET" \
  --secret-string "{\"CORS_ORIGINS\": \"https://${CF}\"}" \
  --region us-east-1
```

Then build and sync the frontend:

```bash
# First, update the API URL in your product page component (pages/product.tsx
# or whichever component makes the fetchEventSource call) with:
#   terraform output -raw api_gateway_url
# Replace only the base URL — keep the /api path at the end.

# Build from your project root (not from a frontend/ subdirectory)
npm run build
aws s3 sync out/ s3://$(terraform -chdir=infra output -raw frontend_bucket)/ --delete
```

✅ **Checkpoint 3.8:** Record all six `terraform output` values in your submission document:

```
api_gateway_url:      https://___________________________________
cloudfront_domain:    ___________________________________
dynamodb_table_name:  ___________________________________
frontend_bucket:      ___________________________________
lambda_name:          ___________________________________
secret_name:          ___________________________________
```

Confirm the application works end-to-end through your Terraform-managed CloudFront URL.

🔍 **Inspect 3.8:** Run `terraform plan` a second time immediately after a successful `terraform apply` with no code changes. Record what the plan output shows and explain why.

🧠 **Q3.8** — In Activity 03, you had to manually update the Lambda CORS environment variable after creating CloudFront because you did not yet know its URL. In your Terraform configuration (`api_gateway.tf`), the CORS `allow_origins` already contains the correct CloudFront URL from the moment `apply` completes. Explain exactly how Terraform achieves this automatically, naming the specific Terraform concept that makes resource-to-resource references possible.

```
Your answer:


```

---

## Part 4: CI/CD with GitHub Actions (15 points)

### Learning Goal
Automate the entire deployment pipeline — infrastructure provisioning, Lambda packaging, and frontend upload — so that pushing to `main` on GitHub triggers a complete deployment without any manual steps.

---

### Step 4.1 — Git Repository Setup

✏️ **Task 4.1:** Initialise a Git repository in your project root and push to GitHub:

```bash
cd YOUR-PROJECT-ROOT
git init -b main
git add .
git commit -m "Initial commit: full-stack AI SaaS with Terraform"
```

Create a **public** GitHub repository called `YOUR-APP-NAME`. Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR-APP-NAME.git
git push -u origin main
```

Confirm your `.gitignore` excludes: `.env`, `.env.local`, `terraform.tfstate*`, `.terraform/`, `lambda.zip`, `lambda_function.zip`, `node_modules/`, `out/`, `.next/`, `__pycache__/`, `*.pyc`.

✅ **Checkpoint 4.1:** Visit your repository on GitHub. Confirm no secrets, state files, or build artefacts are present.

---

### Step 4.2 — AWS IAM OIDC Role for GitHub Actions

✏️ **Task 4.2:** Create an IAM role that GitHub Actions can assume using OpenID Connect (no long-lived access keys required):

1. Check if the GitHub OIDC provider already exists in your account:
   ```bash
   aws iam list-open-id-connect-providers | grep token.actions.githubusercontent.com
   ```
2. If it does **not** exist, create it (if using the AWS Console, it fetches thumbprints automatically):
   ```bash
   aws iam create-open-id-connect-provider \
     --url https://token.actions.githubusercontent.com \
     --client-id-list sts.amazonaws.com \
     --thumbprint-list 1b511abead59c6ce207077c0bf0e0043b1382612
   ```
3. Create the IAM role with a trust policy scoped to your repository only:
   - Trusted entity type: Web identity
   - Identity provider: `token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
   - GitHub organisation/user: `YOUR_GITHUB_USERNAME`
   - Repository: `YOUR-APP-NAME`
4. Attach these managed policies to the role:
   `AWSLambda_FullAccess`, `AmazonS3FullAccess`, `AmazonAPIGatewayAdministrator`, `CloudFrontFullAccess`, `AmazonBedrockFullAccess`, `AmazonDynamoDBFullAccess`, `AWSCertificateManagerFullAccess`, `AmazonRoute53FullAccess`, `IAMReadOnlyAccess`
5. Attach the custom inline policy for IAM role management. This is the same policy defined in `github-oidc.tf` from the Week 2 Day 5 course materials — it grants permissions such as `iam:CreateRole`, `iam:DeleteRole`, `iam:AttachRolePolicy`, and `iam:PassRole` that Terraform needs to manage Lambda execution roles.

Note the role ARN — it looks like `arn:aws:iam::123456789012:role/github-actions-YOUR-APP-NAME`.

🧠 **Q4.2** — GitHub Actions OIDC authentication avoids storing long-lived AWS access keys as GitHub Secrets. Explain the security risk that long-lived access keys introduce and precisely how OIDC eliminates that risk. What does GitHub Actions receive instead of an access key, and how long is it valid?

```
Your answer:


```

---

### Step 4.3 — GitHub Secrets

✏️ **Task 4.3:** In your GitHub repository → **Settings** → **Secrets and variables** → **Actions**, add these three repository secrets:

| Secret Name | Value |
|---|---|
| `AWS_ROLE_ARN` | The full ARN of the IAM role from Step 4.2 |
| `DEFAULT_AWS_REGION` | `us-east-1` (or your chosen region) |
| `AWS_ACCOUNT_ID` | Your 12-digit AWS account ID |

✅ **Checkpoint 4.3:** Three secrets appear in your repository settings. No secret values are visible after saving.

---

### Step 4.4 — Create the Deployment Workflow

✏️ **Task 4.4:** Create `.github/workflows/deploy.yml`. This workflow must:

- Trigger automatically on push to `main`
- Also support manual trigger (`workflow_dispatch`) with an `environment` input (`dev` or `prod`)
- Use `aws-actions/configure-aws-credentials@v4` with OIDC (not access key)
- Run `terraform init` with S3 backend configuration if you set one up (see the Week 2 Day 5 course materials for S3 backend setup), or use local state if you did not
- Run `terraform apply -auto-approve` in the `dev` workspace
- Build the frontend with `npm run build` after injecting the API Gateway URL into `NEXT_PUBLIC_API_URL`
- Sync `out/` to the S3 frontend bucket (note: no `frontend/` subdirectory in a Vercel-based project)
- Create a CloudFront invalidation (`/*`) after the S3 sync

Use the deploy workflow structure from the Week 2 Day 5 course materials (`deploy.yml` and `deploy.sh`) as your template. Adapt it for your project structure — the key differences are that your project root is the Next.js project (no `frontend/` subdirectory) and your packaging scripts are in `infra/`.

🧠 **Q4.4** — Your GitHub Actions workflow runs `terraform apply -auto-approve` without a human reviewing the plan first. In a production environment at a real company, this would be considered risky. Describe the process a professional engineering team uses to safely apply Terraform changes — specifically, what happens between `terraform plan` and `terraform apply`, and which team members are involved.

```
Your answer:


```

---

### Step 4.5 — Trigger and Verify Automated Deployment

✏️ **Task 4.5:** Make a visible, intentional change to your application — for example, update the landing page headline or add a detail to your system prompt — then push to `main`:

```bash
git add .
git commit -m "Add [describe your change] — triggering CI/CD deployment"
git push
```

1. Go to your GitHub repository → **Actions** tab
2. Watch the workflow run in real time
3. Wait for it to complete (typically 8–15 minutes, mostly due to CloudFront)
4. Visit your CloudFront URL and confirm your change is live

✅ **Checkpoint 4.5:** Include a screenshot of the successful GitHub Actions workflow run in your submission document. The screenshot must show the green checkmark, the deployment summary step, and the CloudFront URL output.

🔍 **Inspect 4.5:** In the GitHub Actions run, click on the **"Apply Terraform"** step. Find the line that shows Terraform's summary of what changed. Record it in your submission document (it will look like: `Apply complete! Resources: 0 added, 1 changed, 0 destroyed.`).

---

## Part 5: Documentation, Reflection, and Presentation (15 points)

### Step 5.1 — Create `README.md`

✏️ **Task 5.1:** Your repository must contain a professional `README.md` that covers:

1. **Project title and one-sentence description**
2. **Screenshot** of your working application (the product page with a result shown)
3. **Live demo link** (your CloudFront URL)
4. **Technology stack** — list every major tool and service used
5. **Architecture overview** — your diagram or description from Step 0.3, updated to reflect any changes made during implementation
6. **Local development setup** — exact commands to clone, install dependencies, configure `.env.local`, and run locally
7. **Deployment** — how to deploy using Terraform and GitHub Actions (2–3 sentences each)
8. **API endpoints** — document every endpoint with method, path, request body schema, and response schema
9. **Known limitations** — at least two honest limitations of your current implementation, and how you would address them in a production system with real users
10. **Future improvements** — two features you would add next if this were a real product

---

### Step 5.2 — Course Reflection

Answer the following questions in your submission document. These questions assess your ability to synthesise your learning across the full semester. Superficial answers will not receive full marks — graders are looking for specificity and evidence that you built and thought about the system yourself.

🧠 **Q5.1** — Compare your **Vercel deployment** (Part 1) to your **AWS deployment** (Parts 2–4) for your specific application. For your use case and expected user load (assume 100 users per day), which deployment model would you choose for a real product launch, and why? Consider cost, maintenance overhead, latency, and developer experience in your answer.

```
Your answer:


```

🧠 **Q5.2** — In Activity 02 you built an IT Help Desk resolver for a prescribed domain. In this final project you built for your own domain. Describe the **specific decisions** you made in your system prompt and Pydantic model that are unique to your domain — decisions that would not apply to the help desk application. What do these decisions reveal about how prompt engineering and data modelling must be adapted per domain?

```
Your answer:


```

🧠 **Q5.3** — You have now used both **file-based memory** (Activity 03, local JSON files), **S3-based memory** (Activity 03, cloud JSON files), and **DynamoDB** (Activity 04, NoSQL table with TTL). For your chosen application, which storage backend is the best long-term choice, and why? Be specific about the read/write patterns, data volume, query needs, and cost implications of your use case.

```
Your answer:


```

🧠 **Q5.4** — Reflect on Infrastructure as Code. Before this course, you likely configured cloud services through web consoles. After completing Activities 03, 04, and this final project, describe two concrete situations in a real engineering team where Terraform would prevent a serious incident that manual console management could not.

```
Your answer:


```

🧠 **Q5.5** — Think about the full CI/CD pipeline you built in Part 4. If a deployment fails at the `terraform apply` step — for example, because AWS rejects one of your resource configurations — describe exactly what state your infrastructure is in. Is it broken, partially deployed, or unchanged? What does Terraform do to recover, and what would you need to do manually (if anything)?

```
Your answer:


```

---

### Step 5.3 — Live Demo Preparation

Your instructor may conduct a brief **5-minute live demo review** during the final week. You should be prepared to:

1. Open your CloudFront URL in a browser and demonstrate the full user journey (landing → sign in → subscribe → submit form → receive the AI-generated response)
2. Show your GitHub Actions workflow and point to the most recent successful run
3. Show your Terraform state (`terraform state list`) and identify 3–4 resources
4. Explain one design decision you made and one thing you would change if you had more time

No slides are required. Your deployed application is the presentation.

---

## Additional Challenges (Bonus — up to 10 points)

> **Important:** Bonus marks are intended to compensate for marks lost elsewhere in the project. The overall project grade is **capped at 100%** regardless of how many bonus challenges are completed.

---

### Bonus A — Production Environment with Custom Domain (+4 points)

Deploy a second Terraform workspace called `prod` and configure a custom domain via AWS Route 53 and ACM. Follow the optional custom domain pattern from the Week 2 Day 4 course materials. Your `prod` deployment must:

- Use a different DynamoDB table and Secrets Manager secret than `dev`
- Have a registered domain pointing to the CloudFront distribution
- Use `global.amazon.nova-2-lite-v1:0` or `global.amazon.nova-2-pro-v1:0` (rather than micro) in the `prod` workspace

🧠 **Q-A.1** — A company maintains both `dev` and `prod` environments. A critical bug is discovered in `dev`. Describe the exact Terraform and GitHub Actions steps you would take to safely push the fix to `prod` without disrupting active users or losing conversation history.

```
Your answer:


```

---

### Bonus B — Real-Time Streaming via Bedrock (+3 points)

AWS Bedrock fully supports streaming via `converse_stream()`. Replace your standard `converse()` call in `server.py` with a streaming implementation that returns a `StreamingResponse` using Server-Sent Events, and update your product page component to consume the SSE stream using `fetchEventSource`.

🧠 **Q-B.1** — Streaming responses improve perceived performance even when total response time is unchanged. Explain why users perceive a streaming response as faster than a non-streaming response of equivalent total length. What does this tell you about the relationship between latency and user experience?

```
Your answer:


```

---

### Bonus C — CloudWatch Monitoring Dashboard (+2 points)

Create `infra/monitoring.tf` that defines:
- An SNS topic and an email subscription (your email address) for alarm notifications
- A CloudWatch alarm triggered when your Lambda produces any errors (`Errors` metric > 0)
- At least one additional Lambda metric tracked (Duration, Throttles, or ConcurrentExecutions)

> ⚠️ **SNS email confirmation:** After `terraform apply`, AWS sends a confirmation email to your address. You must click the confirmation link before the subscription becomes active and alerts are delivered. Check your spam folder if the email does not arrive within a few minutes.

🧠 **Q-C.1** — Your CloudWatch alarm triggers on the first Lambda error. Describe a real scenario at your application's scale (100 users/day) where triggering on every single error would result in alert fatigue, and explain how you would adjust the threshold or evaluation period to make the alert more actionable.

```
Your answer:


```

---

### Bonus D — Conversation History Endpoint (+1 point)

Add a `GET /conversation/{session_id}` endpoint to `server.py` that returns the full conversation history stored in DynamoDB for that session. Update your product page component to store the `session_id` in `localStorage` on first response and restore the conversation when the user returns.

🧠 **Q-D.1** — Storing the `session_id` in `localStorage` allows conversation restoration across browser sessions. Name two specific privacy concerns this raises for your application's domain (e.g., if your domain involves personal financial or legal information) and describe how you would address them.

```
Your answer:


```

---

## Submission Checklist

Work through every item below before submitting. Submissions missing the first four items will not be graded regardless of content.

| Item | Done? |
|------|-------|
| Submission file is `.ipynb`, `.py`, `.md`, `.pdf`, or `.docx` — not a `.zip`, GitHub link, or folder | ☐ |
| Your full name appears in the filename (e.g., `FinalProject_AIE1018_YourName.md`) | ☐ |
| GitHub repository URL included and the repository is public | ☐ |
| CloudFront production URL included and the application is fully functional | ☐ |
| **Domain selection:** Q-Domain.1 and Q-Domain.2 answered with specificity | ☐ |
| **Part 0:** `InputRecord` model table; system prompt (200+ words); architecture diagram; Q0.1 and Q0.2 answered | ☐ |
| **Part 1:** Backend endpoint with SSE streaming and `/health` endpoint implemented; frontend form with all required elements; Clerk auth and subscription gate; Vercel URL recorded; Q1.2, Q1.4, Q1.5 answered | ☐ |
| **Part 2:** `server.py` created at project root; `requirements.txt` updated (openai removed, boto3 and mangum added); Bedrock integration; `lambda_handler.py` created; `infra/package.sh` (or `.ps1`) created and run; `infra/lambda.zip` verified; Lambda deployed with correct handler, 30-second timeout, all env vars including `CLERK_JWKS_URL`; API Gateway configured; CloudFront created; CORS tightened; both URLs recorded; Q2.0, Q2.1, Q2.2, Q2.3 answered | ☐ |
| **Part 3:** All seven `.tf` files created and syntactically correct (`terraform validate` passes); `terraform.tfvars` includes `clerk_jwks_url`; `dev` workspace created before validate; `secrets.py` and `dynamo_memory.py` created; `server.py` updated with DynamoDB load/save and Secrets Manager CORS; Lambda repackaged; `terraform apply` completed; all six output values recorded; Secrets Manager updated with CloudFront URL; frontend built and synced to S3 bucket; Q3.2, Q3.3, Q3.4, Q3.6, Q3.8 answered | ☐ |
| **Part 4:** GitHub repository initialised; no secrets or state files in repo; OIDC IAM role created; three GitHub Secrets added; `deploy.yml` workflow created; automated deployment triggered and succeeded; workflow screenshot included; Inspect 4.5 recorded; Q4.2, Q4.4 answered | ☐ |
| **Part 5:** `README.md` contains all 10 required sections; Q5.1–Q5.5 answered in prose (not code comments) | ☐ |
| At least **one** Additional Challenge completed (if pursuing bonus marks) | ☐ |
| All written answers are in prose — not code comments | ☐ |
| Screenshot of working application (product page with AI output visible) included | ☐ |
| Screenshot of successful GitHub Actions workflow run included | ☐ |

---

## Grading Rubric

| **Criteria** | **Points** | **Description** |
|---|---|---|
| **Domain Selection and Proposal (Part 0)** | 5 | `InputRecord` model is well-designed with at least five correctly typed fields. System prompt is 200+ words with clear section definitions and tone guidance per section. Architecture diagram covers all components with labelled connections. Q-Domain.1, Q-Domain.2, Q0.1, Q0.2 answered with specificity. |
| **Full-Stack Vercel Application (Part 1)** | 25 | Backend streaming endpoint implements SSE correctly and includes a `/health` endpoint. Pydantic model field names match the frontend's JSON payload. System and user prompts produce meaningful, structured output. Frontend form has all required input types and correctly maps camelCase state to snake_case JSON. Clerk auth and subscription gate are functional in production. Vercel URL is live and working. Q1.2, Q1.4, Q1.5 demonstrate understanding. |
| **AWS Deployment (Part 2)** | 20 | `server.py` created at project root. `requirements.txt` updated correctly. Bedrock replaces OpenAI. `lambda_handler.py` uses `from server import app`. Packaging script (`package.sh` or `package.ps1`) provided and run. Lambda deployed with correct handler (`lambda_handler.handler`), 30-second timeout, all environment variables including `CLERK_JWKS_URL`. API Gateway configured with correct routes. CloudFront uses HTTP only origin policy. CORS tightened. Q2.0, Q2.1, Q2.2, Q2.3 demonstrate understanding. |
| **Terraform IaC (Part 3)** | 20 | All seven `.tf` files created and valid (`terraform validate` passes). `clerk_jwks_url` variable defined and used. Policy ARN blanks and route blanks correctly filled. DynamoDB TTL block and S3 bucket name pattern correct. `secrets.py` and `dynamo_memory.py` created. `server.py` updated with Secrets Manager CORS and DynamoDB load/save. Lambda repackaged and `terraform apply` completes in `dev` workspace. All six outputs recorded. Secret updated. Frontend deployed. Q3.2, Q3.3, Q3.4, Q3.6, Q3.8 demonstrate understanding. |
| **CI/CD with GitHub Actions (Part 4)** | 15 | GitHub repository public with no committed secrets or state files. OIDC IAM role correctly configured for the repository. Three GitHub Secrets present. `deploy.yml` workflow triggers on push to `main`, authenticates via OIDC, applies Terraform, builds frontend from project root, syncs `out/` to S3, and invalidates CloudFront cache. Successful run screenshot included. Q4.2, Q4.4 demonstrate understanding. |
| **Documentation and Reflection (Part 5)** | 15 | `README.md` contains all 10 required sections with accurate, specific content. Q5.1–Q5.5 demonstrate genuine synthesis of the semester's learning — answers are specific to the student's application, not generic. Reflection answers show evidence of having built and reasoned about the system personally. |
| **TOTAL** | **100** | |

### Grade Scale

| Grade | Score | Level |
|---|---|---|
| A | 80–100 | Excellent |
| B | 70–79 | Good |
| C | 60–69 | Satisfactory |
| D | 50–59 | Marginal Pass |
| F | 0–49 | Fail |

### Bonus Mark Breakdown

| Challenge | Points | Cap |
|---|---|---|
| Bonus A — Production environment with custom domain | +4 | |
| Bonus B — Real-time Bedrock streaming via `converse_stream()` | +3 | |
| Bonus C — CloudWatch monitoring dashboard with SNS alerts | +2 | |
| Bonus D — Conversation history endpoint with localStorage | +1 | |
| **Maximum bonus** | **+10** | **Total grade capped at 100%** |

> Bonus marks are intended to compensate for marks lost elsewhere in the project. Completing all four bonus challenges cannot raise a grade above 100%. The final project grade is always reported out of 100.

---

## Common Issues and Fixes

| Problem | Most Likely Cause | Fix |
|---|---|---|
| `ModuleNotFoundError` after Lambda upload (Mac M-chip) | Packages compiled for Apple Silicon, not Linux x86_64 | Use the `--platform manylinux2014_x86_64 --only-binary=:all:` flags in `package.sh` |
| `ModuleNotFoundError: No module named 'server'` | `server.py` was not included in the ZIP | Verify `cp *.py package/` runs from the project root where `server.py` lives; check with `unzip -l infra/lambda.zip \| grep server.py` |
| `422 Unprocessable Entity` from FastAPI | camelCase frontend field name does not match snake_case Pydantic field | Check `JSON.stringify({...})` in `fetchEventSource` — every key must match the Pydantic model exactly |
| `401 / 403` on all `/api` requests | `CLERK_JWKS_URL` environment variable is missing or incorrect in Lambda | Verify it is set in both the Lambda console (Part 2) and in `terraform.tfvars` and `lambda.tf` (Part 3) |
| `504 Gateway Timeout` | CloudFront origin protocol is HTTPS instead of HTTP only, OR Lambda timeout is 3 seconds | Set CloudFront origin to HTTP only; set Lambda timeout to 30 seconds |
| CORS error in browser console | `CORS_ORIGINS` value in Secrets Manager is wrong | Verify it is exactly `https://d1234.cloudfront.net` — starts with `https://`, no trailing slash |
| `terraform validate` fails | Missing `}`, wrong attribute name, or a referenced file does not exist yet | Read the error — Terraform reports the exact file and line number |
| `Error: lambda.zip: no such file` during `terraform plan/apply` | Packaging script was not run, or run from the wrong directory | Run `./infra/package.sh` from the project root; verify `infra/lambda.zip` exists |
| `SecretAlreadyExists` during `terraform apply` | A Secrets Manager secret with this name exists from a previous attempt | Go to Secrets Manager in the console → delete the old secret → re-apply |
| GitHub Actions fails: `Error: Could not assume role` | OIDC trust policy does not match the exact GitHub repository path | Verify the trust condition uses your exact `username/repo-name` and `sts.amazonaws.com` audience |
| Bedrock `ThrottlingException` | Regional quota exceeded | Confirm `bedrock_model_id` uses the `global.` prefix; if throttling persists, request a quota increase via AWS Service Quotas → Amazon Bedrock |
| Bedrock `ValidationException` on model ID | AWS has updated the version number in the model ID | Check the current model ID format in the [Bedrock model catalogue](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html) and update `terraform.tfvars` |
| CloudFront shows stale content after S3 sync | Cache not invalidated | Run `aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"`, or verify your workflow includes this step automatically |
| DynamoDB item missing after conversation | `DYNAMODB_TABLE` env var does not match the actual table name | Run `terraform output dynamodb_table_name` and compare to the Lambda environment variable |
| Frontend `out/` not created by `npm run build` | `next.config.ts` missing `output: 'export'` | Add `output: 'export'` and `images: { unoptimized: true }` to `next.config.ts` |
| SNS alarm notifications not arriving | Email subscription not confirmed | Check your inbox (and spam folder) for an AWS SNS confirmation email and click the confirmation link |
