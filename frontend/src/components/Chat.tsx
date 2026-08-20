import { useState, useRef, useEffect } from "react";

import {
  sendMessage,
  uploadDocument,
  getConversation,
  summarizeDocument,
  analyzeImage,
  generateSuggestedQuestions,
} from "../services/api";

import type { ChatMessage } from "../types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
 
interface ChatProps {
  conversationId: string | null;
  setConversationId: (id: string | null) => void;

  workspaceId: string | null;
  setWorkspaceId: (id: string | null) => void;

  workspaceName: string;

  onHistoryUpdate: () => void;
}
function fixMarkdownCode(text: string) {
  return text.replace(
    /```(\w+)\s+([\s\S]*?)```/g,
    "```$1\n$2\n```"
  );
}

export default function Chat({
  conversationId,
  setConversationId,
  workspaceId,
  setWorkspaceId,
  workspaceName,
  onHistoryUpdate,
}: ChatProps) {

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);


  const [input, setInput] =
    useState("");


  const [loading, setLoading] =
    useState(false);


  const [uploadStatus, setUploadStatus] =
    useState("");


  const [documentId, setDocumentId] =
  useState<string | null>(null);


  const [summarizing, setSummarizing] =
  useState(false);

  const [selectedImage, setSelectedImage] =
  useState<File | null>(null);

  const imageInputRef =
  useRef<HTMLInputElement | null>(null);

   const fileInputRef =
  useRef<HTMLInputElement | null>(null);

  const messagesEndRef =
  useRef<HTMLDivElement | null>(null);

  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState("");
const [selectionPosition, setSelectionPosition] = useState({
  x: 0,
  y: 0,
});

const [showSelectionMenu, setShowSelectionMenu] =
  useState(false);
const [theme, setTheme] = useState(
  localStorage.getItem("theme") || "dark"
);


  // Load previous conversation
  useEffect(() => {


    const loadConversation = async () => {

if (!conversationId) {

    setMessages([]);
    setDocumentId(null);
    setSuggestedQuestions([]);
    return;

}


      try {


        const data = await getConversation(
          conversationId
        );
       setDocumentId(data.document_id ?? null);
       if (data.workspace_id) {
          setWorkspaceId(data.workspace_id);
     }


        setMessages(

          data.messages.map((msg: ChatMessage) => ({

            role: msg.role,

            content: msg.content,

            created_at: msg.created_at

          }))

        );
        
      } catch(error) {


        console.log(
          "Failed to load conversation",
          error
        );


      }


    };


    loadConversation();


  }, [conversationId]);

  useEffect(() => {

  messagesEndRef.current?.scrollIntoView({

    behavior: "smooth"

  });

}, [messages, loading, summarizing]);
useEffect(() => {

  const handleSelection = () => {

    const selection = window.getSelection();

    if (!selection) return;

    const text = selection.toString().trim();

    if (!text) {

      setShowSelectionMenu(false);

      return;

    }

    const range = selection.getRangeAt(0);

    const rect = range.getBoundingClientRect();

    setSelectedText(text);

    setSelectionPosition({

      x: rect.left + rect.width / 2,

      y: rect.top - 10,

    });

    setShowSelectionMenu(true);

  };

 document.addEventListener("mouseup", handleSelection);

document.addEventListener("keyup", handleSelection);

return () => {
  document.removeEventListener("mouseup", handleSelection);
  document.removeEventListener("keyup", handleSelection);
};

}, []);
useEffect(() => {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}, [theme]);


  // Send message
  const handleSend = async () => {


    if (!input.trim() || loading)

      return;



    const userText =
  selectedPrompt
    ? `${selectedPrompt}\n\n${input}`
    : input;
    if (selectedImage) {

  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      content:
        `🖼️ ${selectedImage.name}\n\n${userText}`,
      created_at: new Date().toISOString(),
    },
  ]);

  setInput("");
  setLoading(true);
  setSelectedPrompt("");
  const imageToSend = selectedImage;

