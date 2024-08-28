import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useWebSocket } from "../../contexts/WebSocketContext";
import axios from "axios";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import AutocompleteInput from "../AutocompleteInput/AutocompleteInput";
import Message from "../Message/Message";
import "./ChatWindow.css";
import { useApp } from "../../contexts/AppContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const ChatWindow = () => {
	const { user } = useAuth();
	const { setError } = useApp();
	const {
		socket,
		sendMessage,
		messages,
		setMessages,
		setOnlineUsers,
		typingBots,
		users,
		inputPrefix,
		setInputPrefix,
		selectedUser,
		setSelectedUser,
		cardPosition,
		handleUserClick,
	} = useWebSocket();
	const [input, setInput] = useState("");

	const messagesEndRef = useRef(null);

	const sanitizeInput = useCallback((input) => {
		return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}, []);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	const handleBanByUsername = useCallback(
		async (username) => {
			try {
				const response = await axios.post(
					`${API_URL}/api/ban-user-by-username`,
					{ username },
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
							"Content-Type": "application/json",
						},
					}
				);

				if (response.data.success) {
					setError(
						`User ${username} has been banned successfully and their messages have been removed.`
					);
				} else {
					setError(response.data.message);
				}
			} catch (error) {
				console.error(
					"Error banning user:",
					error.response ? error.response.data : error.message
				);
				setError(
					`Failed to ban user: ${
						error.response ? error.response.data.message : error.message
					}`
				);
			}
		},
		[user, setError]
	);
	const handleUnbanByUsername = useCallback(
		async (username) => {
			try {
				const response = await axios.post(
					`${API_URL}/api/unban-user-by-username`,
					{ username },
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
							"Content-Type": "application/json",
						},
					}
				);
				console.log("Unban response:", response.data);
				if (response.data.success) {
					setError(`User ${username} has been unbanned successfully.`);
				} else {
					setError(response.data.message);
				}
			} catch (error) {
				console.error(
					"Error unbanning user:",
					error.response ? error.response.data : error.message
				);
				setError(
					`Failed to unban user: ${
						error.response ? error.response.data.message : error.message
					}`
				);
			}
		},
		[user, setError]
	);

	const handleUnbanUser = useCallback(
		async (messageUserId) => {
			console.log("Attempting to unban user with ID:", messageUserId);
			try {
				const response = await axios.post(
					`${API_URL}/api/unban-user`,
					{ userId: messageUserId },
					{
						headers: {
							Authorization: `Bearer ${user.token}`,
							"Content-Type": "application/json",
						},
					}
				);
				console.log("Unban response:", response.data);
				setMessages((prevMessages) =>
					prevMessages.map((msg) =>
						msg.user._id === messageUserId
							? { ...msg, user: { ...msg.user, isBanned: false } }
							: msg
					)
				);
				setError("User has been unbanned successfully.");
			} catch (error) {
				console.error(
					"Error unbanning user:",
					error.response ? error.response.data : error.message
				);
				setError(
					`Failed to unban user: ${
						error.response ? error.response.data.message : error.message
					}`
				);
			}
		},
		[user, setMessages, setError]
	);
	const handleSendMessage = useCallback(
		async (event) => {
			event.preventDefault();
			if (!input.trim() || !user || !socket) return;

			const sanitizedInput = sanitizeInput(input);

			if (user.isBanned) {
				setError("You are banned and cannot send messages.");
				return;
			}

			// Check for admin commands
			if (user.isAdmin && sanitizedInput.startsWith("/")) {
				const [command, username] = sanitizedInput.split(" ");
				if (username) {
					switch (command) {
						case "/ban":
							handleBanByUsername(username);
							break;
						case "/unban":
							handleUnbanByUsername(username);
							break;
						default:
							setError(
								"Invalid command. Available commands: /ban username, /unban username"
							);
					}
				} else {
					setError("Invalid command format. Use: /command username");
				}
				setInput("");
				return;
			}

			try {
				sendMessage({
					text: inputPrefix + sanitizedInput,
					userId: user._id,
					room: "general",
				});
				setInput("");
				setInputPrefix("");
			} catch (err) {}
		},
		[
			input,
			inputPrefix,
			user,
			socket,
			sanitizeInput,
			setError,
			handleBanByUsername,
			handleUnbanByUsername,
			sendMessage,
		]
	);

	const closeProfileCard = useCallback(() => {
		setSelectedUser(null);
	}, []);

	const handleDeleteMessage = useCallback(
		async (messageId) => {
			console.log("Attempting to delete message with ID:", messageId);
			if (!messageId) {
				console.error("Invalid message ID");
				setError("Cannot delete message: Invalid ID");
				return;
			}
			try {
				await axios.delete(`${API_URL}/api/messages/${messageId}`, {
					headers: { Authorization: `Bearer ${user.token}` },
				});
				setMessages((prevMessages) =>
					prevMessages.filter((msg) => msg.id !== messageId && msg._id !== messageId)
				);
				setError("Message deleted successfully.");
			} catch (error) {
				console.error("Error deleting message:", error);
				setError("Failed to delete message. Please try again.");
			}
		},
		[user, setMessages, setError]
	);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (selectedUser && !event.target.closest(".user-profile-card")) {
				closeProfileCard();
			}
		};

		document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, [selectedUser, closeProfileCard]);

	useEffect(() => {
		if (socket) {
			const handleInitialOnlineUsers = (initialOnlineUsers) => {
				setOnlineUsers(initialOnlineUsers);
			};

			const handleUserStatusUpdate = ({ userId, status }) => {
				setOnlineUsers((prev) =>
					status === "online"
						? [...new Set([...prev, userId])]
						: prev.filter((id) => id !== userId)
				);
			};

			socket.on("initialOnlineUsers", handleInitialOnlineUsers);
			socket.on("userStatusUpdate", handleUserStatusUpdate);

			socket.emit("getInitialOnlineUsers");

			return () => {
				socket.off("initialOnlineUsers", handleInitialOnlineUsers);
				socket.off("userStatusUpdate", handleUserStatusUpdate);
			};
		}
	}, [socket]);

	return (
		<div className="chat-window">
			<div className="main-chat">
				<h1>Chat with the greatest Pickup Artists of all time</h1>
				<div className="message-area">
					{messages.map((message) => (
						<Message
							handleUnbanUser={handleUnbanUser}
							handleBanByUsername={handleBanByUsername}
							handleDeleteMessage={handleDeleteMessage}
							handleUserClick={handleUserClick}
							user={user}
							key={message.id || message._id}
							message={message}
						/>
					))}
					{Object.entries(typingBots).map(
						([botName, isTyping]) =>
							isTyping && (
								<div key={botName} className="typing-indicator">
									{botName} is typing...
								</div>
							)
					)}
					<div ref={messagesEndRef} />
				</div>
				<form onSubmit={handleSendMessage} className="message-input">
					<AutocompleteInput
						value={inputPrefix + input}
						onChange={(newValue) => {
							if (newValue.startsWith(inputPrefix)) {
								setInput(newValue.slice(inputPrefix.length));
							} else {
								setInput(newValue);
								setInputPrefix("");
							}
						}}
						onSubmit={handleSendMessage}
						users={users}
						prefix={inputPrefix}
					/>
					<button type="submit">Send</button>
				</form>
			</div>
			{selectedUser && (
				<UserProfileCard
					user={selectedUser}
					position={cardPosition}
					onClose={() => setSelectedUser(null)}
				/>
			)}
		</div>
	);
};

export default React.memo(ChatWindow);
