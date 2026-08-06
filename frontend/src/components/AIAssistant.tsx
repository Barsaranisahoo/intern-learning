import { useState } from "react";

import AIChat from "./AIChat";
import AIDocument from "./AIDocument";
import AICode from "./AICode";
import AIWebsite from "./AIWebsite";

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <section className="ai-assistant-card">
      <h2>🧠 AI Assistant</h2>

      <div className="ai-tabs">
        <button
          className={activeTab === "chat" ? "active-tab" : ""}
          onClick={() => setActiveTab("chat")}
        >
          💬 Chat
        </button>

        <button
          className={activeTab === "website" ? "active-tab" : ""}
          onClick={() => setActiveTab("website")}
        >
          🌐 Website
        </button>

        <button
          className={activeTab === "document" ? "active-tab" : ""}
          onClick={() => setActiveTab("document")}
        >
          📄 Document
        </button>

        <button
          className={activeTab === "code" ? "active-tab" : ""}
          onClick={() => setActiveTab("code")}
        >
          💻 Code
        </button>
      </div>

      {activeTab === "chat" && <AIChat />}

      {activeTab === "website" && <AIWebsite />}

      {activeTab === "document" && <AIDocument />}

      {activeTab === "code" && <AICode />}
    </section>
  );
}