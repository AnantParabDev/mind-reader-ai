from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
import torch.optim as optim
import random
from brain import LSTMModel, INPUT_SIZE, WINDOW_SIZE

# --- 1. SETUP & LOAD BRAIN ---
app = FastAPI()

# Enable CORS (Allows your future frontend to talk to this backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your specific URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the Pre-trained Brain
model = LSTMModel()
try:
    model.load_state_dict(torch.load("human_brain_v1.pth"))
    model.eval() # Set to evaluation mode
    print(">> Pre-trained Brain Loaded Successfully.")
except:
    print(">> WARNING: No brain file found. Using raw random brain.")

# Optimizers for real-time learning (One per user session)
# Structure: { "session_id": { "history": [], "optimizer": ... } }
sessions = {}

# --- 2. DATA MODELS ---
class MoveRequest(BaseModel):
    session_id: str
    user_move: int # The number user JUST picked (to learn from)

class PredictRequest(BaseModel):
    session_id: str

# --- 3. HELPER FUNCTIONS ---
def get_session(session_id: str):
    if session_id not in sessions:
        # Create a new session with empty history
        sessions[session_id] = {
            "history": [],
            # We create a specific optimizer for this session to fine-tune 
            # the global model locally (simplified for this demo)
            "optimizer": optim.Adam(model.parameters(), lr=0.01) 
        }
    return sessions[session_id]

def prepare_input(sequence):
    # Convert sequence to One-Hot Tensor
    # If sequence is too short, pad with zeros
    tensor = torch.zeros(1, WINDOW_SIZE, INPUT_SIZE)
    seq_len = len(sequence)
    
    # Fill from right to left
    for i in range(min(WINDOW_SIZE, seq_len)):
        val = sequence[-(i+1)]
        tensor[0, WINDOW_SIZE-(i+1), val] = 1
    return tensor

# --- 4. API ENDPOINTS ---

@app.get("/")
def home():
    return {"status": "Mind Reader API is Online"}

@app.post("/predict")
def predict_next_move(req: PredictRequest):
    session = get_session(req.session_id)
    history = session["history"]
    
    # If not enough data, guess randomly (or use keypad logic)
    if len(history) < 1:
        return {"prediction": random.randint(1, 8), "confidence": "Low"}

    # Prepare input for Brain
    input_tensor = prepare_input(history)
    
    with torch.no_grad():
        output = model(input_tensor)
        predicted_idx = torch.argmax(output).item()
    
    # If it predicts 0 (padding), return random
    result = predicted_idx if predicted_idx != 0 else random.randint(1, 8)
    return {"prediction": result, "confidence": "High"}

@app.post("/learn")
def learn_move(req: MoveRequest):
    session = get_session(req.session_id)
    
    # 1. Update History
    session["history"].append(req.user_move)
    
    # 2. Real-time Training (Backpropagation)
    # Note: In a real massive app, we wouldn't train on global model per user.
    # We would use a 'User Embedding'. But for this demo, we update the Global Brain.
    
    if len(session["history"]) < 2:
        return {"status": "Gathering Data"}

    # Train on the last move
    optimizer = optim.Adam(model.parameters(), lr=0.01) # fast learning rate
    criterion = nn.CrossEntropyLoss()
    
    # Context (Input) -> Target (What user just played)
    context = session["history"][-WINDOW_SIZE-1 : -1] # Previous moves
    target = session["history"][-1]                   # Current move
    
    if len(context) < 1: return {"status": "Need more context"}

    input_tensor = prepare_input(context)
    target_tensor = torch.tensor([target], dtype=torch.long)
    
    optimizer.zero_grad()
    output = model(input_tensor)
    loss = criterion(output, target_tensor)
    loss.backward()
    optimizer.step()
    
    return {"status": "Learned", "loss": loss.item()}