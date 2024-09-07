import React from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

const UserList = ({ users, toggleSidebar }) => {
	const { handleUserClick } = useWebSocket();

	return (
		<div role="region" aria-labelledby="users-heading" className="p-2 h-full flex flex-col">
			<h3 id="users-heading" className="text-xl font-semibold mb-4 text-textPrimary">
				Users and Bots
			</h3>
			<div className="h-full max-h-screen overflow-y-auto scrollbar-hidden">
				{users.length > 0 ? (
					<ul className="divide-y divide-message mb-96">
						{users.map((user, i) => (
							<li
								key={user._id || `user-${user.username || "unknown"}`}
								className="flex items-center p-3 shadow-sm transition-colors duration-300 cursor-pointer"
							>
								<Popover>
									<PopoverTrigger asChild>
										<div className="relative w-12 h-12 mr-3">
											<img
												src={
													user.profilePic
														? user.isBot
															? user.profilePic
															: `${process.env.REACT_APP_API_URL}${user.profilePic}`
														: "/images/default-avatar.png"
												}
												alt={`${user.username}'s avatar`}
												className="w-full h-full rounded-full border-2 border-card text-xs text-gray-200"
											/>
											<div
												className={`absolute top-0 right-0 -translate-x-1 w-2 h-2 rounded-full ${
													user.isOnline ? "bg-success" : "bg-danger"
												}`}
												aria-label={user.isOnline ? "Online" : "Offline"}
											/>
										</div>
									</PopoverTrigger>
									<PopoverContent
										align="start"
										className="bg-gray-100 p-4 rounded-md z-50 max-w-72"
									>
										<div className="flex items-center">
											<img
												src={
													user.profilePic
														? user.isBot
															? user.profilePic
															: `${process.env.REACT_APP_API_URL}${user.profilePic}`
														: "/images/default-avatar.png"
												}
												alt={`${user.username}'s profile`}
												className="w-16 h-16 rounded-full object-cover border-2 border-blue-500 text-primary text-xs"
											/>
											<div className="ml-4 flex-1">
												<h3 className="text-lg font-semibold text-gray-800">
													{user.username}
												</h3>
												{user.isAdmin && (
													<span
														className="text-yellow-500 text-lg"
														title="Admin"
														aria-label="Admin user"
													>
														👑
													</span>
												)}
												{user.isBotUser && (
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
								<span
									className="flex-1 text-textPrimary ml-2"
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
									{user.username || user.name || "Unknown user"}
								</span>
								{user.isBot && (
									<span className="text-textSecondary ml-2">(Bot)</span>
								)}
							</li>
						))}
					</ul>
				) : (
					<div className="text-textSecondary">No users available</div>
				)}
			</div>
		</div>
	);
};

export default React.memo(UserList);
