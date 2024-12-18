import React, { useState, useMemo, useRef, useEffect } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import UserList from "./UserList";
import SearchBar from "./SearchBar";

const Sidebar = ({ collapsed, toggleCollapse }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const { botsAndUsers, isBotsAndUsersLoading } = useWebSocket();
	const sidebarRef = useRef(null);

	const filteredUsers = useMemo(() => {
		const sortedUsers = botsAndUsers.filter((user) =>
			(user.username || user.botUsername || "")
				.toLowerCase()
				.includes(searchTerm.toLowerCase())
		);

		return sortedUsers;
	}, [botsAndUsers, searchTerm]);

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
				className={`absolute transition-all duration-300 ease-out bg-gray-800 h-full left-0 top-0 flex flex-col overflow-y-hidden scrollbar-hidden ${
					collapsed ? "w-[22rem] p-2" : "w-0 -translate-x-full"
				} z-20`}
			>
				{collapsed ? (
					<div className="p-2 sm:p-4">
						<SearchBar onChange={setSearchTerm} />
						{isBotsAndUsersLoading ? (
							<div className="flex items-center justify-center flex-1 p-4 text-textSecondary">
								<span className="text-lg font-semibold">Loading...</span>
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
