import sys
import json
import os
import re
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_pinecone import Pinecone
from pinecone import Pinecone as PineconeClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set API keys as environment variables (you can remove these if they're in your .env file)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
PINECONE_ENVIRONMENT = os.getenv('PINECONE_ENVIRONMENT')
PINECONE_INDEX_NAME = os.getenv('PINECONE_INDEX_NAME')

# Initialize Pinecone
pc = PineconeClient()

# Set up embeddings and vector store
embeddings = OpenAIEmbeddings()
index_name = "chadbot"
vectorstore = Pinecone.from_existing_index(index_name, embeddings)

def log(message):
    print(message, file=sys.stderr)

def read_bot_personalities():
    with open('bots.js', 'r') as file:
        content = file.read()
    
    # Use regex to extract bot information
    bot_data = re.findall(r'{[\s\S]*?username:\s*[\'"](\w+)[\'"][\s\S]*?personality:\s*`([\s\S]*?)`[\s\S]*?}', content)
    
    # Create a dictionary of bot personalities
    return {username: personality.strip() for username, personality in bot_data}

def check_index_content(index_name, bot_name=None):
    index = pc.Index(index_name)
    filter_dict = {"bot": bot_name} if bot_name else {}
    query_response = index.query(
        vector=[0] * 1536,  # Dummy vector
        top_k=5,
        include_metadata=True,
        filter=filter_dict
    )
    log(f"Sample content {'for bot ' + bot_name if bot_name else 'in index'}:")
    for match in query_response['matches']:
        log(f"ID: {match['id']}")
        log(f"Score: {match['score']}")
        log(f"Metadata: {match['metadata']}")
        log(f"Content: {match.get('metadata', {}).get('page_content', 'No content available')[:200]}...")
        log("")

def get_rag_response(query, bot_name):
    # Check index content
    check_index_content(index_name)  # Check all content
    check_index_content(index_name, bot_name)  # Check content for specific bot

    # Create a retriever
    retriever = vectorstore.as_retriever(search_kwargs={"filter": {"bot": bot_name}, "k": 5})
    
    # Retrieve relevant documents
    docs = retriever.invoke(query)
    log("Retrieved documents:")
    for i, doc in enumerate(docs):
        log(f"Document {i+1}:")
        log(f"Content: {doc.page_content[:200]}...")
        log(f"Metadata: {doc.metadata}")
        log("")

    # Prepare context for the AI
    context = "\n\n".join([f"Document {i+1}: {doc.page_content}" for i, doc in enumerate(docs)])
           
    # Create a ChatOpenAI model
    llm = ChatOpenAI(model_name="gpt-3.5-turbo-0125", temperature=0.8)

    # Get bot personality
    bot_personalities = read_bot_personalities()
    bot_personality = bot_personalities.get(bot_name, "")

    # Prepare the prompt
    prompt = f"""{bot_personality}
    
    You are the living breathing clone of {bot_name}, fully representing their work and ideas. 
    A user has asked the following question: "{query}"
    
    Based on the following information from {bot_name}'s knowledge base, please provide a helpful, concise and informative response in the tone and personality of {bot_name}. You must always reply in a natural conversational tone.

    {context}

    If the provided information doesn't directly answer the user's question, use your knowledge and personality as {bot_name} to respond to the user with your general knowledge. If you're unsure or don't have enough information, it's okay to say so."""
    
    # Get response
    response = llm.invoke(prompt)
    return response.content

if __name__ == "__main__":
    try:
        query = sys.argv[1]
        bot_name = sys.argv[2]
        
        response = get_rag_response(query, bot_name)
        print(json.dumps({"response": response}))
    except Exception as e:
        log(f"Error: {str(e)}")
        print(json.dumps({"error": str(e)}))
    sys.stdout.flush()