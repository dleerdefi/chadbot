import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { getStoredTokens } from "../utils/axiosInstance";
import { useApp } from "./AppContext";

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [botsAndUsers, setBotsAndUsers] = useState([]);
	const [messages, setMessages] = useState([]);
	const [isBotsAndUsersLoading, setIsBotsAndUsersLoading] = useState(false);
	const [isMessagesLoading, setIsMessagesLoading] = useState(false);
	const [typingBots, setTypingBots] = useState({});
	const [inputPrefix, setInputPrefix] = useState("");
	const [selectedUser, setSelectedUser] = useState(null);
	const { user, logout, deleteAccount } = useAuth();
	const { setError, setSuccess } = useApp();
	const isInitialConnection = useRef(true);

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

	const logoutSocket = useCallback(
		async (callback) => {
			await logout();
			socket.disconnect();
			isInitialConnection.current = true;
			callback();
		},
		[socket]
	);

	const deleteSocket = useCallback(
		async (callback) => {
			await deleteAccount();
			socket.disconnect();
			isInitialConnection.current = true;
			callback();
		},
		[socket]
	);

	const handleUserClick = useCallback((clickedUser, event) => {
		event?.preventDefault();
		event?.stopPropagation();
		setInputPrefix(`@${clickedUser.username} `);
	}, []);

	useEffect(() => {
		if (isInitialConnection.current && user) {
			const { jwtToken } = getStoredTokens();
			const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
				query: { token: jwtToken },
				transports: ["websocket"],
			});

			newSocket.on("connect", () => {
				setSocket(newSocket);
				newSocket.emit("getInitialBotsAndUsers");
				newSocket.emit("getInitialMessages");
				setIsBotsAndUsersLoading(true);
				setIsMessagesLoading(true);

				isInitialConnection.current = false;
			});
		}
	}, [user]);

	useEffect(() => {
		if (socket && socket.connected) {
			// Listeners
			socket.on("initialBotsAndUsersList", (combinedList) => {
				setBotsAndUsers(combinedList);
				setIsBotsAndUsersLoading(false);
			});

			socket.on("initialMessages", (initialMessages) => {
				setMessages(initialMessages);
				setIsMessagesLoading(false);
			});

			socket.on("message", (message) => {
				setMessages((prevMessages) => [...prevMessages, message]);
				if (message.sender._id !== user._id) {
					setSuccess(`New incoming message`);
				}
			});

			socket.on("updateUser", ({ user, alert }) => {
				if (user) {
					setBotsAndUsers((prevBotsAndUsers) =>
						prevBotsAndUsers.map((item) => (item._id === user._id ? user : item))
					);
					setMessages((prevMessages) =>
						prevMessages.map((message) =>
							message.sender._id === user._id ? { ...message, sender: user } : message
						)
					);
				}

				if (alert) {
					if (alert.type === "error") {
						setError(alert.text);
					} else {
						setSuccess(alert.text);
					}
				}
			});

			socket.on("banUser", ({ user }) => {
				setBotsAndUsers((prevBotsAndUsers) =>
					prevBotsAndUsers.map((item) =>
						item._id === user._id ? { ...item, ...user } : item
					)
				);
				setMessages((prevMessages) =>
					prevMessages.map((message) =>
						message.sender._id === user._id
							? { ...message, sender: { ...message.sender, ...user } }
							: message
					)
				);
			});

			socket.on("unBanUser", ({ user }) => {
				setBotsAndUsers((prevBotsAndUsers) =>
					prevBotsAndUsers.map((item) =>
						item._id === user._id ? { ...item, ...user } : item
					)
				);
				setMessages((prevMessages) =>
					prevMessages.map((message) =>
						message.sender._id === user._id
							? { ...message, sender: { ...message.sender, ...user } }
							: message
					)
				);
			});

			socket.on("deleteUser", ({ user }) => {
				setBotsAndUsers((prevBotsAndUsers) =>
					prevBotsAndUsers.filter((item) => item._id !== user._id)
				);
				setMessages((prevMessages) =>
					prevMessages.filter((message) => message.sender._id !== user._id)
				);
			});

			socket.on("updateBotsAndUsers", ({ data }) => {
				setBotsAndUsers(data);
			});

			socket.on("deleteMessage", ({ messageId }) => {
				setMessages((prevMessages) =>
					prevMessages.filter((message) => message._id !== messageId)
				);
			});

			socket.on("botTyping", ({ botName, isTyping }) => {
				setTypingBots((prev) => ({ ...prev, [botName]: isTyping }));
			});

			socket.on("connect_error", (error) => {
				setError("WebSocket connection error");
				console.error("WebSocket connection error:", error);
			});

			socket.on("disconnect", () => {
				setSocket(null);
			});

			socket.on("error", (error) => {
				setError(`${error.message}`);
				setTypingBots({});
			});
		}

		return () => {
			socket?.off("initialBotsAndUsersList");
			socket?.off("initialMessages");
			socket?.off("message");
			socket?.off("userStatusUpdate");
			socket?.off("botTyping");
			socket?.off("connect_error");
			socket?.off("disconnect");
			socket?.off("error");
		};
	}, [socket, user, setError, setSuccess]);

	const contextValue = {
		socket,
		messages,
		setMessages,
		logoutSocket,
		botsAndUsers,
		selectedUser,
		inputPrefix,
		typingBots,
		isMessagesLoading,
		isBotsAndUsersLoading,
		sendMessage,
		setInputPrefix,
		setSelectedUser,
		handleUserClick,
		deleteSocket,
	};

	return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>;
};

export const useWebSocket = () => useContext(WebSocketContext);
