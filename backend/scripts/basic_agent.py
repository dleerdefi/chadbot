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

def get_basic_agent_response(query: str, bot_name: str, context_messages: list) -> str:
    """Generate a response from the basic agent using the provided query and context messages."""
    
    # Use the botPersonality from the context or define it here
    # For simplicity, assuming bot_name is used as botPersonality
    personality = f"You are {bot_name}, a helpful assistant."

    messages = [
        {"role": "system", "content": personality},
        {"role": "user", "content": query}
    ]

    # Append context messages if provided
    if context_messages:
        messages = context_messages + messages

    try:
        # Query OpenAI GPT model
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.8,
            max_tokens=3500  # Adjust as needed for detailed responses
        )
        response_content = response.choices[0].message.content.strip()

        logger.info("Generated response from OpenAI.")

        return response_content
    except Exception as e:
        logger.error(f"An error occurred while generating response: {str(e)}")
        return f"An error occurred while generating the response: {str(e)}"

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process query, bot_name, and context_messages.')
    parser.add_argument('query', help='User query')
    parser.add_argument('bot_name', help='Bot name')
    parser.add_argument('context_messages', help='Context messages as JSON string')
    args = parser.parse_args()

    query = args.query
    bot_name = args.bot_name
    context_messages = json.loads(args.context_messages)

    logger.info(f"Received query: {query}")
    logger.info(f"Bot name: {bot_name}")

    try:
        # Get the response
        response = get_basic_agent_response(query, bot_name, context_messages)

        print(json.dumps({"response": response}))
    except Exception as e:
        logger.error(f"Unexpected Error: {str(e)}", exc_info=True)
        print(json.dumps({"error": f"An unexpected error occurred: {str(e)}"}))
