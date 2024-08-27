import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useApp } from "./AppContext";

const WebSocketContext = createContext();

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const { user } = useAuth();
	const { setError, setSuccess } = useApp();
	const [messages, setMessages] = useState([]);
	const [onlineUsers, setOnlineUsers] = useState([]);

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

	const updateMessages = useCallback((updater) => {
		setMessages(updater);
	}, []);

	const contextValue = {
		socket,
		messages,
		sendMessage,
		updateMessages,
		onlineUsers,
	};

	return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>;
};
