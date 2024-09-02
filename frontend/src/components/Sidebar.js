import React, { useState, useMemo, useRef, useEffect } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import UserList from "./UserList";
import SearchBar from "./SearchBar";

const Sidebar = ({ collapsed, toggleCollapse }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const { onlineUsers, bots, users, isBotLoading } = useWebSocket();
	const sidebarRef = useRef(null);

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

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
				toggleCollapse();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [toggleCollapse]);

	return (
		<>
			{collapsed && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-10"
					onClick={toggleCollapse}
					style={{ pointerEvents: collapsed ? "auto" : "none" }}
				/>
			)}
			<div
				ref={sidebarRef}
				className={`absolute transition-all duration-300 ease-out bg-gray-800 h-full left-0 top-0 flex flex-col scrollbar-hidden ${
					collapsed ? "w-80 p-4" : "w-0 -translate-x-full"
				} z-20`}
			>
				{collapsed ? (
					<div className="p-2 sm:p-4">
						<SearchBar onChange={setSearchTerm} />
						{isBotLoading ? (
							<div className="flex items-center justify-center flex-1 p-4 text-textSecondary">
								<span className="text-lg font-semibold">Loading bots...</span>
							</div>
						) : (
							<UserList toggleSidebar={toggleCollapse} users={filteredUsers} />
						)}
					</div>
				) : (
					<div className="flex items-center justify-center flex-1"></div>
				)}
			</div>{" "}
		</>
	);
};

export default React.memo(Sidebar);
