import sys
import json
import os
import re
import hashlib
import asyncio
from dotenv import load_dotenv
from pinecone import Pinecone as PineconeClient
from llama_index import VectorStoreIndex, StorageContext
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.voyageai import VoyageEmbedding
from llama_index.llms.openai import OpenAI
import logging
import argparse

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Set API keys
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
PINECONE_ENVIRONMENT = os.getenv('PINECONE_ENVIRONMENT')
PINECONE_INDEX_NAME = os.getenv('PINECONE_INDEX_NEAR_DEVELOPMENT')
VOYAGE_API_KEY = os.getenv('VOYAGE_API_KEY')

# Initialize Pinecone
pc = PineconeClient(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

try:
    stats = index.describe_index_stats()
    logger.info(f"Successfully connected to Pinecone. Index stats: {stats}")
except Exception as e:
    logger.error(f"Failed to connect to Pinecone: {str(e)}")

# Set up embeddings
embed_model = VoyageEmbedding(
    model_name="voyage-code-2",
    voyage_api_key=VOYAGE_API_KEY,
    embed_batch_size=72,
    truncation=True
)

# Initialize Pinecone vector store
vector_store = PineconeVectorStore(pinecone_index=index)

# Load the LlamaIndex
storage_context = StorageContext.from_defaults(vector_store=vector_store)
llama_index = VectorStoreIndex.from_vector_store(vector_store, embed_model=embed_model)

def read_bot_personalities():
    current_dir = os.path.dirname(__file__)
    bots_file_path = os.path.join(current_dir, '..', 'bots.js')

    try:
        with open(bots_file_path, 'r') as file:
            content = file.read()
    except FileNotFoundError as e:
        logger.error(f"File not found: {bots_file_path}")
        raise e

    bot_data = re.findall(r'{[\s\S]*?botUsername:\s*[\'"](\w+)[\'"][\s\S]*?botPersonality:\s*`([\s\S]*?)`[\s\S]*?}', content)
    return {username: personality.strip() for username, personality in bot_data}

async def get_rag_response(query, bot_name, context_messages):
    try:
        logger.info(f"Processing query: '{query}' for bot: {bot_name}")

        # Use context_messages passed from Node.js
        context = context_messages  # Expecting a list of messages with 'role' and 'content'

        rag_needed = await needs_rag_query(query, context)
        logger.info(f"RAG query needed: {rag_needed}")

        if rag_needed:
            kb_context = await perform_rag_retrieval(query)
            logger.info(f"DEBUG: RAG retrieval result: {kb_context[:500]}...")
        else:
            kb_context = "No additional information retrieved from the knowledge base."

        bot_personalities = read_bot_personalities()
        bot_personality = bot_personalities.get(bot_name, "")

        prompt = f"""{bot_personality}

You are an AI agent specialized in {bot_name}. A user has come to you for expert advice on: "{query}".
{"Review the knowledge base information below and formulate a response." if rag_needed else "Formulate a response based on your knowledge."}

{"Knowledge Base Context:" if rag_needed else ""}
{kb_context if rag_needed else ""}

Previous conversation:
{format_context(context)}

Now, please respond to the user's latest query: "{query}"
As {bot_name}, consider the entire conversation history when formulating your response.
"""

        logger.info(f"DEBUG: Prompt sent to OpenAI: {prompt[:500]}...")
        llm = OpenAI(model="gpt-4", temperature=0.3)
        response = llm.complete(prompt)

        logger.info(f"DEBUG: Response from OpenAI: {response.text[:500]}...")

        return {
            "rag_performed": rag_needed,
            "response": response.text
        }

    except Exception as e:
        logger.error(f"Error in get_rag_response: {str(e)}", exc_info=True)
        return {
            "rag_performed": False,
            "response": f"An error occurred while processing your request: {str(e)}"
        }

async def needs_rag_query(query, context):
    llm = OpenAI(model="gpt-3.5-turbo", temperature=0.3)
    prompt = f"""As an AI agent, determine if a new information retrieval (RAG query) is needed to accurately answer the user query. Respond with ONLY 'YES' or 'NO', followed by a brief explanation.

User Query: "{query}"

Recent Conversation Context:
{format_recent_context(context)}

Decision (YES/NO):
"""
    response = llm.complete(prompt)
    decision = response.text.strip().split('\n')[0].lower()
    logger.info(f"RAG query decision: {decision}")
    return decision.startswith("yes")

def format_recent_context(context):
    recent_messages = context[-5:] if len(context) > 5 else context
    return "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in recent_messages])

async def perform_rag_retrieval(query):
    logger.info("Performing RAG retrieval...")
    retriever = llama_index.as_retriever(similarity_top_k=10)
    nodes = retriever.retrieve(query)
    
    if not nodes:
        return "No specific information found in the knowledge base for this query."
    else:
        return "\n\n".join([f"Document {i+1}: {node.text}" for i, node in enumerate(nodes[:5])])

def format_context(context):
    return "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in context])

def parse_arguments():
    parser = argparse.ArgumentParser(description='Process query, bot_name, and context_messages.')
    parser.add_argument('query', help='User query')
    parser.add_argument('bot_name', help='Bot name')
    parser.add_argument('context_messages', help='Context messages as JSON string')
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_arguments()
    query = args.query
    bot_name = args.bot_name
    context_messages = json.loads(args.context_messages)

    logger.info(f"Received query: {query}")
    logger.info(f"Bot name: {bot_name}")

    try:
        result = asyncio.run(get_rag_response(query, bot_name, context_messages))
        print(json.dumps(result))
    except Exception as e:
        logger.error(f"Unexpected Error: {str(e)}", exc_info=True)
        print(json.dumps({"rag_performed": False, "response": f"An unexpected error occurred: {str(e)}"}))
