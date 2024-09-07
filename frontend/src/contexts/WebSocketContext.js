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
		[socket, setError]
	);

	const updateUser = useCallback((updatedUser) => {
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
	}, []);

	const handleUserStatusUpdate = useCallback(
		({ userId, username, status }) => {
			if (user && user._id !== userId) {
				if (status === "online") {
					setSuccess(`${username} is online`);
				} else if (status === "offline") {
					setError(`${username} is offline`);
				}
			}

			setUsers((prevUsers) =>
				prevUsers.map((user) =>
					user._id === userId && !user.isBot
						? { ...user, isOnline: status === "online" }
						: user
				)
			);
		},
		[user]
	);

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
		if (user) {
			const fetchUsersAndBots = async () => {
				try {
					setIsBotLoading(true);
					const [usersResponse] = await Promise.all([
						axiosInstance.get(`/api/all-users`),
					]);
					const combinedUsers = [...usersResponse.data];
					setUsers(combinedUsers);
				} catch (err) {
					setError(err.response?.data.message || err.message);
				} finally {
					setIsBotLoading(false);
				}
			};

			fetchUsersAndBots().then(() => {
				if (socket) {
					const handleInitialOnlineUsers = (initialOnlineUsers) => {
						setUsers((prevUsers) =>
							prevUsers.map((u) => ({
								...u,
								isOnline: u.isBot || initialOnlineUsers.includes(u._id),
							}))
						);
					};

					socket.on("initialOnlineUsers", handleInitialOnlineUsers);

					socket.emit("getInitialOnlineUsers");
				}
			});
		}
	}, [user, socket, setError]);

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
				setError("WebSocket disconnected");
				setSocket(null);
			});

			newSocket.on("message", (message) => {
				if (user._id !== message.user._id) {
					setSuccess(`New incomming message`);
				}

				setMessages((prevMessages) => [...prevMessages, message]);
			});

			newSocket.on("botTyping", ({ botName, isTyping }) => {
				setTypingBots((prev) => ({ ...prev, [botName]: isTyping }));
			});

			newSocket.on("userStatusUpdate", handleUserStatusUpdate);
			newSocket.on("initialMessages", (initialMessages) => {
				setMessages(() => initialMessages.reverse());
			});
			newSocket.on("userBanned", ({ userId, username }) => {
				setMessages((prevMessages) =>
					prevMessages.filter((msg) => msg.user._id !== userId)
				);
			});
			newSocket.on("userUnbanned", ({ userId, username }) => {
				// Handle user unbanned if needed
			});
			newSocket.on("rateLimitError", handleRateLimitError);
			newSocket.on("error", (error) => {
				setError(`Socket error: ${error.message}`);
			});

			newSocket.emit("getInitialMessages");

			return () => {
				newSocket.off("message");
				newSocket.off("botTyping");
				newSocket.off("userStatusUpdate");
				newSocket.off("initialMessages");
				newSocket.off("userBanned");
				newSocket.off("userUnbanned");
				newSocket.off("rateLimitError");
				newSocket.off("error");
				newSocket.off("disconnect");
				newSocket.disconnect();
			};
		}
	}, [user, handleUserStatusUpdate, handleRateLimitError, setError]);

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
