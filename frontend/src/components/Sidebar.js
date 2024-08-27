import React, { useState, useMemo } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import UserList from "./UserList/UserList";
import SearchBar from "./SearchBar/SearchBar";
import "./Sidebar.css";
import { useChat } from "../contexts/ChatContext";

const Sidebar = ({ onUserClick = () => {}, onProfileClick = () => {}, collapsed = false }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const { onlineUsers } = useWebSocket();
	const { bots, users, isBotLoading: botsLoading } = useChat();

	const filteredUsers = useMemo(() => {
		const userMap = new Map();

		(bots || []).forEach((bot) => {
			const botId = bot._id || bot.id;
			userMap.set(botId, {
				...bot,
				isBot: true,
				isOnline: true,
				_id: botId,
				username: bot.name || bot.username,
			});
		});

		(users || []).forEach((user) => {
			if (!userMap.has(user._id)) {
				userMap.set(user._id, {
					...user,
					isBot: false,
					isOnline: onlineUsers.includes(user._id),
					_id: user._id,
				});
			}
		});

		const allUsers = Array.from(userMap.values());

		const filteredAndSortedUsers = allUsers
			.filter((user) =>
				(user.username || user.name || "").toLowerCase().includes(searchTerm.toLowerCase())
			)
			.sort((a, b) => {
				if (a.isBot && !b.isBot) return -1;
				if (!a.isBot && b.isBot) return 1;
				if (a.isOnline && !b.isOnline) return -1;
				if (!a.isOnline && b.isOnline) return 1;
				return (a.username || a.name || "").localeCompare(b.username || b.name || "");
			});

		return filteredAndSortedUsers;
	}, [users, bots, searchTerm, onlineUsers]);

	return (
		<div className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
			{!collapsed && (
				<>
					<SearchBar onChange={setSearchTerm} />
					{botsLoading ? (
						<div className="loading-state">Loading bots...</div>
					) : (
						<UserList
							users={filteredUsers}
							onUserClick={onUserClick}
							onProfileClick={onProfileClick}
						/>
					)}
				</>
			)}
			{collapsed && (
				<div className="sidebar__collapsed-content">
					<div className="sidebar__collapsed-icon">☰</div>
				</div>
			)}
		</div>
	);
};

export default React.memo(Sidebar);
