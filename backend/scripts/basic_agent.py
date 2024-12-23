import sys
import json
import os
import re
import hashlib
import asyncio
from dotenv import load_dotenv
from openai import OpenAI
import logging
import argparse

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Set up OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def get_cache_key(query: str, bot_name: str) -> str:
    """Generate a unique cache key."""
    return hashlib.md5(f"{bot_name}:{query}".encode()).hexdigest()

def construct_system_prompt(bot_metadata: dict) -> str:
    """Constructs a comprehensive system prompt using all bot metadata."""
    
    # Basic identity and role
    prompt = f"""You are {bot_metadata['username']}, a {bot_metadata['botRole']} specialist.

Bio: {bot_metadata['bio']}

{bot_metadata['botPersonality']}

Core Guidelines:
1. Always maintain the personality and expertise defined above
2. Provide responses that align with your specified role and expertise
3. Use a tone and style consistent with your character
4. Never break character or refer to yourself as an AI
5. Leverage your specific expertise while remaining helpful and approachable

When responding:
1. Draw from your defined expertise and background
2. Maintain consistency with your bio and personality
3. Format responses appropriately for your role
4. Stay focused on your specialized domain
"""
    
    return prompt

def get_basic_agent_response(query: str, bot_metadata: dict, context_messages: list) -> str:
    """Generate a response using comprehensive bot metadata."""
    
    system_prompt = construct_system_prompt(bot_metadata)
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": query}
    ]

    if context_messages:
        messages = context_messages + messages

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.8,
            max_tokens=8000
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"An error occurred while generating response: {str(e)}")
        return f"An error occurred while generating the response: {str(e)}"

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('query', help='User query')
    parser.add_argument('bot_metadata', help='Bot metadata as JSON string')
    parser.add_argument('context_messages', help='Context messages as JSON string')
    args = parser.parse_args()

    try:
        query = args.query
        bot_metadata = json.loads(args.bot_metadata)
        context_messages = json.loads(args.context_messages)

        logger.info(f"Received query: {query}")
        logger.info(f"Bot metadata: {json.dumps(bot_metadata, indent=2)}")

        response = get_basic_agent_response(query, bot_metadata, context_messages)
        print(json.dumps({"response": response}))
    except Exception as e:
        logger.error(f"Unexpected Error: {str(e)}", exc_info=True)
        print(json.dumps({"error": f"An unexpected error occurred: {str(e)}"}))
