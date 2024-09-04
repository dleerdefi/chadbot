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
	const [users, setUsers] = useState([]);
	const [isBotLoading, setIsBotLoading] = useState(true);
	const [typingBots, setTypingBots] = useState({});
	const [inputPrefix, setInputPrefix] = useState("");
	const [selectedUser, setSelectedUser] = useState(null);
	const { user } = useAuth();
	const { setError, setSuccess } = useApp();

	const sendMessage = useCallback(
		(message) => {
			if (socket) {
				socket.emit("chatMessage", message);
			} else {
				setError("Cannot send message: WebSocket is not connected");
			}
		},
		[socket]
	);

	const updateUser = (updatedUser) => {
		setMessages((prevMessages) =>
			prevMessages.map((message) =>
				message.user._id === updatedUser._id
					? { ...message, user: { ...message.user, ...updatedUser } }
					: message
			)
		);

		setUsers((prevUsers) =>
			prevUsers.map((user) =>
				user._id === updatedUser._id ? { ...user, ...updatedUser } : user
			)
		);
	};

	// Function to handle user status update
	const handleUserStatusUpdate = useCallback(({ userId, status }) => {
		setUsers((prevUsers) =>
			prevUsers.map((user) =>
				user._id === userId && !user.isBot
					? { ...user, isOnline: status === "online" }
					: user
			)
		);
	}, []);

	const handleRateLimitError = useCallback(
		(error) => {
			setError(`Rate limit exceeded: ${error.message}`);
		},
		[setError]
	);

	const handleUserClick = useCallback((clickedUser, event) => {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		setInputPrefix(`@${clickedUser.username || clickedUser.name} `);
	}, []);

	useEffect(() => {
		const fetchUsersAndBots = async () => {
			try {
				setIsBotLoading(true);

				// Fetch users and bots concurrently
				const [usersResponse] = await Promise.all([axiosInstance.get(`/api/all-users`)]);

				// Combine bots at the beginning of the users array
				const combinedUsers = [...usersResponse.data];
				setUsers(combinedUsers);
				console.log("user fetched");
			} catch (err) {
				setError(err.response?.data.message || err.message);
			} finally {
				setIsBotLoading(false);
			}
		};
		if (user) {
			fetchUsersAndBots().then(() => {
				if (socket) {
					const handleInitialOnlineUsers = (initialOnlineUsers) => {
						setUsers((prevUsers) => {
							return prevUsers.map((u) => ({
								...u,
								isOnline: u.isBot || initialOnlineUsers.includes(u._id),
							}));
						});
					};

					socket.on("initialOnlineUsers", handleInitialOnlineUsers);

					socket.emit("getInitialOnlineUsers");
				}
			});
		}
	}, [socket, user]);

	useEffect(() => {
		if (user && socket) {
			socket.on("userStatusUpdate", handleUserStatusUpdate);
		}
	}, [socket, user, handleUserStatusUpdate]);

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
				setError("WebSocket connection error");
				console.error("WebSocket connection error:", error);
			});

			newSocket.on("disconnect", (reason) => {
				console.log(`WebSocket disconnected: ${reason}`);
				setError("WebSocket disconnected");
				setSocket(null);
			});

			newSocket.on("message", (message) => {
				setMessages((prevMessages) => [...prevMessages, message]);
			});
		}
	}, [user]);

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

			socket.emit("getInitialMessages");

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
		}
	}, [socket, setMessages, handleUserStatusUpdate, handleRateLimitError, setError]);

	const contextValue = {
		socket,
		messages,
		sendMessage,
		setMessages,
		users,
		isBotLoading,
		typingBots,
		setUsers,
		inputPrefix,
		setInputPrefix,
		selectedUser,
		setSelectedUser,
		handleUserClick,
		updateUser,
	};

	return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>;
};
