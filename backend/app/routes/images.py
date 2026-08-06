import io
import os
import uuid

from fastapi import (
    APIRouter,
    File,
    UploadFile,
    HTTPException,
    Depends,
    Form,
)

from PIL import Image as PILImage
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Conversation, Message, Image
from app.gemini_service import analyze_image as analyze_image_with_gemini


router = APIRouter(
    prefix="/images",
    tags=["Images"]
)


@router.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
   prompt: str = Form("Analyze this image."),
   conversation_id: str | None = Form(None),
   db: Session = Depends(get_db)
):
    """
    Analyze an uploaded image using Gemini Vision
    and store it for follow-up conversations.
    """

    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image."
        )

    image_bytes = await file.read()

    # ---------------- Validate Image ----------------

    try:
        PILImage.open(io.BytesIO(image_bytes))

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid image."
        )

    # ---------------- Save Image ----------------

    upload_dir = "uploads/images"
    os.makedirs(upload_dir, exist_ok=True)

    extension = os.path.splitext(file.filename)[1]

    filename = f"{uuid.uuid4()}{extension}"

    file_path = os.path.join(
        upload_dir,
        filename
    )

    with open(file_path, "wb") as f:
        f.write(image_bytes)

    # ---------------- Analyze ----------------

    try:

        reply = analyze_image_with_gemini(
            image_bytes=image_bytes,
            mime_type=file.content_type,
            user_prompt=prompt
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    # ---------------- Conversation ----------------

    if conversation_id:

        conversation = (
          db.query(Conversation)
          .filter(Conversation.id == conversation_id)
           .first()
    )

        if conversation is None:

            conversation = Conversation()

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    else:

        conversation = Conversation()
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # ---------------- Save Image ----------------

    image = Image(
        conversation_id=conversation.id,
        filename=file.filename,
        file_path=file_path
    )

    db.add(image)

    # ---------------- User Message ----------------

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=f"Uploaded image: {file.filename}"
    )

    db.add(user_message)

    # ---------------- Assistant Message ----------------

    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=reply
    )

    db.add(assistant_message)

    db.commit()

    return {
        "filename": file.filename,
        "analysis": reply,
        "conversation_id": conversation.id
    }