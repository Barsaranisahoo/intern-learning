from typing import Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[UUID] = None
    document_id: Optional[UUID] = None
    workspace_id: Optional[UUID] = None
    strict_document: bool = False


class ResponseMessage(BaseModel):
    role: str
    content: str


class ChatResponse(BaseModel):
    reply: str
    conversation_id: UUID
    created_at: datetime
    suggested_questions: list[str] = []


class UploadResponse(BaseModel):
    message: str
    document_id: UUID
    conversation_id: UUID
    workspace_id: UUID | None = None
    filename: str
    chunks_saved: int
    suggested_questions: list[str] = []


class DocumentInfo(BaseModel):
    id: UUID
    filename: str
    uploaded_at: str
    chunk_count: int


class SummaryResponse(BaseModel):
    summary: str
    key_points: list[str]


# -----------------------------
# Phase 2 - Image Analysis
# -----------------------------

class ImageAnalysisResponse(BaseModel):
    filename: str
    analysis: str
    conversation_id: UUID
    image_id: UUID