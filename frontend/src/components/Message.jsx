import React, { useEffect, useState } from "react";
import moment from "moment";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

const Message = ({
	message,
	handleUnbanUser,
	handleBanUser,
	handleDeleteMessage,
	user,
	handleUserClick,
	containerRef,
	isLoading,
}) => {
	const [openPopover, setOpenPopover] = useState(false);

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
	}, [containerRef]);

	// Early return if message or message.sender is null
	if (!message || !message.sender) {
		return null; // or return a placeholder component
	}

	return (
		<div
			key={message.id || message._id}
			className="flex flex-col sm:flex-row items-start p-3 mb-2 bg-gray-800 rounded-lg shadow-lg"
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
							src={message.sender.profilePic?.url}
							alt={`${message.sender.username}'s avatar`}
							className="w-full h-full rounded-full border-2 border-cardBg text-xs text-gray-200"
						/>
						<div
							className={`absolute top-0 right-0 -translate-x-1 w-2 h-2 rounded-full ${
								message.sender.status === "online" ? "bg-success" : "bg-danger"
							}`}
							aria-label={message.sender.status === "online" ? "Online" : "Offline"}
						/>
					</div>
				</PopoverTrigger>
				<PopoverContent
					onInteractOutside={() => setOpenPopover(false)}
					align="start"
					className="bg-gray-100 p-4 rounded-md space-x-4 space-y-2 z-10"
				>
					<div className="flex items-center">
						<img
							crossOrigin="anonymous"
							src={message.sender.profilePic?.url}
							alt={`${message.sender.username}'s profile`}
							className="w-32 h-32 rounded-full object-cover border-2 border-blue-500 text-primaryBg text-xs"
						/>
						<div className="ml-4 flex-1">
							<h3 className="text-lg font-semibold text-gray-800">
								{message.sender.username}
							</h3>
							{message.sender.isAdmin && (
								<span
									className="text-yellow-500 text-lg"
									title="Admin"
									aria-label="Admin user"
								>
									👑
								</span>
							)}
							{message.sender.isBot && (
								<span
									className="text-green-500 text-lg"
									title="Bot"
									aria-label="Bot user"
								>
									🤖
								</span>
							)}
							<p className="text-gray-600 mt-2">
								{message.sender.bio || "No bio available"}
							</p>
						</div>
					</div>
				</PopoverContent>
			</Popover>

			<div className="flex-1 ml-0 sm:ml-4">
				<div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-2">
					<strong
						className="text-blue-400 cursor-pointer hover:underline"
						onClick={(event) =>
							message.sender && handleUserClick(message.sender, event)
						}
					>
						{message.sender.username}
						{message.sender.isBot && (
							<span className="text-textSecondary ml-2">(Bot)</span>
						)}
					</strong>
					<span className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-0 sm:ml-2">
						{moment(message.createdAt).format("MMMM Do YYYY, h:mm:ss a")}
					</span>
				</div>
				<p className="text-gray-300 text-base my-4">{message.content}</p>
				{user.isAdmin && (
					<div className="flex flex-wrap gap-2">
						<button
							disabled={isLoading}
							onClick={() => handleDeleteMessage(message._id)}
							className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
						>
							Delete Message
						</button>

						{message.senderType === "User" && !message.sender.isAdmin && (
							<>
								{message.sender.isBanned ? (
									<button
										disabled={isLoading}
										onClick={() => handleUnbanUser(message.sender._id)}
										className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm"
									>
										Unban User
									</button>
								) : (
									<button
										disabled={isLoading}
										onClick={() => handleBanUser(message.sender._id)}
										className="bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-xs sm:text-sm"
									>
										Ban User
									</button>
								)}
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Message;
