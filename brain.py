import torch
import torch.nn as nn

# --- CONFIGURATION (Must match everywhere) ---
INPUT_SIZE = 9  # 0-8 (0 is padding)
HIDDEN_SIZE = 64
LAYERS = 1
WINDOW_SIZE = 5 # How many steps back the AI looks

class LSTMModel(nn.Module):
    def __init__(self):
        super(LSTMModel, self).__init__()
        self.lstm = nn.LSTM(INPUT_SIZE, HIDDEN_SIZE, LAYERS, batch_first=True)
        self.fc = nn.Linear(HIDDEN_SIZE, INPUT_SIZE) 

    def forward(self, x):
        # x shape: (batch, sequence_length, features)
        out, _ = self.lstm(x)
        # We only care about the last prediction
        out = self.fc(out[:, -1, :]) 
        return out