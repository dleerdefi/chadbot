import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
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
	const isFirstRun = useRef(true);

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

	const updateUser = useCallback(
		(updatedUser) => {
			setMessages((prevMessages) =>
				prevMessages.map((message) => {
					const currentUser = message.user._id === updatedUser._id;

					return currentUser
						? {
								...message,
								user: {
									...message.user,
									...updatedUser,
								},
						  }
						: message;
				})
			);

			setUsers((prevUsers) =>
				prevUsers.map((user) =>
					user._id === updatedUser._id ? { ...user, ...updatedUser } : user
				)
			);
		},
		[socket]
	);

	const handleUserStatusUpdate = useCallback(
		({ userId, username, status }) => {
			if (user && user._id !== userId) {
				if (status === "online") {
					setSuccess(`${username} is online`);
				} else if (status === "offline") {
					setError(`${username} is offline`);
				}
			}

			// Update user status in messages
			setMessages((prevMessages) =>
				prevMessages.map((message) =>
					message.user._id === userId && !message.user.isBot
						? {
								...message,
								user: {
									...message.user,
									isOnline: status === "online",
								},
						  }
						: message
				)
			);

			// Update user status in users list
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
		if (user && isFirstRun.current && socket && socket.connected) {
			const fetchUsersAndBots = async () => {
				try {
					setIsBotLoading(true);
					const [usersResponse] = await Promise.all([
						axiosInstance.get(`/api/all-users`),
					]);
					const combinedUsers = [...usersResponse.data];

					// Update users state
					setUsers(combinedUsers);

					// Update messages state to include `isOnline` for each message.user
					setMessages((prevMessages) =>
						prevMessages.map((message) => {
							const matchedUser = combinedUsers.find(
								(u) => u._id === message.user._id
							);
							return matchedUser
								? {
										...message,
										user: { ...message.user, isOnline: matchedUser.isOnline },
								  }
								: message;
						})
					);
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

						setMessages((prevMessages) =>
							prevMessages.map((message) => {
								const matchedUser = initialOnlineUsers.find(
									(userId) => userId === message.user._id
								);
								if (matchedUser) {
									return {
										...message,
										user: { ...message.user, isOnline: true },
									};
								}
								if (message.user.isBot) {
									return {
										...message,
										user: { ...message.user, isOnline: true },
									};
								}
								return { ...message, user: { ...message.user, isOnline: false } };
							})
						);
					};

					socket.on("initialOnlineUsers", handleInitialOnlineUsers);

					socket.emit("getInitialOnlineUsers");
				}
			});

			isFirstRun.current = false;
		}
	}, [user, socket]);

	useEffect(() => {
		if (user && user.token && isFirstRun.current && (!socket || !socket.connected)) {
			const newSocket = io(process.env.REACT_APP_API_URL || "http://localhost:3000", {
				auth: { token: user.token },
				query: { token: user.token },
				transports: ["websocket"],
			});

			newSocket.on("connect", () => {
				setSocket(newSocket);
			});

			newSocket.emit("getInitialMessages");
		}
	}, [user, socket, isFirstRun]);

	useEffect(() => {
		if (user && user.token && socket && socket.connected) {
			// Handle connection errors
			socket.on("connect_error", (error) => {
				setError("WebSocket connection error");
				console.error("WebSocket connection error:", error);
			});

			// Handle socket disconnection
			socket.on("disconnect", (reason) => {
				setError("WebSocket disconnected");
				setSocket(null); // This could trigger a re-render, ensure this is necessary
			});

			// Handle incoming messages
			socket.on("message", (message) => {
				if (user._id !== message.user._id) {
					setSuccess(`New incoming message`);
				}

				setMessages((prevMessages) => [
					...prevMessages,
					{
						...message,
						user: {
							...message.user,
							isOnline: true,
						},
					},
				]);
			});

			// Other socket event listeners
			socket.on("botTyping", ({ botName, isTyping }) => {
				setTypingBots((prev) => ({ ...prev, [botName]: isTyping }));
			});
			socket.on("userStatusUpdate", handleUserStatusUpdate);
			socket.on("initialMessages", (initialMessages) => {
				setMessages(() => initialMessages.reverse());
			});
			socket.on("userBanned", ({ userId, username }) => {
				setMessages((prevMessages) =>
					prevMessages.filter((msg) => msg.user._id !== userId)
				);
			});
			socket.on("userUnbanned", ({ userId, username }) => {
				// Handle user unbanned if needed
			});
			socket.on("rateLimitError", handleRateLimitError);
			socket.on("error", (error) => {
				setError(`Socket error: ${error.message}`);
			});
		}

		return () => {
			if (socket) {
				socket.off("botTyping");
				socket.off("userBanned");
				socket.off("userUnbanned");
				socket.off("rateLimitError");
				socket.off("error");
				socket.off("disconnect");
				socket.off("message");
				socket.off("userStatusUpdate");
				socket.off("initialMessages");
			}
		};
	}, [user, socket]);

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
