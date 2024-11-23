import React, { useRef } from "react";
import User from "./User";

const UserList = ({ users, toggleSidebar }) => {
	const containerRef = useRef(null);
	
	return (
		<div role="region" aria-labelledby="users-heading" className="p-2 h-full flex flex-col">
			<h3 id="users-heading" className="text-xl font-semibold mb-4 text-textPrimary">
				Users and Bots
			</h3>
			<div
				ref={containerRef}
				className="h-full max-h-screen overflow-y-auto scrollbar-hidden"
			>
				{users.length > 0 ? (
					<ul className="divide-y divide-message mb-96">
						{users.map((user, i) => (
							<User
								containerRef={containerRef}
								user={user}
								key={i}
								toggleSidebar={toggleSidebar}
							/>
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
