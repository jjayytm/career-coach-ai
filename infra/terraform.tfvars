aws_region       = "us-east-1"
project_name     = "job-coach"
environment      = "dev"
bedrock_model_id = "global.amazon.nova-2-lite-v1:0"
lambda_timeout   = 30
clerk_jwks_url   = "https://obliging-sailfish-72.clerk.accounts.dev/.well-known/jwks.json"
# Replace the clerk_jwks_url above with your actual JWKS URL from the Clerk Dashboard
# (Configure → API Keys → JWKS URL)
