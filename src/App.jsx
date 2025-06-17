import React, { useState, useEffect, useRef } from "react";
import ChatbotIcon from "./component/Chatboticon";
import ChatForm from "./component/ChatForm";
import ChatMessage from "./component/ChatMessage";
import { Institution } from "./component/institution";

const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // Fixed: Removed invalid Institution usage
  const [storedConversations, setStoredConversations] = useState([]);
  const chatBodyRef = useRef();

  useEffect(() => {
    const fetchStoredConversations = async () => {
      try {
        const response = await fetch("http://localhost:8000/conversations");
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        const formatted = data
          .map((conv) => [
            { role: "user", text: conv.user_message },
            { role: "bot", text: conv.bot_response },
          ])
          .flat();
        setStoredConversations(formatted);
      } catch (err) {
        console.error("Error fetching stored conversations:", err.message);
      }
    };
    fetchStoredConversations();
  }, []);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory, storedConversations]);

  const generateBotResponse = async (history) => {
    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: history[history.length - 1].text,
          history,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      return {
        candidates: [{ content: { parts: [{ text: data.response }] } }],
      };
    } catch (err) {
      console.error("Error in generateBotResponse:", err.message);
      throw err;
    }
  };

  return (
    <div className="container">
      {/* Toggle Button */}
      <button
        className="chat-toggler"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close Chatbot" : "Open Chatbot"}
        aria-label={isOpen ? "Close Chatbot" : "Open Chatbot"} // Added for accessibility
      >
        <span className="material-symbols-rounded">
          {isOpen ? "close" : "mode_comment"}
        </span>
      </button>

      {/* Chatbot Popup */}
      {isOpen && (
        <div className="chatbot-popup">
          {/* Header */}
          <div className="chat-header">
            <div className="header-info">
              <ChatbotIcon inHeader={true} />
              <h2 className="logo-text">Chatbot</h2>
            </div>
          </div>

          {/* Body */}
          <div className="chat-body" ref={chatBodyRef}>
            <div className="message bot-message">
              <ChatbotIcon />
              <p className="message-text">
                Hey there 👋
                <br />
                How can I help you today?
              </p>
            </div>

            {storedConversations.map((chat, i) => (
              <ChatMessage key={`stored-${i}`} chat={chat} />
            ))}
            {chatHistory.map((chat, i) => (
              <ChatMessage key={`live-${i}`} chat={chat} />
            ))}
          </div>

          {/* Footer */}
          <div className="chat-footer">
            <ChatForm
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              generateBotResponse={generateBotResponse}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
