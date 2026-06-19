import { useState } from "react";

function App() {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState("");

  const addNote = () => {
    if (!input.trim()) return;

    setNotes([
      ...notes,
      {
        id: Date.now(),
        text: input,
      },
    ]);

    setInput("");
  };

  const deleteNote = (id) => {
  setNotes((prev) => prev.filter((note) => note.id !== id));
};

  return (
    <div>
      <h1>Notes App</h1>

      <input
        type="text"
        placeholder="Enter a note"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={addNote}>Add</button>

      <ul>
        {notes.map((note) => (
          <li key={note.id}>
            {note.text}
            <button onClick={() => deleteNote(note.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;