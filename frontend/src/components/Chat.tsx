import { useState, useRef, useEffect } from "react";

import {
  sendMessage,
  uploadDocument,
  getConversation,
  summarizeDocument
} from "../services/api";

import type { ChatMessage } from "../types/chat";


interface ChatProps {
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  onHistoryUpdate: () => void;
  
}

export default function Chat({
  conversationId,
  setConversationId,
  onHistoryUpdate
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

   const fileInputRef =
  useRef<HTMLInputElement | null>(null);

  const messagesEndRef =
  useRef<HTMLDivElement | null>(null);



  // Load previous conversation
  useEffect(() => {


    const loadConversation = async () => {

if (!conversationId) {

    setMessages([]);
    setDocumentId(null);
    return;

}


      try {


        const data = await getConversation(
          conversationId
        );
       setDocumentId(data.document_id ?? null);


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





  // Send message
  const handleSend = async () => {


    if (!input.trim() || loading)

      return;



    const userText = input;



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

  document_id: documentId,

  strict_document: !!documentId

});



      // Store new conversation id
      if (!conversationId) {

        setConversationId(
          response.conversation_id
        );

      }



      setMessages((prev) => [

        ...prev,

        {
          role: "assistant",
          content: response.reply,
          created_at: response.created_at
        }

      ]);



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



    setLoading(false);


  };







  // Upload document
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {


    const file = e.target.files?.[0];


    if (!file)

      return;



    try {


    const result = await uploadDocument(
    file,
    conversationId
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
     if (!conversationId) {
    setConversationId(result.conversation_id);
}
     




      console.log(
        "STORED DOCUMENT ID:",
        uploadedDocumentId
      );



      onHistoryUpdate();



      setUploadStatus(
        `✅ ${file.name} uploaded successfully.`
      );



      setTimeout(() => {

        setUploadStatus("");

      }, 3000);



    } catch(error) {


      console.log(
        "UPLOAD ERROR:",
        error
      );



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
const copyMessage = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    alert("Message copied!");
  } catch (error) {
    console.error("Copy failed:", error);
  }
};






  return (

    <div className="chat-container">


      <div className="chat-header">

        <h1>
          🤖 Smart Support Assistant
        </h1>

      </div>





      <div className="messages">


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
  messages.map((msg, index) => (

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

      {msg.content}

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
          onClick={() => copyMessage(msg.content)}
          style={{
            display: "block",
            marginTop: "8px",
            cursor: "pointer"
          }}
        >
          📋 Copy
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
      <div
  style={{
    display: "flex",
    justifyContent: "center",
    marginBottom: "14px"
  }}
>

  <button
    className="summarize-btn"
    onClick={handleSummarize}
    disabled={summarizing}
  >

    {

      summarizing

        ? "Summarizing..."

        : "📝 Summarize Document"

    }

  </button>

</div>

      <div className="input-area">



        <input

          type="file"

          hidden

          ref={fileInputRef}

          accept="*/*"

          onChange={handleUpload}

        />





        <button

          className="upload-btn"

          onClick={() => fileInputRef.current?.click()}

        >

          📎

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

          className="send-btn"

          onClick={handleSend}

          disabled={loading}

        >

          {
            loading
            ?
            "..."
            :
            "➤"
          }


        </button>




      </div>



    </div>

  );

}