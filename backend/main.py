from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict
import json
import os

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]]

# File paths
INSTITUTES_FILE = "institutes.json"
CONVERSATIONS_FILE = "conversations.json"

# Load institute data on startup
INSTITUTE_DATA = []

def load_institute_data():
    global INSTITUTE_DATA
    try:
        with open(INSTITUTES_FILE, "r") as f:
            INSTITUTE_DATA = json.load(f)
        print("✅ Institute data loaded.")
        print(f"Loaded institutes: {[inst['institute'] for inst in INSTITUTE_DATA]}")
    except Exception as e:
        print(f"❌ Error loading {INSTITUTES_FILE}: {e}")

# Run on startup
load_institute_data()

# Load institute-related info
def get_relevant_data(user_message: str) -> str:
    if not INSTITUTE_DATA:
        print("⚠️ No institute data available.")
        return ""

    user_message_lower = user_message.lower().strip()
    print(f"Searching for institute in message: {user_message_lower}")
    relevant_info = ""

    for institute in INSTITUTE_DATA:
        name = institute.get("institute", "").lower()
        name_words = name.split()
        institute_matched = any(word in user_message_lower for word in name_words)
        
        if institute_matched:
            print(f"Matched institute: {institute['institute']}")
            if "admission fees" in user_message_lower and "admission_fees" in institute:
                relevant_info += f"Admission fees for {institute['institute']}: {institute['admission_fees']}\n"
            if any(keyword in user_message_lower.split() for keyword in ["courses", "course"]) and "courses" in institute:  # Match "courses" or "course"
                relevant_info += f"Courses offered by {institute['institute']}: {', '.join(institute['courses'])}\n"
            if "location" in user_message_lower and "location" in institute:
                relevant_info += f"Location of {institute['institute']}: {institute['location']}\n"
            break  # Stop after the first match to avoid ambiguity
        else:
            print(f"No match for institute: {institute['institute']}")

    if not relevant_info:
        print("No relevant information found for the query.")
    return relevant_info.strip()

# Core bot logic
def generate_local_response(user_message: str, context: str) -> str:
    user_message_lower = user_message.lower().strip()
    print(f"Generating response for message: {user_message_lower}")

    # Use context if available
    if context:
        print("Using institute-specific context.")
        return f"📘 Based on our data: {context}\nAnything else I can help you with?"

    # Casual conversations
    if user_message_lower in ["hi", "hello", "hey"]:
        print("Matched casual greeting.")
        return "👋 Hello! How can I help you today?"
    elif user_message_lower in ["who are you", "who r u"]:
        print("Matched 'who are you' query.")
        return "🤖 I am a chatbot here to assist you with information about educational institutes."
    elif user_message_lower in ["how are you", "how r u"]:
        print("Matched 'how are you' query.")
        return "😊 I'm just code, but I'm functioning great!"
    elif user_message_lower in ["bye", "goodbye", "see you"]:
        print("Matched goodbye query.")
        return "👋 Goodbye! Have a great day!"
    
    # General responses
    elif "admission" in user_message_lower and "fees" in user_message_lower:
        print("Matched admission fees query.")
        return "💡 Admission fees vary by institute. Please tell me the institute name."
    elif any(keyword in user_message_lower.split() for keyword in ["courses", "course"]):  # Match "courses" or "course"
        print("Matched courses query.")
        return "📚 Most institutes offer various courses. Which institute are you asking about?"

    # Default fallback
    print("Falling back to default response.")
    return "❓ I'm not sure how to respond. Could you ask more specifically?"

# Ensure conversation log file exists
if not os.path.exists(CONVERSATIONS_FILE):
    with open(CONVERSATIONS_FILE, "w") as f:
        json.dump([], f)

# Save each conversation
def store_conversation(user_message: str, bot_response: str):
    timestamp = datetime.now().isoformat()
    new_entry = {
        "user_message": user_message,
        "bot_response": bot_response,
        "timestamp": timestamp
    }

    # Load existing
    with open(CONVERSATIONS_FILE, "r") as f:
        conversations = json.load(f)

    # Append new entry
    conversations.append(new_entry)

    # Save
    with open(CONVERSATIONS_FILE, "w") as f:
        json.dump(conversations, f, indent=4)

# 📩 POST /chat endpoint
@app.post("/chat")
async def chat(request: ChatRequest):
    user_message = request.message
    if not user_message:
        raise HTTPException(status_code=400, detail="No message provided")

    # Lookup context (e.g., courses, fees)
    context = get_relevant_data(user_message)

    # Generate response
    bot_text = generate_local_response(user_message, context)

    # Save chat
    store_conversation(user_message, bot_text)

    return {'response': bot_text}

# 📤 GET /conversations endpoint
@app.get("/conversations")
async def get_conversations():
    with open(CONVERSATIONS_FILE, "r") as f:
        return json.load(f)