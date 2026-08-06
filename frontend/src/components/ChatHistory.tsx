import { useEffect, useState } from "react";
import { getConversations } from "../services/api";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  document_id: string | null;
  document_name: string | null;
}

interface Props {
  onSelectConversation: (id: string) => void;
  refresh: number;
}

export default function ChatHistory({
  onSelectConversation,
  refresh,
}: Props) {

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  useEffect(() => {

    const loadHistory = async () => {

      try {

        const chats = await getConversations();

        setConversations(chats);

      } catch (error) {

        console.log(
          "History loading error",
          error
        );

      }

    };

    loadHistory();

  }, [refresh]);

  return (

  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      marginTop: "20px",
    }}
  >

    <div className="card" style={{ marginBottom: 0 }}>

      <h2>History</h2>

    </div>

    <div
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        paddingRight: "6px",
      }}
    >

      {conversations.length === 0 ? (

        <p style={{ color: "#94a3b8" }}>
          No history yet
        </p>

      ) : (

        conversations.map((chat) => (

          <div
            key={chat.id}
            className="document-item"
            onClick={() =>
              onSelectConversation(chat.id)
            }
          >

            {chat.document_name ? (
              <>📄 {chat.document_name}</>
            ) : (
              <>💬 {chat.title}</>
            )}

          </div>

        ))

      )}

    </div>

  </div>

);}