import { useState } from "react";
import { sendMessage } from "../services/api";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function AIChat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const askAI = async () => {
    if (!question.trim()) return;

    const userMessage = question;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage }
    ]);

    setQuestion("");

    try {
      setLoading(true);

      const response = await sendMessage({
        message: userMessage,
        conversation_id: conversationId,
        document_id: null,
      });

      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.reply,
        },
      ]);
    } catch (err) {
      console.error(err);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Something went wrong while connecting to AI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <p>Ask general questions and have natural conversations with AI.</p>

      <div className="ai-chat-history">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.role === "user"
                ? "ai-user-message"
                : "ai-bot-message"
            }
          >
            <strong>{msg.role === "user" ? "You:" : "AI:"}</strong>
            <p>{msg.text}</p>
          </div>
        ))}

        {loading && (
          <div className="ai-bot-message">
            <strong>AI:</strong>
            <p>Thinking...</p>
          </div>
        )}
      </div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            askAI();
          }
        }}
        placeholder="Ask anything..."
      />

      <button onClick={askAI} disabled={loading}>
        {loading ? "Thinking..." : "Ask AI"}
      </button>
    </>
  );
}