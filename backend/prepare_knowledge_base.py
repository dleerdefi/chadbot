import json
import os
from langchain.docstore.document import Document
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import Pinecone
from pinecone import Pinecone as PineconeClient

# Set API keys as environment variables 
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
PINECONE_ENVIRONMENT = os.getenv('PINECONE_ENVIRONMENT')
PINECONE_INDEX_NAME = os.getenv('PINECONE_INDEX_NAME')

def truncate_string(string, max_bytes):
    encoded = string.encode('utf-8')
    return encoded[:max_bytes].decode('utf-8', 'ignore')

def load_json_files(directory):
    documents = []
    for filename in os.listdir(directory):
        if filename.endswith('.json'):
            with open(os.path.join(directory, filename), 'r') as f:
                data = json.load(f)
                
                for item in data:
                    if 'term' in item and 'definition' in item:
                        # This is a glossary item
                        content = f"{item['term']}: {item['definition']}"
                        metadata = {
                            'source': filename,
                            'bot': filename.split('_')[0],
                            'type': 'glossary'
                        }
                    elif 'text' in item and 'title' in item:
                        # This is a transcript item
                        content = item['text']
                        metadata = {
                            'source': filename,
                            'bot': filename.split('_')[0],
                            'type': 'transcript',
                            'title': truncate_string(item['title'], 100)  # Truncate title if necessary
                        }
                    else:
                        continue  # Skip items that don't match expected format

                    # Truncate content if necessary
                    content = truncate_string(content, 3000)  # Adjust this value as needed
                    
                    doc = Document(page_content=content, metadata=metadata)
                    documents.append(doc)
    
    return documents

# Load documents
docs = load_json_files('./knowledge_bases')

# Print some debug information
print(f"Loaded {len(docs)} documents")

# Initialize Pinecone
pc = PineconeClient()

# Create embeddings
embeddings = OpenAIEmbeddings()

# Set up Pinecone index
index_name = "chadbot"
if index_name not in pc.list_indexes().names():
    print(f"Creating new index: {index_name}")
    pc.create_index(
        name=index_name,
        dimension=1536,  # OpenAI embeddings are 1536 dimensions
        metric='cosine'
    )
else:
    print(f"Index {index_name} already exists")

# Get the index
index = pc.Index(index_name)

# Create vector store with new documents
vectorstore = Pinecone.from_documents(
    docs, 
    embeddings, 
    index_name=index_name
)

print(f"Upserted {len(docs)} documents to the vector store")