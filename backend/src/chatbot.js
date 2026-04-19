import { useState } from "react";

function Chatbot() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        userData: {
          skills: ["React", "Node"],
          contributions: 45,
          level: "Silver",
        },
      }),
    });

    const data = await res.json();

    setChat([
      ...chat,
      { type: "user", text: message },
      { type: "ai", text: data.reply },
    ]);

    setMessage("");
  };

  return (
    <div className="fixed bottom-5 right-5 w-80 bg-gray-900 p-4 rounded-lg">
      <div className="h-60 overflow-y-auto text-white">
        {chat.map((msg, i) => (
          <p key={i} className={msg.type === "ai" ? "text-green-400" : ""}>
            {msg.text}
          </p>
        ))}
      </div>

      <input
        className="w-full p-2 mt-2"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button onClick={sendMessage} className="mt-2 bg-blue-500 p-2 w-full">
        Send
      </button>
    </div>
  );
}

export default Chatbot;

