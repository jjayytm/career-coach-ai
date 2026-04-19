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
