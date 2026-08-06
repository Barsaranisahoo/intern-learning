import type {
  ChatRequest,
  ChatResponse,
  ImageAnalysisResponse,
} from "../types/chat";


const API_URL = "http://127.0.0.1:8000";


// Chat API
export async function sendMessage(
  request: ChatRequest
): Promise<ChatResponse> {

  const response = await fetch(
    `${API_URL}/chat`,
    {
      method: "POST",
      headers:{
        "Content-Type":"application/json",
      },

      body: JSON.stringify(request),
    }
  );


  if(!response.ok){
    throw new Error("Failed to connect to backend");
  }


  return response.json();

}




export async function uploadDocument(
  file: File,
  conversationId?: string | null
) {
  const formData = new FormData();

  formData.append("file", file);

  if (conversationId) {
    formData.append("conversation_id", conversationId);
  }

  const response = await fetch(
    `${API_URL}/documents/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
}







// Get uploaded documents API
export async function getDocuments(){

  const response = await fetch(
    `${API_URL}/documents/`
  );


  if(!response.ok){

    throw new Error(
      "Failed to fetch documents"
    );

  }


  return response.json();

}





// Get chat history list API
export async function getConversations(){

  const response = await fetch(
    `${API_URL}/conversations`
  );


  if(!response.ok){

    throw new Error(
      "Failed to fetch conversations"
    );

  }


  return response.json();

}





// Get single conversation messages API
export async function getConversation(
  conversationId: string
){

  const response = await fetch(
    `${API_URL}/conversation/${conversationId}`
  );


  if(!response.ok){

    throw new Error(
      "Failed to fetch conversation"
    );

  }


  return response.json();

}
// Get conversation by document
export async function getConversationByDocument(
  documentId: string
) {

  const response = await fetch(
    `${API_URL}/documents/${documentId}/conversation`
  );

  if (!response.ok) {

    throw new Error(
      "Failed to fetch document conversation"
    );

  }

  return response.json();

}

export async function summarizeDocument(
  documentId: string,
  conversationId: string
) { 
  const response = await fetch(
    `${API_URL}/features/summarize?document_id=${documentId}&conversation_id=${conversationId}`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to summarize document");
  }

  return response.json();
}
// -----------------------------
// Image Analysis API
// -----------------------------

export async function analyzeImage(
  file: File,
  prompt: string,
  conversationId?: string | null
) {

  const formData = new FormData();

  formData.append("file", file);
  formData.append("prompt", prompt);

  if (conversationId) {
    formData.append("conversation_id", conversationId);
  }

  const response = await fetch(
    `${API_URL}/images/analyze`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Image analysis failed");
  }

  return response.json() as Promise<ImageAnalysisResponse>;
}
// -----------------------------
// Generate Suggested Questions
// -----------------------------
export async function generateSuggestedQuestions(
  documentId: string
) {
  const response = await fetch(
    `${API_URL}/documents/generate-questions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document_id: documentId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to generate suggested questions"
    );
  }

  return response.json();
}