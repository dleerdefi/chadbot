import React, { useEffect, useState } from "react";
import moment from "moment";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";

const Message = ({
	message,
	handleDeleteMessage,
	handleBanByUsername,
	handleUnbanUser,
	user,
	handleUserClick,
	containerRef,
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
	}, []);

	return (
		<div
			key={message.id || message._id}
			className="flex flex-col sm:flex-row items-start p-3 mb-2 bg-gray-800 rounded-lg shadow-lg "
		>
			<Popover open={openPopover}>
				<PopoverTrigger asChild>
					<img
						src={
							message.user.profilePic
								? message.user.isBot
									? message.user.profilePic
									: `${process.env.REACT_APP_API_URL}${user.profilePic}`
								: "/images/default-avatar.png"
						}
						disabled={openPopover}
						onClick={() => {
							setOpenPopover(!openPopover);
						}}
						alt="Profile"
						className="w-12 h-12 rounded-full object-cover cursor-pointer disabled:cursor-none mb-3 sm:mb-0 text-primary text-xs"
					/>
				</PopoverTrigger>
				<PopoverContent
					onInteractOutside={() => setOpenPopover(false)}
					align="start"
					className="bg-gray-100 p-4 rounded-md space-x-4 space-y-2 z-10"
				>
					<div className="flex items-center">
						<img
							src={
								message.user.profilePic
									? message.user.isBot
										? message.user.profilePic
										: `${process.env.REACT_APP_API_URL}${user.profilePic}`
									: "/images/default-avatar.png"
							}
							alt={`${message.user.username}'s profile`}
							className="w-32 h-32 rounded-full object-cover border-2 border-blue-500 text-primary text-xs"
						/>
						<div className="ml-4 flex-1">
							<h3 className="text-lg font-semibold text-gray-800">
								{message.user.username}
							</h3>
							{message.user.isAdmin && (
								<span
									className="text-yellow-500 text-lg"
									title="Admin"
									aria-label="Admin user"
								>
									👑
								</span>
							)}
							{message.user.isBotUser && (
								<span
									className="text-green-500 text-lg"
									title="Bot"
									aria-label="Bot user"
								>
									🤖
								</span>
							)}
							<p className="text-gray-600 mt-2">{message?.user.bio}</p>
						</div>
					</div>
				</PopoverContent>
			</Popover>

			<div className="flex-1 ml-0 sm:ml-4">
				<div className="flex flex-col sm:flex-row sm:justify-between  items-start sm:items-center mb-2">
					<strong
						className="text-blue-400 cursor-pointer hover:underline"
						onClick={(event) => message.user && handleUserClick(message.user, event)}
					>
						{message.user ? message.user.username : "Unknown User"}
						{message.user.isBot && (
							<span className="text-textSecondary ml-2">(Bot)</span>
						)}
					</strong>
					<span className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-0 sm:ml-2">
						{moment(message.createdAt).format("MMMM Do YYYY, h:mm:ss a")}
					</span>
				</div>
				<p className="text-gray-300 text-base my-4">{message.text}</p>
				{user.isAdmin && message.user && message.user._id !== user._id && (
					<div className="flex flex-wrap gap-2">
						<button
							onClick={() => handleDeleteMessage(message.id)}
							className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-xs sm:text-sm"
						>
							Delete
						</button>
						{message.user.isBanned ? (
							<button
								onClick={() => handleUnbanUser(message.user._id)}
								className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm"
							>
								Unban User
							</button>
						) : (
							<button
								onClick={() => handleBanByUsername(message.user.name)}
								className="bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-xs sm:text-sm"
							>
								Ban User
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default Message;
