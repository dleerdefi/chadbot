import React, { useState } from "react";
import HeaderImage from "../images/header-image.png";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import Account from "../components/Account";
import { FaBars, FaTimes } from "react-icons/fa";
import { IoPersonCircleSharp } from "react-icons/io5";

const Home = () => {
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const [accountCollapsed, setAccountCollapsed] = useState(false);

	const toggleSidebar = (value) => {
		setSidebarCollapsed(value);
	};

	const toggleAccount = (value) => {
		setAccountCollapsed(value);
	};

	return (
		<div className="h-screen w-full flex flex-col">
			<header className="w-full">
				<img src={HeaderImage} alt="Header" className="w-full h-auto object-contain" />
				<div className="flex justify-between items-center w-full py-4 px-2 text-textSecondary space-x-2">
					<button
						className="p-2 bg-cardBg rounded-full shadow-default transition-colors duration-default"
						onClick={() => toggleSidebar(!sidebarCollapsed)}
					>
						{sidebarCollapsed ? <FaTimes size={25} /> : <FaBars size={25} />}
					</button>
					<button
						className="p-2 bg-cardBg rounded-full shadow-default transition-colors duration-default"
						onClick={() => toggleAccount(!accountCollapsed)}
					>
						{accountCollapsed ? (
							<FaTimes size={25} />
						) : (
							<IoPersonCircleSharp size={25} />
						)}
					</button>
				</div>
			</header>
			<div className="flex flex-1 overflow-hidden relative">
				<Sidebar toggleCollapse={toggleSidebar} collapsed={sidebarCollapsed} />

				<div className="flex-1 relative">
					<div className="absolute inset-0 overflow-y-auto">
						<ChatWindow />
					</div>
				</div>

				<Account collapsed={accountCollapsed} toggleCollapse={toggleAccount} />
			</div>
		</div>
	);
};

export default Home;
