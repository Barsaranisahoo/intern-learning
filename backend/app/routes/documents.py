from fastapi import APIRouter, UploadFile, File, Depends, Form
from sqlalchemy.orm import Session
from uuid import UUID
from app.schemas import UploadResponse
from ..database import get_db
from ..models import Conversation, Message, Document, Chunk

from ..gemini_service import create_embedding
from ..services.file_extractor import extract_text
from ..services.chunker import create_chunks


router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.post("/upload" , response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    conversation_id: str | None = Form(None),
    db: Session = Depends(get_db)
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
    existing_document = db.query(Document).filter(
        Document.filename == file.filename
    ).first()



    # If same file exists, delete old data
    if existing_document:

        conversations = db.query(Conversation).filter(
            Conversation.document_id == existing_document.id
        ).all()


        # Delete messages first
        for conversation in conversations:

            db.query(Message).filter(
                Message.conversation_id == conversation.id
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



    # Create new document
    document = Document(
        filename=file.filename
    )


    db.add(document)

    db.commit()

    db.refresh(document)



    # Save chunks
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



    # Attach document to existing conversation if provided
    if conversation_id:

        conversation = (
            db.query(Conversation)
            .filter(Conversation.id == UUID(conversation_id))
            .first()
        )

        if conversation:

            conversation.document_id = document.id

            db.commit()
            db.refresh(conversation)

        else:

            conversation = Conversation(
                document_id=document.id
            )

            db.add(conversation)
            db.commit()
            db.refresh(conversation)

    else:

        conversation = Conversation(
            document_id=document.id
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    return UploadResponse(
    message="File uploaded successfully",
    document_id=document.id,
    conversation_id=conversation.id,
    filename=file.filename,
    chunks_saved=len(chunks)
)





@router.get("/")
def list_documents(
    db: Session = Depends(get_db)
):

    documents = db.query(Document).all()

    result = []


    for doc in documents:

        chunk_count = db.query(Chunk).filter(
            Chunk.document_id == doc.id
        ).count()


        result.append({
            "id": str(doc.id),
            "filename": doc.filename,
            "uploaded_at": doc.uploaded_at,
            "chunk_count": chunk_count
        })


    return result