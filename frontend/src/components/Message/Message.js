import React from "react";
import moment from "moment";
import "./Message.css"

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const Message = ({ message, handleUserClick, handleDeleteMessage, handleBanByUsername, handleUnbanUser, user }) => (
	<div key={message.id || message._id} className="message">
		<img
			src={
				message.user && message.user.profilePic
					? `${API_URL}${message.user.profilePic}`
					: "/images/default-avatar.png"
			}
			alt="Profile"
			className="profile-pic clickable"
			onClick={(event) => message.user && handleUserClick(message.user, true, event)}
		/>
		<div className="message-content">
			<strong
				className="clickable"
				onClick={(event) => message.user && handleUserClick(message.user, false, event)}
			>
				{message.user ? message.user.name : "Unknown User"}
			</strong>
			: {message.text} {/* Add this line to display the message text */}
			<span className="timestamp">
				{moment(message.createdAt).format("MMMM Do YYYY, h:mm:ss a")}
			</span>
			{user.isAdmin && message.user && message.user._id !== user._id && (
				<div className="admin-controls">
					<button onClick={() => handleDeleteMessage(message.id)}>Delete</button>
					{message.user.isBanned ? (
						<button onClick={() => handleUnbanUser(message.user._id)}>
							Unban User
						</button>
					) : (
						<button onClick={() => handleBanByUsername(message.user.name)}>
							Ban User
						</button>
					)}
				</div>
			)}
		</div>
	</div>
);

export default Message;
