import { useState } from "react";
import "./App.css";

function App() {
  const [sessionID] = useState(
    "user_" + Math.random().toString(36).substr(2, 9)
  );
  const [history, setHistory] = useState([]);
  const [aiPrediction, setAiPrediction] = useState(null);
  const [status, setStatus] = useState("AI is waiting...");
  const [scores, setScores] = useState({ ai: 0, human: 0 });

  // The numbers 1-8 for our keypad
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8];

  const handlePlay = async (number) => {
    // 1. First, tell AI to PREDICT what we are about to do (based on past)
    // In a real game, AI predicts BEFORE we click, but we fetch it now to compare.

    setStatus("Reading mind...");

    try {
      // GET PREDICTION
      const predReq = await fetch(
        "https://mind-reader-ai.onrender.com/predict",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionID }),
        }
      );
      const predData = await predReq.json();
      const aiGuess = predData.prediction;

      // UPDATE SCORE
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

      // 2. TEACH THE AI (Send your move so it learns)
      await fetch("https://mind-reader-ai.onrender.com/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionID, user_move: number }),
      });

      // Update UI History
      setHistory((prev) =>
        [{ human: number, ai: aiGuess, winner }, ...prev].slice(0, 10)
      );
    } catch (error) {
      console.error("Error:", error);
      setStatus("Error: Is the Python backend running?");
    }
  };

  return (
    <div
      style={{
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <h1>🔮 AI Mind Reader</h1>
      <p>Pick a number. The AI tries to predict it.</p>

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

      {/* KEYPAD UI */}
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

      {/* HISTORY */}
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
              You picked <b>{round.human}</b> - AI guessed <b>{round.ai}</b> (
              {round.winner === "AI" ? "AI Won" : "You Won"})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
