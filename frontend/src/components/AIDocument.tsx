import { useState } from "react";
import { sendMessage, uploadDocument } from "../services/api";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function AIDocument() {
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentConversationId, setDocumentConversationId] =
    useState<string | null>(null);

  const [documentQuestion, setDocumentQuestion] = useState("");
  const [documentMessages, setDocumentMessages] = useState<Message[]>([]);
  const [documentLoading, setDocumentLoading] = useState(false);

  const uploadDocumentToAI = async () => {
    console.log("📄 Upload button clicked");

    if (!documentFile) {
      alert("Please choose a file first.");
      console.log("❌ No file selected");
      return;
    }

    console.log("Selected file:", documentFile);

    try {
      console.log("Sending upload request...");

      const response = await uploadDocument(documentFile);

      console.log("Upload response:", response);

      setDocumentId(response.document_id);
      setDocumentConversationId(response.conversation_id);

      setDocumentMessages([
        {
          role: "assistant",
          text: `✅ ${response.filename} uploaded successfully.`,
        },
      ]);
    } catch (err) {
      console.error("Upload Error:", err);

      setDocumentMessages([
        {
          role: "assistant",
          text: "❌ Failed to upload document.",
        },
      ]);
    }
  };

  const askDocument = async () => {
    console.log("📄 Ask Document clicked");

    if (!documentQuestion.trim()) {
      alert("Please enter a question.");
      return;
    }

    if (!documentId) {
      alert("Please upload a document first.");
      return;
    }

    const question = documentQuestion;

    setDocumentQuestion("");

    setDocumentMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: question,
      },
    ]);

    try {
      setDocumentLoading(true);

      console.log("Sending question...");

      const response = await sendMessage({
        message: question,
        conversation_id: documentConversationId,
        document_id: documentId,
        strict_document: true,
      });

      console.log("Answer:", response);

      setDocumentMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.reply,
        },
      ]);
    } catch (err) {
      console.error("Ask Error:", err);

      setDocumentMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "❌ Failed to ask document.",
        },
      ]);
    } finally {
      setDocumentLoading(false);
    }
  };

  return (
    <div className="ai-placeholder">
      <h3>📄 Document AI</h3>

      <p>Upload a document and chat with its contents.</p>

      <input
        type="file"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            console.log("File selected:", e.target.files[0]);

            setDocumentFile(e.target.files[0]);
          }
        }}
      />

      <button onClick={uploadDocumentToAI}>
        Upload Document
      </button>

      <div className="ai-chat-history">
        {documentMessages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.role === "user"
                ? "ai-user-message"
                : "ai-bot-message"
            }
          >
            <strong>
              {msg.role === "user" ? "You:" : "AI:"}
            </strong>

            <p>{msg.text}</p>
          </div>
        ))}

        {documentLoading && (
          <div className="ai-bot-message">
            <strong>AI:</strong>
            <p>Searching document...</p>
          </div>
        )}
      </div>

      <textarea
        value={documentQuestion}
        onChange={(e) => setDocumentQuestion(e.target.value)}
        placeholder="Ask a question about this document..."
      />

      <button onClick={askDocument}>
        Ask Document
      </button>
    </div>
  );
}