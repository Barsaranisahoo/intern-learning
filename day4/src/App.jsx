import { useState } from "react";

function App() {
  const [notes, setNotes] = useState([]);
  const [input, setInput] = useState("");

  console.log("Notes:", notes);

  const addNote = () => {
    console.log("Button clicked");

    if (!input.trim()) {
      console.log("Input is empty");
      return;
    }

    const newNote = {
      id: Date.now(),
      text: input,
    };

    console.log("New note:", newNote);

    setNotes([...notes, newNote]);
    setInput("");
  };

  const deleteNote = (id) => {
    setNotes(notes.filter((note) => note.id !== id));
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