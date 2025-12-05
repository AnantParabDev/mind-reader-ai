import torch
import torch.nn as nn
import torch.optim as optim
import random
from brain import LSTMModel, INPUT_SIZE, WINDOW_SIZE

# --- GENERATE FAKE DATA ---
def generate_human_like_data(length=2000):
    data = [random.randint(1, 8)]
    keypad_neighbors = {
        1: [2, 4, 5], 2: [1, 3, 5, 4, 6], 3: [2, 5, 6],
        4: [1, 2, 5, 7, 8], 5: [1, 2, 3, 4, 6, 7, 8], 6: [2, 3, 5, 8],
        7: [4, 5, 8], 8: [4, 5, 6, 7]
    }
    for _ in range(length):
        prev = data[-1]
        decision = random.random()
        if decision < 0.1: next_num = random.randint(1, 8)
        elif decision < 0.5: next_num = random.choice(keypad_neighbors.get(prev, [1,8]))
        elif decision < 0.8: 
            step = random.choice([-1, 1])
            next_num = prev + step
            if next_num < 1: next_num = 2
            if next_num > 8: next_num = 7
        else:
            next_num = random.randint(1, 8)
            while next_num == prev: next_num = random.randint(1, 8)
        data.append(next_num)
    return data

# --- TRAINING ---
print("--- TRAINING MODE ---")
model = LSTMModel()
optimizer = optim.Adam(model.parameters(), lr=0.01)
criterion = nn.CrossEntropyLoss()
data = generate_human_like_data()

# Helper to format data
def prepare_batch(sequence):
    inputs, targets = [], []
    for i in range(len(sequence) - WINDOW_SIZE):
        window = sequence[i:i+WINDOW_SIZE]
        target = sequence[i+WINDOW_SIZE]
        window_tensor = torch.zeros(WINDOW_SIZE, INPUT_SIZE)
        for t, val in enumerate(window):
            window_tensor[t, val] = 1
        inputs.append(window_tensor)
        targets.append(target)
    return torch.stack(inputs), torch.tensor(targets, dtype=torch.long)

inputs, targets = prepare_batch(data)

for epoch in range(100):
    optimizer.zero_grad()
    outputs = model(inputs)
    loss = criterion(outputs, targets)
    loss.backward()
    optimizer.step()
    if epoch % 20 == 0: print(f"Epoch {epoch}: Loss {loss.item():.4f}")

torch.save(model.state_dict(), "human_brain_v1.pth")
print(">> Brain saved to 'human_brain_v1.pth'")