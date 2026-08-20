from fastapi import APIRouter, UploadFile, File, Depends, Form
from sqlalchemy.orm import Session
from uuid import UUID

from app.schemas import UploadResponse
from ..database import get_db
from ..models import Workspace, Conversation, Message, Document, Chunk, Image
from ..gemini_service import create_embedding
from ..llm import generate_suggested_questions
from ..services.file_extractor import extract_text
from ..services.chunker import create_chunks
from pydantic import BaseModel


router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


class GenerateQuestionsRequest(BaseModel):
    document_id: UUID


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    conversation_id: str | None = Form(None),
    workspace_id: str | None = Form(None),
    workspace_name: str | None = Form(None),
    db: Session = Depends(get_db),
):

    try:
        text = extract_text(
            file.file,
            file.filename
        )

        print("EXTRACTED TEXT LENGTH:", len(text))

    except Exception as e:
        print("EXTRACTION ERROR:", e)
        text = ""

    if text.strip():
        chunks = create_chunks(text)
    else:
        chunks = []

    # Check existing document
    existing_document = (
        db.query(Document)
        .filter(Document.filename == file.filename)
        .first()
    )

    # If same file exists, delete old data
    if existing_document:

        conversations = (
            db.query(Conversation)
            .filter(
                Conversation.document_id == existing_document.id
            )
            .all()
        )

        # Delete messages and images first
        for conversation in conversations:

            db.query(Message).filter(
                Message.conversation_id == conversation.id
            ).delete()

            db.query(Image).filter(
                Image.conversation_id == conversation.id
            ).delete()

        # Delete conversations
        db.query(Conversation).filter(
            Conversation.document_id == existing_document.id
        ).delete()

        # Delete chunks
        db.query(Chunk).filter(
            Chunk.document_id == existing_document.id
        ).delete()

        # Delete document
        db.delete(existing_document)

        db.commit()

    # ---------------- Workspace ----------------

    workspace = None

    if workspace_id:

        try:

            workspace = (
                db.query(Workspace)
                .filter(
                    Workspace.id == UUID(workspace_id)
                )
                .first()
            )

        except Exception:

            workspace = None

    if workspace is None and workspace_name:

        workspace = (
            db.query(Workspace)
            .filter(Workspace.name == workspace_name)
            .first()
    )

        if workspace is None:
          workspace = Workspace(
            name=workspace_name
        )

        db.add(workspace)
        db.commit()
        db.refresh(workspace)

       # ---------------- Create Document ----------------

    document = Document(
        filename=file.filename,
        workspace_id=workspace.id if workspace else None
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    # ---------------- Save Chunks ----------------

    for index, chunk_text in enumerate(chunks):

        embedding = create_embedding(chunk_text)

        chunk = Chunk(
            document_id=document.id,
            chunk_index=index,
            content=chunk_text,
            embedding=embedding
        )

        db.add(chunk)

    db.commit()

    # ---------------- Conversation ----------------

    conversation = None

    if (
        conversation_id
        and conversation_id not in ("", "null", "undefined")
    ):

        try:

            conversation_uuid = UUID(conversation_id)

            conversation = (
                db.query(Conversation)
                .filter(
                    Conversation.id == conversation_uuid
                )
                .first()
            )

        except ValueError:

            conversation = None

    if conversation:

        conversation.document_id = document.id
        conversation.workspace_id = workspace.id if workspace else None

        db.commit()
        db.refresh(conversation)

    else:

        conversation = Conversation(
            document_id=document.id,
            workspace_id=workspace.id if workspace else None
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # ---------------- Initial Messages ----------------

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=f"📄 {file.filename}"
    )

    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=f"✅ {file.filename} uploaded successfully.\n\nYou can now ask questions about this document."
    )

    db.add(user_message)
    db.add(assistant_message)
    db.commit()

    return UploadResponse(
    message="File uploaded successfully",
    document_id=document.id,
    conversation_id=conversation.id,
    workspace_id=workspace.id if workspace else None,
    filename=file.filename,
    chunks_saved=len(chunks),
    suggested_questions=[]
)

@router.post("/generate-questions")
def generate_document_questions(
    req: GenerateQuestionsRequest,
    db: Session = Depends(get_db)
):

    document = (
        db.query(Document)
        .filter(Document.id == req.document_id)
        .first()
    )

    if document is None:
        return {
            "suggested_questions": []
        }

    chunks = (
        db.query(Chunk)
        .filter(Chunk.document_id == req.document_id)
        .order_by(Chunk.chunk_index)
        .all()
    )

    context = "\n\n".join(
        chunk.content
        for chunk in chunks
    )

    questions = generate_suggested_questions(
        context
    )

    return {
        "suggested_questions": questions
    }


@router.get("/")
def list_documents(
    db: Session = Depends(get_db)
):

    documents = db.query(Document).all()

    result = []

    for doc in documents:

        chunk_count = (
            db.query(Chunk)
            .filter(Chunk.document_id == doc.id)
            .count()
        )

        result.append({
            "id": str(doc.id),
            "filename": doc.filename,
            "uploaded_at": doc.uploaded_at,
            "chunk_count": chunk_count
        })

    return result