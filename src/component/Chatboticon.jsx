import React from "react";

const ChatbotIcon = ({ inHeader = false }) => {
  return (
    <div className={`chatbot-icon ${inHeader ? "header-icon" : "body-icon"}`}>
      <span className="material-symbols-outlined">smart_toy</span>
    </div>
  );
};

export default ChatbotIcon;
