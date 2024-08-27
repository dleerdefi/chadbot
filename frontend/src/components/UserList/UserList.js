import React from "react";

const UserList = ({ users, onUserClick, onProfileClick }) => {
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
								onClick={() => onProfileClick(user)}
							/>
							<span
								className="username clickable"
								onClick={() => onUserClick(user)}
								onKeyDown={(e) => e.key === "Enter" && onUserClick(user)}
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
