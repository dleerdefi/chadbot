import React, { useState } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";

const MessageInput = () => {
	const [message, setMessage] = useState("");
	const { socket } = useWebSocket();

	const handleSubmit = (e) => {
		e.preventDefault();
		if (!message.trim()) return;

		if (socket) {
			try {
				socket.emit("chatMessage", { text: message });
				setMessage("");
			} catch (error) {
				console.error("Error sending message:", error);
				// Optionally, show an error to the user
			}
		} else {
			console.error("Socket not connected");
			// Optionally, show an error to the user
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<input
				type="text"
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				placeholder="Type your message"
			/>
			<button type="submit">Send</button>
		</form>
	);
};

export default MessageInput;
