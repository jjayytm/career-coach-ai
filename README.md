# CareerCoach AI

An AI-powered job application coaching SaaS that transforms a resume and job description into tailored bullet points, a personalised cover letter, and role-specific interview preparation tips — in seconds.

## Screenshot

> *(Screenshot of the product page with a full coaching report visible — to be added after deployment)*

## Live Demo

**CloudFront URL:** `https://YOUR-CLOUDFRONT-DOMAIN.cloudfront.net`

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React 18, TypeScript |
| Backend | FastAPI (Python 3.12) |
| AI Model | AWS Bedrock — `global.amazon.nova-2-lite-v1:0` |
| Authentication | Clerk (JWT, subscription gating) |
| Conversation Memory | Amazon DynamoDB (with 30-day TTL) |
| Secrets Management | AWS Secrets Manager |
| Frontend Hosting | Amazon S3 + Amazon CloudFront |
| Backend Runtime | AWS Lambda (via Mangum ASGI adapter) |
| API Routing | Amazon API Gateway v2 (HTTP API) |
| Infrastructure as Code | Terraform (HCL) |
| CI/CD | GitHub Actions (OIDC authentication) |
| Vercel Deployment | Vercel (Part 1 — parallel deployment) |

## Architecture Overview

```
User Browser
    │
    ├─ HTTPS ──► CloudFront (cdn.cloudfront.net)
    │                │ HTTP only (internal AWS network)
    │                └──► S3 Static Website (Next.js export)
    │
    └─ HTTPS ──► API Gateway v2 (HTTP API)
                     │ AWS SDK (Lambda Invoke)
                     └──► Lambda Function (FastAPI + Mangum)
                               │
                               ├─ AWS SDK ──► Bedrock (Nova 2 Lite)
                               ├─ AWS SDK ──► DynamoDB (conversation history)
                               └─ AWS SDK ──► Secrets Manager (CORS config)

Authentication: Clerk JWT verified in Lambda before every /api request
Infrastructure: Managed by Terraform in 'dev' workspace
CI/CD: GitHub Actions triggers on push to main, authenticates via OIDC
```

## Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/career-coach-ai.git
cd career-coach-ai

# 2. Install Node.js dependencies
npm install

# 3. Install Python dependencies
pip install -r requirements.txt
pip install openai  # needed for local dev (Vercel deployment)

# 4. Create environment file
cat > .env.local << 'EOF'
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY
CLERK_JWKS_URL=https://YOUR-APP.clerk.accounts.dev/.well-known/jwks.json
OPENAI_API_KEY=sk-YOUR_OPENAI_KEY
EOF

# 5. Run the Next.js development server
npm run dev

# 6. In a second terminal, run the FastAPI backend
uvicorn api.index:app --reload --port 8000
```

Visit `http://localhost:3000` for the frontend and `http://localhost:8000/docs` for the FastAPI docs.

## Deployment

### Terraform (AWS)

```bash
# Package the Lambda function
./infra/package.sh          # Mac/Linux
# .\infra\package.ps1       # Windows

# Initialise Terraform and apply
cd infra
terraform init
terraform workspace new dev
terraform apply

# After apply, update CORS secret with CloudFront URL
SECRET=$(terraform output -raw secret_name)
CF=$(terraform output -raw cloudfront_domain)
aws secretsmanager update-secret \
  --secret-id "$SECRET" \
  --secret-string "{\"CORS_ORIGINS\": \"https://${CF}\"}"

# Build and sync frontend
cd ..
npm run build
aws s3 sync out/ s3://$(cd infra && terraform output -raw frontend_bucket)/ --delete
```

### GitHub Actions (CI/CD)

Every push to `main` automatically triggers:
1. Lambda repackaging and upload
2. `terraform apply` in the `dev` workspace
3. Next.js build with injected API URL
4. S3 sync and CloudFront cache invalidation

Configure three repository secrets: `AWS_ROLE_ARN`, `DEFAULT_AWS_REGION`, `AWS_ACCOUNT_ID`.

## API Endpoints

### `GET /health`

Returns service health status.

**Response:**
```json
{ "status": "healthy", "version": "1.0" }
```

### `POST /api`

Analyses a job application and returns structured coaching.

**Headers:**
```
Authorization: Bearer <Clerk JWT>
Content-Type: application/json
```

**Request body:**
```json
{
  "job_description": "string (min 50 chars)",
  "resume_text":     "string (min 50 chars)",
  "target_role":     "string (max 100 chars)",
  "years_experience": 0,
  "target_company":  "string (max 100 chars)",
  "applicant_email": "user@example.com",
  "session_id":      "optional string"
}
```

**Response (Vercel / OpenAI):** `text/event-stream` — SSE chunks  
**Response (AWS / Bedrock):** `application/json`
```json
{ "response": "## Tailored Resume Bullet Points\n...", "session_id": "string" }
```

**Error responses:**
- `401` — Missing or invalid Clerk JWT
- `422` — Request body validation failed (field name mismatch or constraint violation)
- `502` — Bedrock API error

## Known Limitations

1. **Non-streaming AWS response:** The AWS/Bedrock deployment uses `converse()` (non-streaming), so users wait for the full response before seeing any output. For a production launch, this would be replaced with `converse_stream()` and Server-Sent Events to match the Vercel experience. This is addressed in Bonus B.

2. **Single-turn analysis:** Each form submission is treated as an independent analysis. While conversation history is saved to DynamoDB, the current UI does not allow follow-up questions or iterative refinement within the same session. A future version would render prior exchanges and allow the user to ask follow-up questions.

## Future Improvements

1. **LinkedIn profile import:** Allow users to paste their LinkedIn profile URL and have the backend scrape and parse it automatically, eliminating the manual copy-paste step for the resume field.

2. **Application tracker dashboard:** Add a history view showing all past analyses, the companies applied to, and a status field (Applied / Interview / Offer / Rejected) so users can track their entire job search from one place.
