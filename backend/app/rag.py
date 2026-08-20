import os

from sqlalchemy.orm import Session

from app.models import Chunk, Document
from app.gemini_service import create_embedding

TOP_K = int(os.getenv("TOP_K", 5))


def retrieve_relevant_chunks(
    query: str,
    db: Session,
    document_id=None,
    workspace_id=None,
    limit: int = TOP_K
):

    query_embedding = create_embedding(query)

    distance = Chunk.embedding.cosine_distance(
        query_embedding
    ).label("distance")

    query_result = (
        db.query(
            Chunk,
            Document.filename,
            distance
        )
        .join(
            Document,
            Chunk.document_id == Document.id
        )
    )

    # -----------------------------
    # Workspace Search (Multi-file)
    # -----------------------------

    if workspace_id:

        query_result = query_result.filter(
            Document.workspace_id == workspace_id
        )

    elif document_id:

        query_result = query_result.filter(
            Chunk.document_id == document_id
        )

    print("TOP_K:", limit)
    print("WORKSPACE:", workspace_id)
    print("DOCUMENT:", document_id)

    if workspace_id:

      results = (
        query_result
        .order_by(distance)
        .limit(limit * 2)
        .all()
    )

    else:

       results = (
        query_result
        .order_by(distance)
        .limit(limit)
        .all()
    )

    print("RESULT COUNT:", len(results))

    chunks = []

    code_keywords = (
        "def ",
        "class ",
        "import ",
        "#include",
        "function ",
        "const ",
        "let ",
        "var ",
        "public class",
        "interface ",
    )

    is_code_query = any(
        keyword in query.lower()
        for keyword in (
            "function",
            "class",
            "method",
            "api",
            "endpoint",
            "variable",
            "code",
            "python",
            "react",
            "javascript",
            "typescript",
            "css",
            "html",
            "sql",
        )
    )

    contains_code = any(
        any(keyword in chunk.content for keyword in code_keywords)
        for chunk, _, _ in results
    )

    SIMILARITY_THRESHOLD = (
        0.35
        if (is_code_query or contains_code)
        else 0.45
    )

    for chunk, filename, distance_value in results:

        similarity = 1 - distance_value

        print("----------------")
        print("File:", filename)
        print("Distance:", distance_value)
        print("Similarity:", similarity)
        print("Chunk:", chunk.content[:200])

        if similarity >= SIMILARITY_THRESHOLD:

            chunks.append(
                {
                    "filename": filename,
                    "content": chunk.content
                }
            )

    print("FINAL CHUNKS SENT:", len(chunks))

    return chunks


# -----------------------------
# Used by the Summarize feature
# -----------------------------

def get_document_text(
    db: Session,
    document_id,
):

    chunks = (
        db.query(Chunk)
        .filter(Chunk.document_id == document_id)
        .order_by(Chunk.chunk_index)
        .all()
    )

    if not chunks:
        return ""

    return "\n\n".join(
        chunk.content
        for chunk in chunks
    )