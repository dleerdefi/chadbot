import React, { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { useWebSocket } from "../contexts/WebSocketContext";

const User = ({ user, toggleSidebar, containerRef }) => {
	const [openPopover, setOpenPopover] = useState(false);
	const { handleUserClick } = useWebSocket();

	useEffect(() => {
		const handleScroll = () => {
			setOpenPopover(false);
		};

		const container = containerRef.current;
		if (container) {
			container.addEventListener("scroll", handleScroll);
		}

		return () => {
			if (container) {
				container.removeEventListener("scroll", handleScroll);
			}
		};
	}, []);

	return (
		<li
			key={user._id || `user-${user.username || "unknown"}`}
			className="flex items-center py-3 px-1 shadow-sm transition-colors duration-300 cursor-pointer"
		>
			<Popover open={openPopover}>
				<PopoverTrigger asChild>
					<div
						className="relative w-12 h-12 mr-3 cursor-pointer disabled:cursor-none"
						disabled={openPopover}
						onClick={() => {
							setOpenPopover(!openPopover);
						}}
					>
						<img
							crossOrigin="anonymous"
							src={user.profilePic?.url}
							alt={`${user.username}'s avatar`}
							className="w-full h-full rounded-full border-2 border-card text-xs text-gray-200"
						/>
						<div
							className={`absolute top-0 right-0 -translate-x-1 w-2 h-2 rounded-full ${
								user.status === "online" ? "bg-success" : "bg-danger"
							}`}
							aria-label={user.status === "online" ? "Online" : "Offline"}
						/>
					</div>
				</PopoverTrigger>
				<PopoverContent
					onInteractOutside={() => setOpenPopover(false)}
					align="start"
					className="bg-gray-100 p-4 rounded-md z-50 max-w-72"
				>
					<div className="flex items-center">
						<img
							crossOrigin="anonymous"
							src={user.profilePic?.url}
							alt={`${user.username}'s profile`}
							className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 text-primary text-xs"
						/>
						<div className="ml-4 flex-1">
							<h3 className="text-lg font-semibold text-gray-800">{user.username}</h3>
							{user.isAdmin && (
								<span
									className="text-yellow-500 text-lg"
									title="Admin"
									aria-label="Admin user"
								>
									👑
								</span>
							)}
							{user && user.isBot && (
								<span
									className="text-green-500 text-lg"
									title="Bot"
									aria-label="Bot user"
								>
									🤖
								</span>
							)}
							<p className="text-gray-600 mt-2">{user.bio}</p>
						</div>
					</div>
				</PopoverContent>
			</Popover>
			<div
				className="flex-1 text-textPrimary ml-1"
				onClick={(event) => {
					handleUserClick(user, event);
					toggleSidebar(false);
				}}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						handleUserClick(user, event);
						toggleSidebar(false);
					}
				}}
				role="button"
				tabIndex="0"
			>
				{user.username || "Unknown user"}
			</div>
			{user.isBot && <span className="text-textSecondary ml-2">(Bot)</span>}
		</li>
	);
};

export default User;
