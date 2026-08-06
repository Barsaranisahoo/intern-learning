export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
  document_id?: string | null;
  strict_document?: boolean;
}

export interface ChatResponse {
  reply: string;
  conversation_id: string;
  created_at: string;
  suggested_questions: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

// -----------------------------
// Phase 2 - Image Analysis
// -----------------------------

export interface ImageAnalysisResponse {
  filename: string;
  analysis: string;
  conversation_id: string;
}