import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useWebSocket } from "../contexts/WebSocketContext";
import AutocompleteInput from "./AutocompleteInput";
import Message from "./Message";
import { useApp } from "../contexts/AppContext";
import axiosInstance from "../utils/axiosInstance";

const ChatWindow = () => {
	const { user } = useAuth();
	const { setError, setSuccess } = useApp();
	const [isLoading, setIsLoading] = useState(false);
	const {
		socket,
		sendMessage,
		messages,
		typingBots,
		botsAndUsers,
		inputPrefix,
		setInputPrefix,
		selectedUser,
		setSelectedUser,
		handleUserClick,
	} = useWebSocket();
	const [input, setInput] = useState("");

	const messagesEndRef = useRef(null);
	const containerRef = useRef(null);

	const sanitizeInput = useCallback((input) => {
		return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}, []);

	const scrollToBottom = useCallback(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [messages, scrollToBottom, typingBots]);

	const handleBanUser = useCallback(async (userId) => {
		try {
			setIsLoading(true);
			const { data } = await axiosInstance.put(`/api/users/admin/ban-account/${userId}`);
			setSuccess(data.message);
		} catch (err) {
			// Set error message from server or default message
			if (err.response?.data?.message) {
				setError(err.response.data.message);
			} else {
				setError(err.message || "An error occurred. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleUnbanUser = useCallback(async (userId) => {
		try {
			setIsLoading(true);
			const { data } = await axiosInstance.put(`/api/users/admin/unban-account/${userId}`);
			setSuccess(data.message);
		} catch (err) {
			// Set error message from server or default message
			if (err.response?.data?.message) {
				setError(err.response.data.message);
			} else {
				setError(err.message || "An error occurred. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleDeleteMessage = useCallback(async (messageId) => {
		try {
			setIsLoading(true);
			const { data } = await axiosInstance.delete(
				`/api/messages/admin/delete-message/${messageId}`
			);

			setSuccess(data.message);
		} catch (err) {
			// Set error message from server or default message
			if (err.response?.data?.message) {
				setError(err.response.data.message);
			} else {
				setError(err.message || "An error occurred. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	}, []);

	const handleSendMessage = useCallback(
		async (event) => {
			event.preventDefault();
			if (!input.trim() || !user || !socket) return;

			const sanitizedInput = sanitizeInput(input);

			if (user.isBanned) {
				setError("You are banned and cannot send messages.");
				return;
			}

			try {
				sendMessage({
					text: inputPrefix + sanitizedInput,
					userId: user._id,
					room: "general",
				});
				setInput("");
				setInputPrefix("");
			} catch (err) {}
		},
		[input, inputPrefix, user, socket, sanitizeInput, setError, sendMessage]
	);

	const closeProfileCard = useCallback(() => {
		setSelectedUser(null);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (selectedUser && !event.target.closest(".user-profile-card")) {
				closeProfileCard();
			}
		};

		document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, [selectedUser, closeProfileCard]);

	return (
		<div className="flex flex-col h-full w-full px-2 sm:px-4">
			<h1 className="text-2xl font-semibold text-textPrimary mb-4 text-center">
				Chat with the greatest Pickup Artists of all time
			</h1>

			<div
				ref={containerRef}
				className="flex-grow min-h-0 overflow-y-auto p-2 rounded-lg shadow-inner scrollbar-hidden"
			>
				{messages.map((message) => (
					<Message
						containerRef={containerRef}
						handleUnbanUser={handleUnbanUser}
						handleBanUser={handleBanUser}
						handleDeleteMessage={handleDeleteMessage}
						user={user}
						handleUserClick={handleUserClick}
						key={message.id || message._id}
						message={message}
						isLoading={isLoading}
					/>
				))}
				{Object.entries(typingBots).map(
					([botName, isTyping]) =>
						isTyping && (
							<div
								key={botName}
								className="text-base italic text-textPrimary mt-2 flex items-center"
							>
								{botName} is typing
								<div className="typing-indicator ml-1">
									<span className="inline-block" />
									<span className="inline-block" />
									<span className="inline-block" />
								</div>
							</div>
						)
				)}
				<div ref={messagesEndRef} />
			</div>

			<form onSubmit={handleSendMessage} className="flex my-4 w-full max-w-xl">
				<AutocompleteInput
					value={inputPrefix + input}
					onChange={(newValue) => {
						if (newValue.startsWith(inputPrefix)) {
							setInput(newValue.slice(inputPrefix.length));
						} else {
							setInput(newValue);
							setInputPrefix("");
						}
					}}
					onSubmit={handleSendMessage}
					users={botsAndUsers}
					prefix={inputPrefix}
					className="flex-grow p-2 border border-gray-300  focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 w-full sm:w-auto transition duration-200"
				/>
				<button
					type="submit"
					className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 w-1/3 sm:w-auto transition duration-200"
				>
					Send
				</button>
			</form>
		</div>
	);
};

export default React.memo(ChatWindow);
