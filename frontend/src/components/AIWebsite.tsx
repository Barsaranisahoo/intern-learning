import { useState } from "react";

export default function AIWebsite() {
  const [url, setUrl] = useState("");

  const analyzeWebsite = () => {
    alert("Website AI backend will be connected in the next step.");
  };

  return (
    <div className="ai-placeholder">
      <h3>🌐 Website AI</h3>

      <p>Analyze a website and ask questions about its content.</p>

      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
      />

      <button onClick={analyzeWebsite}>
        Analyze Website
      </button>
    </div>
  );
}