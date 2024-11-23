import asyncio
import json
import os
import re
import logging
import sys
from typing import List, TypedDict
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel, Field
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph, START
from llama_index import VectorStoreIndex, StorageContext
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.voyageai import VoyageEmbedding
from pinecone import Pinecone as PineconeClient

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Update these constants to use environment variables
MAX_CONTEXT_MESSAGES = int(os.getenv('MAX_CONTEXT_MESSAGES', 5))

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

# Define the code generation prompt
code_gen_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a coding assistant with expertise in NEAR Protocol development. 
Answer the user question based on the provided documentation and context. Ensure any code you provide can be executed
with all required imports and variables defined. Structure your answer with a description of the code solution,
then list the imports, and finally list the functioning code block. Here is the user question:"""),
    ("placeholder", "{messages}"),
])

# Define the code output structure
class Code(BaseModel):
    """Code output for NEAR Protocol development"""
    prefix: str = Field(description="Description of the problem and approach")
    imports: str = Field(description="Code block import statements")
    code: str = Field(description="Code block not including import statements")
    description = "Schema for code solutions to questions about NEAR Protocol development."

# Set up the LLM
llm = ChatOpenAI(temperature=0, model="gpt-4")
code_gen_chain = code_gen_prompt | llm.with_structured_output(Code)

# Define the graph state
class GraphState(TypedDict):
    error: str
    messages: List
    generation: str
    iterations: int

# Define graph nodes
def generate(state: GraphState):
    print("---GENERATING CODE SOLUTION---")
    messages = state["messages"]
    iterations = state["iterations"]
    error = state["error"]

    if error == "yes":
        messages += [
            ("user", "Now, try again. Invoke the code tool to structure the output with a prefix, imports, and code block:")
        ]

    code_solution = code_gen_chain.invoke({"messages": messages})
    messages += [
        ("assistant", f"{code_solution.prefix} \n Imports: {code_solution.imports} \n Code: {code_solution.code}")
    ]

    iterations += 1
    return {"generation": code_solution, "messages": messages, "iterations": iterations}

def code_check(state: GraphState):
    print("---CHECKING CODE---")
    messages = state["messages"]
    code_solution = state["generation"]
    iterations = state["iterations"]

    imports = code_solution.imports
    code = code_solution.code

    try:
        exec(imports)
    except Exception as e:
        print("---CODE IMPORT CHECK: FAILED---")
        error_message = [("user", f"Your solution failed the import test: {e}")]
        messages += error_message
        return {
            "generation": code_solution,
            "messages": messages,
            "iterations": iterations,
            "error": "yes",
        }

    try:
        exec(imports + "\n" + code)
    except Exception as e:
        print("---CODE BLOCK CHECK: FAILED---")
        error_message = [("user", f"Your solution failed the code execution test: {e}")]
        messages += error_message
        return {
            "generation": code_solution,
            "messages": messages,
            "iterations": iterations,
            "error": "yes",
        }

    print("---NO CODE TEST FAILURES---")
    return {
        "generation": code_solution,
        "messages": messages,
        "iterations": iterations,
        "error": "no",
    }

# Define edge functions
def decide_to_finish(state: GraphState):
    error = state["error"]
    iterations = state["iterations"]

    if error == "no" or iterations == 3:  # Max 3 iterations
        print("---DECISION: FINISH---")
        return "end"
    else:
        print("---DECISION: RE-TRY SOLUTION---")
        return "generate"

# Set up the graph
def setup_qc_graph():
    workflow = StateGraph(GraphState)

    workflow.add_node("generate", generate)
    workflow.add_node("check_code", code_check)

    workflow.add_edge(START, "generate")
    workflow.add_edge("generate", "check_code")
    workflow.add_conditional_edges(
        "check_code",
        decide_to_finish,
        {
            "end": END,
            "generate": "generate",
        },
    )

    return workflow.compile()

# RAG-related functions
async def perform_rag_retrieval(query):
    logger.info("Performing RAG retrieval...")
    retriever = llama_index.as_retriever(similarity_top_k=10)
    nodes = retriever.retrieve(query)
    
    if not nodes:
        return "No specific information found in the knowledge base for this query."
    else:
        return "\n\n".join([f"Document {i+1}: {node.text}" for i, node in enumerate(nodes[:5])])

async def needs_rag_query(query, context):
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.3)

    prompt = f"""As an AI agent, determine if a new information retrieval (RAG query) is needed to accurately answer the user query. Respond with ONLY 'YES' or 'NO', followed by a brief explanation.

User Query: "{query}"

Recent Conversation Context:
{format_recent_context(context)}

Decision (YES/NO):
"""

    response = await llm.ainvoke(prompt)
    decision = response.content.strip().split('\n')[0].lower()
    logger.info(f"RAG query decision: {decision}")
    return decision.startswith("yes")

def format_recent_context(context):
    recent_messages = context[-MAX_CONTEXT_MESSAGES:] if len(context) > MAX_CONTEXT_MESSAGES else context
    return "\n".join([f"{msg['role'].capitalize()}: {msg['content']}" for msg in recent_messages if 'content' in msg])

def extract_code_from_context(context: list) -> str:
    logger.debug(f"Extracting code from context: {context}")
    all_code_blocks = []
    for message in context:
        if isinstance(message, dict) and message.get('role') == 'assistant':
            code_blocks = re.findall(r'```(?:typescript|javascript|python)?\n(.*?)```', message.get('content', ''), re.DOTALL)
            all_code_blocks.extend(code_blocks)
    
    if all_code_blocks:
        extracted_code = "\n\n".join(all_code_blocks)
        logger.debug(f"Extracted code: {extracted_code[:500]}...")  # Log first 500 chars
        return extracted_code
    
    logger.debug("No code found in context")
    return ""

async def qc_agent(query: str, context_messages: list):
    llm = ChatOpenAI(model="gpt-4", temperature=0.3)
    
    logger.debug(f"QC agent received query: {query}")
    
    context = context_messages  # Use context messages passed from Node.js

    # Check if RAG query is needed
    rag_needed = await needs_rag_query(query, context)
    logger.info(f"RAG query needed: {rag_needed}")

    if rag_needed:
        kb_context = await perform_rag_retrieval(query)
        logger.info(f"Knowledge Base Context: {kb_context[:500]}...")
    else:
        kb_context = "No additional information retrieved from the knowledge base."

    code_to_review = extract_code_from_context(context)
    
    if not code_to_review:
        return "No code found in the context or provided for review. Please provide some code or ask a specific question."

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a Quality Control agent specialized in NEAR Protocol development. Your task is to review and improve the given code, identifying any issues or potential improvements."),
        ("human", f"Please review and improve the following NEAR Protocol code:\n\n{code_to_review}\n\nKnowledge Base Context:\n{kb_context}\n\nProvide your analysis and suggestions for improvement."),
    ])
    
    chain = prompt | llm
    
    logger.debug(f"Sending code to review: {code_to_review[:500]}...")  # Log first 500 chars
    response = await chain.ainvoke({})
    logger.debug(f"Received response: {response}")

    return response.content

# Main function to process the input query
async def main():
    if len(sys.argv) < 4:
        print("Usage: python qc_agent.py 'query' 'bot_name' 'context_messages'")
        sys.exit(1)
    
    query = sys.argv[1]
    bot_name = sys.argv[2]
    context_messages = json.loads(sys.argv[3])

    result = await qc_agent(query, context_messages)
    print(json.dumps({"response": result}))

if __name__ == "__main__":
    asyncio.run(main())
