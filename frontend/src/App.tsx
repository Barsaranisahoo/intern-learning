import { useState } from "react";
import "./App.css";

import Chat from "./components/Chat";
import ChatHistory from "./components/ChatHistory";
import AIAssistant from "./components/AIAssistant";


function App() {
  const [selectedConversation, setSelectedConversation] =
    useState<string | null>(null);

  const [workspaceId, setWorkspaceId] =
    useState<string | null>(null);  

  const [workspaceName, setWorkspaceName] =
     useState<string>("New Workspace");
  
  const [historyRefresh, setHistoryRefresh] =
    useState(0);

  const [showAssistant, setShowAssistant] =
    useState(false);

  const refreshHistory = () => {
    setHistoryRefresh((prev) => prev + 1);
  };

  const startNewChat = () => {
     setSelectedConversation(null);

  // Keep current workspace
};
  const [showHistory, setShowHistory] = useState(true);
  console.log("APP conversation =", selectedConversation);

  return (
    <div className="app-layout">
      <aside className={`sidebar ${showHistory ? "" : "sidebar-collapsed"}`}>

  {/* Toggle Button (always visible) */}
  <button
    className="sidebar-toggle"
    onClick={() => setShowHistory(!showHistory)}
    title={showHistory ? "Collapse Sidebar" : "Expand Sidebar"}
  >
    {showHistory ? "☰" : "☰"}
  </button>

  {showHistory ? (
    <>
      <div className="brand">
        <h2>Smart Support</h2>
        <p>Your AI-powered knowledge assistant</p>
      </div>

      <button
        className="new-chat-btn"
        onClick={startNewChat}
      >
        + New Chat
      </button>

      <div className="history-scroll"> 

  <ChatHistory
  refresh={historyRefresh}
  onSelectConversation={setSelectedConversation}
  onSelectWorkspace={(id, name) => {
    setWorkspaceId(id);
    setWorkspaceName(name);
  }}
/>
</div>
    </>
  ) : (
    <>
      <button
        className="sidebar-icon-btn"
        title="New Chat"
        onClick={startNewChat}
      >
        ➕
      </button>

      <button
  className="sidebar-icon-btn"
  title="Expand Sidebar"
  onClick={() => setShowHistory(true)}
>
  ☰
</button>
    </>
  )}

</aside>

      <main className="chat-area">
        <Chat
  conversationId={selectedConversation}
  setConversationId={setSelectedConversation}
  workspaceId={workspaceId}
  setWorkspaceId={setWorkspaceId}
  workspaceName={workspaceName}
  onHistoryUpdate={refreshHistory}
/>

        {/* Floating Sparkle Button */}
        <button
          className="ai-floating-btn"
          title="Ask AI Assistant"
          onClick={() => setShowAssistant(true)}
        >
          ✨
        </button>

        {/* Popup */}
        {showAssistant && (
          <>
            <div
              className="ai-overlay"
              onClick={() => setShowAssistant(false)}
            />

            <div className="ai-popup">
              <button
                className="close-ai"
                onClick={() => setShowAssistant(false)}
              >
                ✕
              </button>

              <AIAssistant />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;