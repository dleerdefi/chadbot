import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket } from "../contexts/WebSocketContext";
import axios from "axios";
import moment from "moment";
import Sidebar from "./Sidebar";
import AccountSection from "../pages/Account/Account";
import UserProfileCard from "./UserProfileCard";
import AutocompleteInput from "./AutocompleteInput";
import headerImage from "../images/header-image.png";
import "../ChatWindow.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const ChatWindow = () => {
	const { user, setUser } = useAuth();
	const { socket, sendMessage, messages, updateMessages } = useWebSocket();
	const [allUsers, setAllUsers] = useState([]);
	const [bots, setBots] = useState([]);
	const [input, setInput] = useState("");
	const [error, setError] = useState(null);
	const [errorTimeout, setErrorTimeout] = useState(null);
	const [selectedUser, setSelectedUser] = useState(null);
	const [cardPosition, setCardPosition] = useState({
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
	});
	const messagesEndRef = useRef(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const [botsLoading, setBotsLoading] = useState(true);
	const [typingBots, setTypingBots] = useState({});
	const [inputPrefix, setInputPrefix] = useState("");

	const showError = useCallback(
		(message, duration = 5000) => {
			setError(message);
			if (errorTimeout) clearTimeout(errorTimeout);
			const timeout = setTimeout(() => setError(null), duration);
			setErrorTimeout(timeout);
		},
		[errorTimeout]
	);

	const sanitizeInput = useCallback((input) => {
		return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}, []);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);
	// Use scrollToBottom in useEffect
	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom]);

	const handleUserStatusUpdate = useCallback(({ userId, status }) => {
		console.log(`User ${userId} status updated to ${status}`);
		setOnlineUsers((prevOnlineUsers) => {
			if (status === "online" && !prevOnlineUsers.includes(userId)) {
				return [...prevOnlineUsers, userId];
			} else if (status === "offline") {
				return prevOnlineUsers.filter((id) => id !== userId);
			}
			return prevOnlineUsers;
		});
		setAllUsers((prevUsers) =>
			prevUsers.map((user) =>
				user._id === userId && !user.isBot
					? { ...user, isOnline: status === "online" }
					: user
			)
		);
	}, []);

	const handleRateLimitError = useCallback(
		(error) => {
			console.error("Rate limit error:", error);
			showError(`Rate limit exceeded: ${error.message}`);
		},
		[showError]
	);

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
				console.log("Ban response:", response.data);
				if (response.data.success) {
					showError(
						`User ${username} has been banned successfully and their messages have been removed.`
					);
					// The messages will be removed by the 'userBanned' socket event
				} else {
					showError(response.data.message);
				}
			} catch (error) {
				console.error(
					"Error banning user:",
					error.response ? error.response.data : error.message
				);
				showError(
					`Failed to ban user: ${
						error.response ? error.response.data.message : error.message
					}`
				);
			}
		},
		[user, showError]
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
					showError(`User ${username} has been unbanned successfully.`);
					// Optionally, you can update the messages or user list here
				} else {
					showError(response.data.message);
				}
			} catch (error) {
				console.error(
					"Error unbanning user:",
					error.response ? error.response.data : error.message
				);
				showError(
					`Failed to unban user: ${
						error.response ? error.response.data.message : error.message
					}`
				);
			}
		},
		[user, showError]
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
				updateMessages((prevMessages) =>
					prevMessages.map((msg) =>
						msg.user._id === messageUserId
							? { ...msg, user: { ...msg.user, isBanned: false } }
							: msg
					)
				);
				showError("User has been unbanned successfully.");
			} catch (error) {
				console.error(
					"Error unbanning user:",
					error.response ? error.response.data : error.message
				);
				showError(
					`Failed to unban user: ${
						error.response ? error.response.data.message : error.message
					}`
				);
			}
		},
		[user, updateMessages, showError]
	);
	const handleSendMessage = useCallback(
		async (event) => {
			event.preventDefault();
			if (!input.trim() || !user || !socket) return;

			const sanitizedInput = sanitizeInput(input);

			if (user.isBanned) {
				showError("You are banned and cannot send messages.");
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
							showError(
								"Invalid command. Available commands: /ban username, /unban username"
							);
					}
				} else {
					showError("Invalid command format. Use: /command username");
				}
				setInput("");
				return;
			}

			try {
				console.log("Attempting to send message");
				sendMessage({
					text: inputPrefix + sanitizedInput, // Include the prefix in the sent message
					userId: user._id,
					room: "general",
				});
				setInput("");
				setInputPrefix(""); // Clear the prefix after sending
			} catch (error) {
				// ... existing error handling ...
			}
		},
		[
			input,
			inputPrefix,
			user,
			socket,
			sanitizeInput,
			showError,
			handleBanByUsername,
			handleUnbanByUsername,
			sendMessage,
		]
	);
	const handleUserClick = useCallback((clickedUser, showProfile, event) => {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		console.log("User clicked:", clickedUser, "Show Profile:", showProfile);
		if (showProfile) {
			setSelectedUser(clickedUser);
			const newPosition = {
				top: `${event.clientY}px`,
				left: `${event.clientX}px`,
				transform: "translate(-50%, -50%)",
			};
			setCardPosition(newPosition);
			console.log("UserProfileCard position set to:", newPosition);
		} else {
			setInputPrefix(`@${clickedUser.username || clickedUser.name} `);
		}
	}, []);

	const handleBotClick = useCallback((bot) => {
		console.log("Bot clicked:", bot);
		setInputPrefix(`@${bot.name} `);
		// You can add additional logic here for bot interactions if needed
	}, []);

	const closeProfileCard = useCallback(() => {
		setSelectedUser(null);
	}, []);

	const handleDeleteMessage = useCallback(
		async (messageId) => {
			console.log("Attempting to delete message with ID:", messageId);
			if (!messageId) {
				console.error("Invalid message ID");
				showError("Cannot delete message: Invalid ID");
				return;
			}
			try {
				await axios.delete(`${API_URL}/api/messages/${messageId}`, {
					headers: { Authorization: `Bearer ${user.token}` },
				});
				updateMessages((prevMessages) =>
					prevMessages.filter((msg) => msg.id !== messageId && msg._id !== messageId)
				);
				showError("Message deleted successfully.");
			} catch (error) {
				console.error("Error deleting message:", error);
				showError("Failed to delete message. Please try again.");
			}
		},
		[user, updateMessages, showError]
	);
	const fetchUsers = useCallback(async () => {
		if (!user || !user.token) return;
		try {
			console.log("Fetching users...");
			const response = await axios.get(`${API_URL}/api/all-users`, {
				headers: {
					Authorization: `Bearer ${user.token}`,
				},
			});
			console.log("Users fetched:", JSON.stringify(response.data, null, 2));
			const usersWithOnlineStatus = response.data.map((u) => ({
				...u,
				isOnline: u.isBot || onlineUsers.includes(u._id),
				bio: u.bio, // Include bio here
			}));
			setAllUsers(usersWithOnlineStatus);
		} catch (error) {
			console.error(
				"Error fetching users:",
				error.response ? error.response.data : error.message
			);
			showError(`Failed to load users. Please try again later.`);
		}
	}, [user, showError, onlineUsers]);

	const fetchBots = useCallback(async () => {
		setBotsLoading(true);
		try {
			console.log("Fetching bots...");
			const response = await axios.get(`${API_URL}/api/bots`);
			console.log("Bots fetched:", JSON.stringify(response.data, null, 2));
			const botsWithOnlineStatus = response.data.map((bot) => ({
				...bot,
				isBot: true,
				isOnline: true,
				_id: bot._id || bot.id, // Ensure bots have a consistent _id property
				bio: bot.bio, // Include bio here
			}));
			setBots(botsWithOnlineStatus);
		} catch (error) {
			console.error(
				"Error fetching bots:",
				error.response ? error.response.data : error.message
			);
			showError(
				`Failed to load bots. Error: ${
					error.response ? JSON.stringify(error.response.data) : error.message
				}`
			);
		} finally {
			setBotsLoading(false);
		}
	}, [showError]);
	useEffect(() => {
		if (user && user.token) {
			fetchUsers();
			fetchBots();
		}
	}, [fetchUsers, fetchBots, user]);

	useEffect(() => {
		if (socket) {
			console.log("Socket connected in ChatWindow");

			const handleNewMessage = (message) => {
				console.log("Received new message:", message);
				updateMessages((prevMessages) => {
					if (!prevMessages.some((msg) => msg.id === message.id)) {
						return [...prevMessages, message];
					}
					return prevMessages;
				});
			};

			const handleInitialMessages = (initialMessages) => {
				console.log("Received initial messages:", initialMessages);
				updateMessages(() => initialMessages.reverse());
			};

			const handleUserBanned = ({ userId, username }) => {
				console.log(`User ${username} has been banned. Removing their messages.`);
				updateMessages((prevMessages) =>
					prevMessages.filter((msg) => msg.user._id !== userId)
				);
			};

			const handleUserUnbanned = ({ userId, username }) => {
				console.log(`User ${username} has been unbanned.`);
				// Optionally, you can update the UI to reflect the unbanned status
			};

			socket.on("message", handleNewMessage);
			socket.on("initialMessages", handleInitialMessages);
			socket.on("userBanned", handleUserBanned);
			socket.on("userUnbanned", handleUserUnbanned);
			socket.on("userStatusUpdate", handleUserStatusUpdate);
			socket.on("rateLimitError", handleRateLimitError);
			socket.on("error", (error) => {
				console.error("Socket error:", error);
				showError(`Socket error: ${error.message}`);
			});

			socket.emit("getInitialMessages"); // Request initial messages

			return () => {
				console.log("Cleaning up socket listeners");
				socket.off("message", handleNewMessage);
				socket.off("initialMessages", handleInitialMessages);
				socket.off("userBanned", handleUserBanned);
				socket.off("userUnbanned", handleUserUnbanned);
				socket.off("userStatusUpdate", handleUserStatusUpdate);
				socket.off("rateLimitError", handleRateLimitError);
				socket.off("error");
			};
		} else {
			console.log("No socket connection in ChatWindow");
		}
	}, [socket, updateMessages, handleUserStatusUpdate, handleRateLimitError, showError]);

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
			socket.on("botTyping", ({ botName, isTyping }) => {
				setTypingBots((prev) => ({ ...prev, [botName]: isTyping }));
			});

			return () => {
				socket.off("botTyping");
			};
		}
	}, [socket]);

	useEffect(() => {
		if (socket) {
			const handleInitialOnlineUsers = (initialOnlineUsers) => {
				console.log("Received initial online users:", initialOnlineUsers);
				setOnlineUsers(initialOnlineUsers);
			};

			const handleUserStatusUpdate = ({ userId, status }) => {
				console.log(`User ${userId} status updated to ${status}`);
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
	const Message = useMemo(
		() =>
			React.memo(({ message }) => (
				<div key={message.id || message._id} className="message">
					<img
						src={
							message.user && message.user.profilePic
								? `${API_URL}${message.user.profilePic}`
								: "/default-avatar.png"
						}
						alt="Profile"
						className="profile-pic clickable"
						onClick={(event) =>
							message.user && handleUserClick(message.user, true, event)
						}
					/>
					<div className="message-content">
						<strong
							className="clickable"
							onClick={(event) =>
								message.user && handleUserClick(message.user, false, event)
							}
						>
							{message.user ? message.user.name : "Unknown User"}
						</strong>
						: {message.text} {/* Add this line to display the message text */}
						<span className="timestamp">
							{moment(message.createdAt).format("MMMM Do YYYY, h:mm:ss a")}
						</span>
						{user.isAdmin && message.user && message.user._id !== user._id && (
							<div className="admin-controls">
								<button onClick={() => handleDeleteMessage(message.id)}>
									Delete
								</button>
								{message.user.isBanned ? (
									<button onClick={() => handleUnbanUser(message.user._id)}>
										Unban User
									</button>
								) : (
									<button onClick={() => handleBanByUsername(message.user.name)}>
										Ban User
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			)),
		[handleUserClick, user, handleDeleteMessage, handleUnbanUser, handleBanByUsername]
	);
	if (!user) {
		return <div>No user data available. Please try logging in again.</div>;
	}

	return (
		<div className="chat-window-container">
			<div className="header-image" style={{ backgroundImage: `url(${headerImage})` }}></div>
			<div className="chat-window">
				<Sidebar
					users={allUsers}
					bots={bots}
					onUserClick={handleUserClick}
					onBotClick={handleBotClick}
					onProfileClick={(user) => setSelectedUser(user)}
					onlineUsers={onlineUsers}
					botsLoading={botsLoading}
				/>
				<div className="main-chat">
					<h1>Chat with the greatest Pickup Artists of all time</h1>
					{error && <div style={{ color: "red" }}>{error}</div>}
					<div className="message-area">
						{messages.map((message) => (
							<Message key={message.id || message._id} message={message} />
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
							users={allUsers}
							prefix={inputPrefix}
						/>
						<button type="submit">Send</button>
					</form>
				</div>
				<AccountSection user={user} setUser={setUser} />
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
