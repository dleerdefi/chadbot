import React, { useState } from "react";
import HeaderImage from "../../images/header-image.png";
import Sidebar from "../../components/SideBar/Sidebar";
import ChatWindow from "../../components/ChatWindow/ChatWindow";
import "./Home.css"

const Home = () => {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	return (
		<div className="home">
			<header className="header">
				<img src={HeaderImage} alt="Header" className="header__image" />
			</header>
			<div className="main-content">
				<Sidebar
					onUserClick={() => {}}
					onProfileClick={() => {}}
					collapsed={sidebarCollapsed}
				/>
				{/* <button
					className="toggle-button toggle-button--sidebar"
					onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
				>
					{sidebarCollapsed ? ">" : "<"}
				</button> */}

				<ChatWindow />
				{/* <Account user={user} setUser={setUser} collapsed={userBarCollapsed} /> */}
			</div>
		</div>
	);
};

export default Home;