setSelectedImage(null);
setInput("");

  try {

    const result =
  await analyzeImage(
    imageToSend!,
    userText,
    conversationId
  );

// Only create a new conversation if there isn't one already
if (!conversationId && result.conversation_id) {
  setConversationId(result.conversation_id);
}

// Image chat is not document chat
setDocumentId(null);
setSuggestedQuestions([]);


    setLoading(false);


    await typeMessage(
      result.analysis,
      new Date().toISOString()
    );


    onHistoryUpdate();


    
    setSuggestedQuestions([]);

    return;
  } catch {

    setLoading(false);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Image analysis failed.",
        created_at: new Date().toISOString(),
      },
    ]);

    return;

  }

}



    setMessages((prev) => [

      ...prev,

      {
        role: "user",
        content: userText,
        created_at: new Date().toISOString()
      }

    ]);



    setInput("");

    setLoading(true);



    try {


      console.log("===== REQUEST =====");
      console.log("conversationId =", conversationId);
      console.log("documentId =", documentId);
      console.log("message =", userText);
      console.log("==================");



     const response = await sendMessage({
       message: userText,
       conversation_id: conversationId,
       document_id : documentId,
       workspace_id: workspaceId,
       strict_document: !!documentId,
});

// Store new conversation id
if (!conversationId) {

  setConversationId(
    response.conversation_id
  );

}

// Hide the "Thinking..." message first
setLoading(false);

// Now start the typing animation
await typeMessage(
  response.reply,
  response.created_at
);
setSelectedPrompt("");

if (
  documentId &&
  response.suggested_questions &&
  response.suggested_questions.length > 0
) {
  setSuggestedQuestions(response.suggested_questions);
}

onHistoryUpdate();


    } catch(error) {


      console.log(
        "CHAT ERROR:",
        error
      );


      setMessages((prev) => [

        ...prev,

        {
          role: "assistant",
          content: "Something went wrong.",
          created_at: new Date().toISOString()
        }

      ]);


    }

  };

  
  // Upload document
const handleUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {

  const file = e.target.files?.[0];

  if (!file) return;

  try {

    const result = await uploadDocument(
      file,
      conversationId,
      workspaceId,
      workspaceId ? undefined : workspaceName
);

    console.log(
      "UPLOAD RESPONSE:",
      result
    );

    const uploadedDocumentId =
      result.document_id;

    if (!uploadedDocumentId) {

      throw new Error(
        "Document ID missing from upload response"
      );

    }

   setDocumentId(result.document_id);

if (result.workspace_id) {
  setWorkspaceId(result.workspace_id);
}

if (!conversationId) {
  setConversationId(result.conversation_id);
}

    console.log(
      "STORED DOCUMENT ID:",
      uploadedDocumentId
    );

    onHistoryUpdate();

    // Clear old suggestions
    setSuggestedQuestions([]);
    setShowSuggestions(false);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `📄 ${file.name}`,
        created_at: new Date().toISOString(),
      },
      {
        role: "assistant",
        content:
          `✅ ${file.name} uploaded successfully.\n\nYou can now ask questions about this document.`,
        created_at: new Date().toISOString(),
      },
    ]);

  } catch (error) {

    console.log(
      "UPLOAD ERROR:",
      error
    );

    setSuggestedQuestions([]);
    setShowSuggestions(false);

    setUploadStatus(
      "❌ Upload failed."
    );

    setTimeout(() => {
      setUploadStatus("");
    }, 3000);

  }

};
const handleSummarize = async () => {

  if (!documentId) {

    setMessages((prev) => [

      ...prev,

      {
        role: "assistant",
        content: "Please upload a document first.",
        created_at: new Date().toISOString()
      }

    ]);

    return;

  }

  try {

    setSummarizing(true);

    const result = await summarizeDocument(
    documentId,
    conversationId!
);
    console.log("SUMMARY RESPONSE:", result);

    const text =
      `📄 Summary\n\n${result.summary}\n\nKey Points:\n\n` +
      result.key_points.map((p: string) => `• ${p}`).join("\n");

    setMessages((prev) => [

      ...prev,

      {
        role: "assistant",
        content: text,
        created_at: new Date().toISOString()
      }

    ]);

  }

  catch {

    setMessages((prev) => [

      ...prev,

      {
        role: "assistant",
        content: "Failed to summarize the document.",
        created_at: new Date().toISOString()
      }

    ]);

  }

  finally {

    setSummarizing(false);

  }

};
const handleGenerateQuestions = async () => {

  if (!documentId || generatingQuestions) {
    return;
  }

  try {

    setGeneratingQuestions(true);

    console.log(
      "========== GENERATE QUESTIONS =========="
    );

    console.log(
      "DOCUMENT ID:",
      documentId
    );

    const result = await generateSuggestedQuestions(
      documentId
    );

    console.log(
      "SUGGESTION API RESPONSE:",
      result
    );

    const questions =
      result.suggested_questions ?? [];

    if (questions.length === 0) {

      console.log(
        "No questions returned from backend."
      );

      setShowSuggestions(false);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I couldn't generate questions right now. Please try again.",
          created_at:
            new Date().toISOString(),
        },
      ]);

      return;
    }

    /*
     * Remove duplicates when generating
     * additional questions.
     */
    setSuggestedQuestions((previous) => {

      const combined = [
        ...previous,
        ...questions,
      ];

      return [...new Set(combined)].slice(0, 12);

    });

    setShowSuggestions(true);

  } catch (error) {

    console.log(
      "GENERATE QUESTIONS ERROR:",
      error
    );

    setShowSuggestions(false);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "Failed to generate suggested questions. Please try again.",
        created_at:
          new Date().toISOString(),
      },
    ]);

  } finally {

    setGeneratingQuestions(false);

  }

};
const askSuggestedQuestion = async (question: string) => {

  setMessages((prev) => [
    ...prev,
    {
      role: "user",
      content: question,
      created_at: new Date().toISOString(),
    },
  ]);

  setLoading(true);
  setInput("");

  try {

    const response = await sendMessage({
  message: question,
  conversation_id: conversationId,
  document_id: documentId,
  workspace_id: workspaceId,
  strict_document: !!documentId,
});

// Hide "Thinking..."
setLoading(false);

// Start typing animation
await typeMessage(
  response.reply,
  response.created_at
);

if (
  response.suggested_questions &&
  response.suggested_questions.length > 0
) {
  setSuggestedQuestions(response.suggested_questions);
}

onHistoryUpdate();
  } catch {

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "Something went wrong.",
        created_at: new Date().toISOString(),
      },
    ]);

  } finally {

    setLoading(false);

  }

};
const typeMessage = async (
  fullText: string,
  createdAt: string
) => {

  const chunkSize = 20;

  setMessages((prev) => [
    ...prev,
    {
      role: "assistant",
      content: "",
      created_at: createdAt,
    },
  ]);

  for (let i = 0; i < fullText.length; i += chunkSize) {

    const current = fullText.slice(0, i + chunkSize);

    await new Promise((resolve) =>
      setTimeout(resolve, 2)
    );

    setMessages((prev) => {
      const updated = [...prev];

      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        content: current,
      };

      return updated;
    });

  }

};

  return (

    <div className="chat-container">


      <div className="chat-header">

  <h1>
    🤖 Smart Support Assistant
  </h1>

  <button
    className="theme-btn"
    onClick={() =>
      setTheme(theme === "dark" ? "light" : "dark")
    }
  >
    {theme === "dark" ? "☀️" : "🌙"}
  </button>

</div>




    <div
  style={{
    padding: "10px",
    borderBottom: "1px solid #ddd",
  }}
>
  <input
    type="text"
    placeholder="🔍 Search chat..."
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    style={{
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #ccc",
    }}
  />
</div>
      <div className="messages">
      {showSelectionMenu && (
  <div
    style={{
      position: "fixed",
      left: selectionPosition.x,
      top: selectionPosition.y,
      transform: "translate(-50%, -100%)",
      background: "#202123",
      color: "#fff",
      borderRadius: "10px",
      padding: "6px",
      display: "flex",
      gap: "6px",
      zIndex: 9999,
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    }}
  >
    <button
      onClick={() => {
    setSelectedPrompt(selectedText);
    setShowSelectionMenu(false);
    window.getSelection()?.removeAllRanges();
}}
      style={{
        border: "none",
        background: "transparent",
        color: "white",
        cursor: "pointer",
        padding: "6px 10px",
      }}
    >
      🤖 Ask AI
    </button>

    <button
      onClick={async () => {
        await navigator.clipboard.writeText(selectedText);
        setShowSelectionMenu(false);
        window.getSelection()?.removeAllRanges();
      }}
      style={{
        border: "none",
        background: "transparent",
        color: "white",
        cursor: "pointer",
        padding: "6px 10px",
      }}
    >
      📋 Copy
    </button>
  </div>
)}


        {
          messages.length === 0 && (

            <div className="welcome">

              <h2>
                Welcome 👋
              </h2>

              <p>
                Ready when you are.
              </p>

            </div>

          )

        }


        {
  messages
.filter((msg) =>
  msg.content
    .toLowerCase()
    .includes(searchText.toLowerCase())
)
.map((msg, index) => (

    <div

      key={index}

      className={
        msg.role === "user"
        ?
        "message user-message"
        :
        "message assistant-message"
      }

    >
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    code({ className, children, ...props }) {
  const match = /language-(\w+)/.exec(className || "");
  const code = String(children).replace(/\n$/, "");

  return match ? (
    <>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#1e1e1e",
    color: "#ffffff",
    padding: "8px 12px",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
    borderBottom: "1px solid #3b3b3b",
  }}
>
  <span
    style={{
      fontWeight: 600,
      fontSize: "13px",
      letterSpacing: "0.5px",
    }}
  >
    {match[1].charAt(0).toUpperCase() + match[1].slice(1)}
  </span>
        <button
  onClick={async () => {
    await navigator.clipboard.writeText(code);

    setCopiedCode(code);

    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  }}
  style={{
    cursor: "pointer",
    fontSize: "12px",
    padding: "4px 8px",
    border: "none",
    borderRadius: "6px",
  }}
>
  {copiedCode === code ? "✓ Copied" : "📋 Copy Code"}
</button>
      </div>

      <SyntaxHighlighter
        style={oneDark as SyntaxHighlighterProps["style"]}
        language={match[1]}
        PreTag="div"
      >
        {code}
      </SyntaxHighlighter>
    </>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
},
  }}
>
  {fixMarkdownCode(msg.content)}
</ReactMarkdown>

      {msg.created_at && (
  <div className="message-time">
    {new Date(
      msg.created_at.endsWith("Z")
        ? msg.created_at
        : msg.created_at + "Z"
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}
  </div>
)}

      {msg.role === "assistant" && (
       <button
  onClick={async () => {
    await navigator.clipboard.writeText(msg.content);

    setCopiedMessage(index);

    setTimeout(() => {
      setCopiedMessage(null);
    }, 2000);
  }}
  style={{
    display: "block",
    marginTop: "8px",
    cursor: "pointer",
    border: "none",
    borderRadius: "6px",
    padding: "6px 10px",
  }}
>
  {copiedMessage === index ? "✓ Copied" : "📋 Copy"}
</button>
      )}


    </div>


  ))
}





        {
  (loading || summarizing) && (
    <div className="message assistant-message">
      {summarizing ? "📝 Summarizing document..." : "🤖 Thinking..."}
    </div>
  )
}
   <div ref={messagesEndRef}></div>


      </div>







      {
        uploadStatus && (

          <div className="upload-status">

            {uploadStatus}

          </div>

        )

      }
      {documentId && (

  <div className="suggested-questions">

    <button
       className="suggestion-more"
       onClick={handleGenerateQuestions}
       disabled={generatingQuestions}
    >
     {generatingQuestions
    ? "⏳ Generating..."
    : "✨ Generate Suggested Questions"}
</button>

    {showSuggestions && suggestedQuestions.length > 0 && (
      <>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "10px",
          }}
        >
          <h4>✨ Explore This Document</h4>

          <button
            className="suggestion-remove"
            onClick={() => {
              setSuggestedQuestions([]);
              setShowSuggestions(false);
            }}
          >
            ❌ 
          </button>
        </div>

        {suggestedQuestions.map((question) => (

          <button
            key={question}
            className="suggestion-chip"
            onClick={() =>
              askSuggestedQuestion(question)
            }
          >
            • {question}
          </button>

        ))}

        <button
          className="suggestion-more"
          onClick={handleGenerateQuestions}
        >
          🔄 Generate More Questions
        </button>

      </>
    )}

  </div>

)}
{selectedPrompt && (
  <div
    style={{
      margin: "10px",
      padding: "8px 12px",
      background: "var(--card-bg)",
      color: "var(--text-color)",
      border: "1px solid var(--border-color)",
      borderLeft: "4px solid #10a37f",
      borderRadius: "8px",
      fontSize: "14px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }}
  >
    <span
      style={{
        opacity: 0.8,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "90%",
      }}
    >
      {selectedPrompt}
    </span>

    <button
      onClick={() => setSelectedPrompt("")}
      style={{
        background: "transparent",
        border: "none",
        color: "var(--text-color)",
        cursor: "pointer",
        fontSize: "16px",
      }}
    >
      ✕
    </button>
  </div>
)}

      <div className="input-area">



        <input

          type="file"

          hidden

          ref={fileInputRef}

          accept="*/*"

          onChange={handleUpload}

        />
        <input
  type="file"
  hidden
  ref={imageInputRef}
  accept="image/*"
  onChange={async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Immediately show attachment in chat
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `🖼️ ${file.name}`,
        created_at: new Date().toISOString(),
      },
    ]);

    setLoading(true);

    try {
      // Upload image immediately
      setSelectedImage(file);

      // Optional assistant message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "✅ Image uploaded successfully.\n\nNow ask me anything about this image.",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Failed to upload image.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }

    e.target.value = "";
  }}
/>


        <button

          className="upload-btn"
          title="Upload Document"
          onClick={() => fileInputRef.current?.click()}

        >

          📎

        </button>
        <button
  className="upload-btn"
  title="Analyze Image"
  onClick={() =>
    imageInputRef.current?.click()
  }
>
🖼️
</button>




        <input

          type="text"

          placeholder="Ask something..."

          value={input}


          onChange={(e) =>
            setInput(e.target.value)
          }


          onKeyDown={(e) => {

            if (e.key === "Enter")

              handleSend();

          }}

        />






        <button
  className="summarize-btn"
  onClick={handleSummarize}
  disabled={summarizing}
  title="Summarize Document"
>
  📝
</button>

<button
  className="send-btn"
  title="Send Message"
  onClick={handleSend}
  disabled={loading}
>
  {loading ? "..." : "➤"}
</button>






      </div>



    </div>

  );

}