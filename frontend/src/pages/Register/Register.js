// import React, { useState, useMemo, memo, useEffect } from "react";
// import PropTypes from "prop-types";
// import { useWebSocket } from "../../contexts/WebSocketContext";

// const SearchBar = memo(({ onChange }) => (
// 	<input
// 		type="text"
// 		placeholder="Search users and bots"
// 		onChange={(e) => onChange(e.target.value)}
// 		className="search-bar"
// 		aria-label="Search users and bots"
// 	/>
// ));

// const UserList = memo(({ users, onUserClick, onlineUsers }) => {
// 	const sortedUsers = useMemo(() => {
// 		return users.sort((a, b) => {
// 			if (a.isBot && !b.isBot) return -1;
// 			if (!a.isBot && b.isBot) return 1;
// 			if (onlineUsers.includes(a._id) && !onlineUsers.includes(b._id)) return -1;
// 			if (!onlineUsers.includes(a._id) && onlineUsers.includes(b._id)) return 1;
// 			return (a.username || a.name || "").localeCompare(b.username || b.name || "");
// 		});
// 	}, [users, onlineUsers]);

// 	return (
// 		<div className="users-section" role="region" aria-labelledby="users-heading">
// 			<h3 id="users-heading">Users</h3>
// 			{sortedUsers.length > 0 ? (
// 				<ul>
// 					{sortedUsers.map((user) => (
// 						<li
// 							key={user._id || `user-${user.username || "unknown"}`}
// 							className={`user-item ${
// 								user.isBot || onlineUsers.includes(user._id) ? "online" : "offline"
// 							}`}
// 							onClick={() => onUserClick(user)}
// 							onKeyPress={(e) => e.key === "Enter" && onUserClick(user)}
// 							role="button"
// 							tabIndex="0"
// 							aria-label={`${user.isBot ? "Chat with" : "View profile of"} ${
// 								user.username || user.name || "Unknown user"
// 							}`}
// 						>
// 							<span className="status-indicator" aria-hidden="true"></span>
// 							{user.username || user.name || "Unknown user"}
// 							{user.isBot && <span className="bot-indicator"> (Bot)</span>}
// 						</li>
// 					))}
// 				</ul>
// 			) : (
// 				<div className="empty-state">No users available</div>
// 			)}
// 		</div>
// 	);
// });

// const Sidebar = memo(({ users, bots, onUserClick }) => {
// 	const [searchTerm, setSearchTerm] = useState("");
// 	const [onlineUsers, setOnlineUsers] = useState([]);
// 	const { socket } = useWebSocket();

// 	useEffect(() => {
// 		if (socket) {
// 			console.log("Socket connected in Sidebar");

// 			const handleInitialOnlineUsers = (initialOnlineUsers) => {
// 				console.log("Received initial online users:", initialOnlineUsers);
// 				setOnlineUsers(initialOnlineUsers);
// 			};

// 			const handleUserStatusUpdate = ({ userId, status }) => {
// 				console.log(`User ${userId} status updated to ${status}`);
// 				setOnlineUsers((prevOnlineUsers) => {
// 					if (status === "online" && !prevOnlineUsers.includes(userId)) {
// 						return [...prevOnlineUsers, userId];
// 					} else if (status === "offline") {
// 						return prevOnlineUsers.filter((id) => id !== userId);
// 					}
// 					return prevOnlineUsers;
// 				});
// 			};

// 			socket.on("initialOnlineUsers", handleInitialOnlineUsers);
// 			socket.on("userStatusUpdate", handleUserStatusUpdate);

// 			socket.emit("getInitialOnlineUsers");

// 			return () => {
// 				console.log("Cleaning up socket listeners in Sidebar");
// 				socket.off("initialOnlineUsers", handleInitialOnlineUsers);
// 				socket.off("userStatusUpdate", handleUserStatusUpdate);
// 			};
// 		} else {
// 			console.log("No socket connection in Sidebar");
// 		}
// 	}, [socket]);

// 	const filteredUsers = useMemo(() => {
// 		const allUsers = [...users, ...bots.map((bot) => ({ ...bot, isBot: true }))];
// 		return allUsers.filter((user) =>
// 			(user.username || user.name || "").toLowerCase().includes(searchTerm.toLowerCase())
// 		);
// 	}, [users, bots, searchTerm]);

// 	return (
// 		<div className="sidebar">
// 			<SearchBar onChange={setSearchTerm} />
// 			<UserList users={filteredUsers} onUserClick={onUserClick} onlineUsers={onlineUsers} />
// 		</div>
// 	);
// });

// Sidebar.propTypes = {
// 	users: PropTypes.arrayOf(
// 		PropTypes.shape({
// 			_id: PropTypes.string,
// 			name: PropTypes.string,
// 			username: PropTypes.string,
// 		})
// 	).isRequired,
// 	bots: PropTypes.arrayOf(
// 		PropTypes.shape({
// 			id: PropTypes.string,
// 			name: PropTypes.string.isRequired,
// 		})
// 	).isRequired,
// 	onUserClick: PropTypes.func.isRequired,
// };

// export default Sidebar;

import React from "react";

const Register = () => {
	return <div>Register</div>;
};

export default Register;
