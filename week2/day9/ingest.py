import os
import numpy as np
from dotenv import load_dotenv
from google import genai

# ------------------ ENV ------------------
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

# ------------------ CHUNKING ------------------
def chunk_text(text, size=800):
    paragraphs = text.split("\n\n")

    chunks = []
    current = ""

    for para in paragraphs:
        para = para.strip()

        if len(current) + len(para) + 2 <= size:
            current += para + "\n\n"
        else:
            if current:
                chunks.append(current.strip())
            current = para + "\n\n"

    if current:
        chunks.append(current.strip())

    return chunks


# ------------------ EMBEDDING ------------------
def get_embedding(text):
    return client.models.embed_content(
        model="models/gemini-embedding-001",
        contents=text,
        config={"task_type": "retrieval_document"}
    ).embeddings[0].values


# ------------------ SIMILARITY ------------------
def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return np.dot(a, b) / denom if denom != 0 else 0.0


# ------------------ LOAD FILE ------------------
with open("document.txt", "r", encoding="utf-8") as f:
    text = f.read()

chunks = chunk_text(text)

data = []

for i, chunk in enumerate(chunks, start=1):
    emb = get_embedding(chunk)

    data.append({
        "id": i,
        "text": chunk,
        "embedding": emb
    })

print("\n Ready for search!\n")


# ------------------ SEARCH ------------------
# ------------------ SEARCH FUNCTION ------------------
def search(query):

    print("\n CHUNKED DOCUMENT:\n")

    # Show all chunks
    for item in data:
        print("-" * 60)
        print(f"Chunk {item['id']}")
        print(item["text"])
        print()

    # Create query embedding
    query_emb = client.models.embed_content(
        model="models/gemini-embedding-001",
        contents=query,
        config={"task_type": "retrieval_query"}
    ).embeddings[0].values

    # Calculate similarity scores
    scores = []

    for item in data:
        score = cosine_similarity(query_emb, item["embedding"])
        scores.append((score, item["id"], item["text"]))

    # Sort by highest score
    scores.sort(reverse=True, key=lambda x: x[0])

    print("\n🔍 SIMILARITY SCORES\n")

    for score, cid, text in scores:
        print(f"Chunk {cid} : {score:.4f}")

    # Select best chunk
    best_score, best_id, best_text = scores[0]

    print("\n SELECTED CHUNK")
    print(f"Chunk ID : {best_id}")
    print(f"Similarity Score : {best_score:.4f}")

    # Prompt for Gemini
    prompt = f"""
Answer the question using ONLY the context below.

Context:
{best_text}

Question:
{query}

Answer ONLY from the context.
Keep the answer to 1-2 sentences.
Do not add any extra information.
If the answer is not present in the context, reply:
"Answer not found in the document."
"""

    # Generate answer
    response = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=prompt
    )

    print("\n🤖 FINAL ANSWER\n")
    print(response.text)


# ------------------ MAIN LOOP ------------------
if __name__ == "__main__":
    while True:
        q = input("\nAsk a question (or type exit): ")

        if q.lower() == "exit":
            break

        search(q)