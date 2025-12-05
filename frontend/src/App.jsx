import { useState, useEffect } from "react"; // <--- CHANGED: Added useEffect
import "./App.css";

function App() {
  const [sessionID] = useState(
    "user_" + Math.random().toString(36).substr(2, 9)
  );
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("AI is waiting...");
  const [scores, setScores] = useState({ ai: 0, human: 0 });

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8];

  const handlePlay = async (number) => {
    setStatus("Reading mind...");

    try {
      // 1. Get Prediction
      const predReq = await fetch(
        "https://mind-reader-api.onrender.com/predict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionID }),
        }
      );
      const predData = await predReq.json();
      const aiGuess = predData.prediction;

      // 2. Determine Winner
      let winner = "";
      if (aiGuess === number) {
        winner = "AI";
        setScores((s) => ({ ...s, ai: s.ai + 1 }));
        setStatus(`AI WON! It predicted ${aiGuess}`);
      } else {
        winner = "Human";
        setScores((s) => ({ ...s, human: s.human + 1 }));
        setStatus(`YOU WON! AI guessed ${aiGuess}`);
      }

      // 3. Teach AI
      await fetch("https://mind-reader-api.onrender.com/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionID, user_move: number }),
      });

      setHistory((prev) =>
        [{ human: number, ai: aiGuess, winner }, ...prev].slice(0, 10)
      );
    } catch (error) {
      console.error("Error:", error);
      setStatus("Error: Backend offline?");
    }
  };

  // --- NEW CODE: KEYBOARD LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if the key pressed is '1', '2', ... '8'
      if (e.key >= "1" && e.key <= "8") {
        handlePlay(parseInt(e.key));
      }
    };

    // Attach listener to window
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup: Remove listener when component unmounts (Important!)
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Empty brackets [] means "run this only once when app loads"
  // ------------------------------------

  return (
    <div
      style={{
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <h1>🔮 AI Mind Reader</h1>
      <p>Press 1-8 on your keyboard or click the buttons.</p>

      <div
        style={{
          margin: "20px",
          padding: "10px",
          border: "1px solid #ccc",
          display: "inline-block",
          borderRadius: "10px",
        }}
      >
        <h3>Scoreboard</h3>
        <p>
          🤖 AI: {scores.ai} | 👤 You: {scores.human}
        </p>
      </div>

      <h2>{status}</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          maxWidth: "200px",
          margin: "0 auto",
        }}
      >
        {numbers.map((num) => (
          <button
            key={num}
            onClick={() => handlePlay(num)}
            style={{
              padding: "20px",
              fontSize: "20px",
              cursor: "pointer",
              backgroundColor: "#333",
              color: "white",
              border: "none",
              borderRadius: "5px",
            }}
          >
            {num}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Last 10 Rounds</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {history.map((round, i) => (
            <li
              key={i}
              style={{
                color: round.winner === "AI" ? "red" : "green",
                margin: "5px",
              }}
            >
              You: <b>{round.human}</b> - AI: <b>{round.ai}</b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
