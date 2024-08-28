import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { useApp } from "./AppContext";

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [messages, setMessages] = useState([]);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const [users, setUsers] = useState([]);
	const [bots, setBots] = useState([]);
	const [isBotLoading, setIsBotLoading] = useState(true);
	const [typingBots, setTypingBots] = useState({});
	const [inputPrefix, setInputPrefix] = useState("");
	const [selectedUser, setSelectedUser] = useState(null);
	const [cardPosition, setCardPosition] = useState({
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
	});
	const { user } = useAuth();
	const { setError, setSuccess } = useApp();

	const fetchUsers = useCallback(async () => {
		try {
			const response = await axiosInstance.get(`/api/all-users`);
			const usersWithOnlineStatus = response.data.map((u) => ({
				...u,
				isOnline: u.isBot || onlineUsers.includes(u._id),
				bio: u.bio,
			}));

			setUsers(usersWithOnlineStatus);
		} catch (err) {
			if (err.response?.data.message) {
				setError(err.response.data.message);
			} else {
				setError(err.message);
			}
		}
	}, [setError, onlineUsers]);

	const fetchBots = useCallback(async () => {
		try {
			setIsBotLoading(true);
			const response = await axiosInstance.get(`/api/bots`);
			const botsWithOnlineStatus = response.data.map((bot) => ({
				...bot,
				isBot: true,
				isOnline: true,
				_id: bot._id || bot.id,
				bio: bot.bio,
			}));

			setBots(botsWithOnlineStatus);
		} catch (err) {
			if (err.response?.data.message) {
				setError(err.response.data.message);
			} else {
				setError(err.message);
			}
		} finally {
			setIsBotLoading(false);
		}
	}, [setError]);

	const sendMessage = useCallback(
		(message) => {
			if (socket) {
				console.log("Sending message:", message);
				socket.emit("chatMessage", message);
			} else {
				console.error("Cannot send message: WebSocket is not connected");
				setError("Cannot send message: WebSocket is not connected");
			}
		},
		[socket]
	);

	const handleUserStatusUpdate = useCallback(
		({ userId, status }) => {
			let updatedOnlineUsers = [...onlineUsers];

			if (status === "online" && !onlineUsers.includes(userId)) {
				updatedOnlineUsers.push(userId);
			} else if (status === "offline") {
				updatedOnlineUsers = onlineUsers.filter((id) => id !== userId);
			}

			setOnlineUsers(updatedOnlineUsers);

			const updatedUsers = users.map((user) =>
				user._id === userId && !user.isBot
					? { ...user, isOnline: status === "online" }
					: user
			);
			setUsers(updatedUsers);
		},
		[onlineUsers]
	);

	const handleRateLimitError = useCallback(
		(error) => {
			console.error("Rate limit error:", error);
			setError(`Rate limit exceeded: ${error.message}`);
		},
		[setError]
	);

	const handleUserClick = useCallback((clickedUser, showProfile, event) => {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		if (showProfile) {
			setSelectedUser(clickedUser);
			const newPosition = {
				top: `${event.clientY}px`,
				left: `${event.clientX}px`,
				transform: "translate(-50%, -50%)",
			};
			setCardPosition(newPosition);
		} else {
			setInputPrefix(`@${clickedUser.username || clickedUser.name} `);
		}
	}, []);

	useEffect(() => {
		if (user) {
			fetchUsers();
			fetchBots();
		}
	}, [user]);

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
		if (user && user.token) {
			const newSocket = io(process.env.REACT_APP_API_URL || "http://localhost:3000", {
				auth: { token: user.token },
				query: { token: user.token },
				transports: ["websocket"],
			});

			newSocket.on("connect", () => {
				setSocket(newSocket);
			});

			newSocket.on("connect_error", (error) => {
				console.error("WebSocket connection error:", error);
			});

			newSocket.on("disconnect", (reason) => {
				console.log(`WebSocket disconnected: ${reason}`);
				setError(`Chat is offline now`);
				setSocket(null);
			});

			newSocket.on("message", (message) => {
				setMessages((prevMessages) => [...prevMessages, message]);
				setSuccess("New incoming message");
			});

			return () => {
				if (newSocket) {
					console.log("Cleaning up WebSocket connection");
					setError(`Chat is offline now`);
					newSocket.disconnect();
				}
			};
		}
	}, [user]);

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

	useEffect(() => {
		if (socket) {
			const handleNewMessage = (message) => {
				setMessages((prevMessages) => {
					if (!prevMessages.some((msg) => msg.id === message.id)) {
						return [...prevMessages, message];
					}
					return prevMessages;
				});
			};

			const handleInitialMessages = (initialMessages) => {
				setMessages(() => initialMessages.reverse());
			};

			const handleUserBanned = ({ userId, username }) => {
				console.log(`User ${username} has been banned. Removing their messages.`);
				setMessages((prevMessages) =>
					prevMessages.filter((msg) => msg.user._id !== userId)
				);
			};

			const handleUserUnbanned = ({ userId, username }) => {
				console.log(`User ${username} has been unbanned.`);
			};

			socket.on("message", handleNewMessage);
			socket.on("initialMessages", handleInitialMessages);
			socket.on("userBanned", handleUserBanned);
			socket.on("userUnbanned", handleUserUnbanned);
			socket.on("userStatusUpdate", handleUserStatusUpdate);
			socket.on("rateLimitError", handleRateLimitError);
			socket.on("error", (error) => {
				setError(`Socket error: ${error.message}`);
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
		}
	}, [socket, setMessages, handleUserStatusUpdate, handleRateLimitError, setError]);

	const contextValue = {
		socket,
		messages,
		sendMessage,
		setMessages,
		onlineUsers,
		setOnlineUsers,
		bots,
		users,
		isBotLoading,
		typingBots,
		setUsers,
		inputPrefix,
		setInputPrefix,
		selectedUser,
		setSelectedUser,
		cardPosition,
		setCardPosition,
		handleUserClick,
	};

	return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>;
};
