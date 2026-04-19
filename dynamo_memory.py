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
        _table = dynamodb.Table(os.getenv("DYNAMODB_TABLE", "job-coach-dev-conversations"))
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
