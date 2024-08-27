import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { useApp } from "./AppContext";
import { useWebSocket } from "./WebSocketContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
	const [users, setUsers] = useState([]);
	const [bots, setBots] = useState([]);
	const [isBotLoading, setIsBotLoading] = useState(true);
	const { user } = useAuth();
	const { setError, setSuccess } = useApp();
	const { onlineUsers } = useWebSocket();

	console.log(bots, users);

	useEffect(() => {
		if (user) {
			fetchUsers();
			fetchBots();
		}
	}, [user]);

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

	return (
		<ChatContext.Provider value={{ bots, users, isBotLoading }}>
			{children}
		</ChatContext.Provider>
	);
};

export const useChat = () => useContext(ChatContext);
