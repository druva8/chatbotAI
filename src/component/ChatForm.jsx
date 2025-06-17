import React, { useRef } from "react";

const ChatForm = ({ chatHistory, setChatHistory, generateBotResponse }) => {
  const inputRef = useRef();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const userMessage = inputRef.current.value.trim();
    if (!userMessage) return;

    // Clear input
    inputRef.current.value = "";

    // Add user message to chat history
    const updatedHistory = [
      ...chatHistory,
      { role: "user", text: userMessage },
    ];
    setChatHistory(updatedHistory);

    // Add "Thinking..." model message after delay
    setTimeout(async () => {
      setChatHistory((history) => [
        ...history,
        { role: "model", text: "Thinking..." },
      ]);

      try {
        // Call the function to generate the bot response
        const botResponse = await generateBotResponse(updatedHistory);
        setChatHistory((history) => {
          const newHistory = history.filter(
            (msg) => msg.text !== "Thinking..."
          );
          return [
            ...newHistory,
            {
              role: "model",
              text:
                botResponse?.candidates?.[0]?.content?.parts?.[0]?.text ||
                "Sorry, I couldn't respond.",
            },
          ];
        });
      } catch (error) {
        console.error("Failed to get bot response:", error);
        setChatHistory((history) => {
          const newHistory = history.filter(
            (msg) => msg.text !== "Thinking..."
          );
          return [
            ...newHistory,
            { role: "model", text: "Error: Could not get a response." },
          ];
        });
      }
    }, 600);
  };

  return (
    <form className="chat-form" onSubmit={handleFormSubmit}>
      <input
        ref={inputRef}
        type="text"
        placeholder="Message..."
        className="message-input"
        required
      />
      <button type="submit" className="material-symbols-outlined send-btn">
        keyboard_double_arrow_up
      </button>
    </form>
  );
};

export default ChatForm;
