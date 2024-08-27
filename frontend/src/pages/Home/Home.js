import React from "react";
import HeaderImage from "../../images/header-image.png";

const Home = () => {
	return (
		<div className="app-container">
			<header className="header">
				<img src={HeaderImage} alt="Header" className="header__image" />
			</header>
			<div className="main-content">
				{/* <Sidebar
					collapsed={sidebarCollapsed}
					users={[]} // Pass your users data here
					bots={[]} // Pass your bots data here
					onUserClick={() => {}} // Implement this function
					onProfileClick={() => {}} // Implement this function
					onlineUsers={[]} // Pass your online users data here
					botsLoading={false} // Set this based on your bots loading state
				/>
				<button
					className="toggle-button toggle-button--sidebar"
					onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
				>
					{sidebarCollapsed ? ">" : "<"}
				</button>

				<ChatWindow />

				<button
					className="toggle-button toggle-button--userbar"
					onClick={() => setUserBarCollapsed(!userBarCollapsed)}
				>
					{userBarCollapsed ? "<" : ">"}
				</button>
				<Account user={user} setUser={setUser} collapsed={userBarCollapsed} /> */}
			</div>
		</div>
	);
};

export default Home;
