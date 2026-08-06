import { useState } from "react";
import { sendMessage } from "../services/api";

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function AICode() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const askCodeAI = async () => {
    if (!prompt.trim()) return;

    const userPrompt = prompt;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: userPrompt,
      },
    ]);

    setPrompt("");

    try {
      setLoading(true);

      const response = await sendMessage({
        message:
          "You are an expert software engineer. Help with this coding request:\n\n" +
          userPrompt,
        conversation_id: null,
        document_id: null,
      });

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
          text: "Failed to generate code.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-placeholder">
      <h3>💻 Code AI</h3>

      <p>Generate, explain, debug and optimize code.</p>

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
            <p>Generating...</p>
          </div>
        )}
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Example: Write Binary Search in Python"
      />

      <button onClick={askCodeAI}>
        Generate Code
      </button>
    </div>
  );
}