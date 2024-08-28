import React from "react";
import "./UserList.css";
import { useWebSocket } from "../../contexts/WebSocketContext";

const UserList = ({ users }) => {
	const { handleUserClick } = useWebSocket();

	return (
		<div className="users-section" role="region" aria-labelledby="users-heading">
			<h3 id="users-heading">Users and Bots</h3>
			{users.length > 0 ? (
				<ul>
					{users.map((user) => (
						<li
							key={user._id || `user-${user.username || "unknown"}`}
							className={`user-item ${user.isOnline ? "online" : "offline"}`}
						>
							<img
								src={user.profilePicture || "/default-avatar.png"}
								alt={`${user.username}'s avatar`}
								className="user-avatar clickable"
								onClick={(event) => handleUserClick(user, true, event)}
							/>
							<span
								className="username clickable"
								onClick={(event) => handleUserClick(user, false, event)}
								onKeyDown={(event) =>
									event.key === "Enter" && handleUserClick(user, false, event)
								}
								role="button"
								tabIndex="0"
							>
								{user.username || user.name || "Unknown user"}
							</span>
							{user.isBot && <span className="bot-indicator"> (Bot)</span>}
						</li>
					))}
				</ul>
			) : (
				<div className="empty-state">No users available</div>
			)}
		</div>
	);
};

export default React.memo(UserList);
