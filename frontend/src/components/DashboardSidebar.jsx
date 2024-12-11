import { NavLink } from "react-router-dom";
import { User, BarChart2, Menu, ChevronLeft, MessageCircle, Brain } from "lucide-react";
import { useApp } from "../contexts/AppContext";

const DashboardSidebar = () => {
	const { isCollapsed, setIsCollapsed } = useApp();

	const NavItem = ({ to, icon: Icon, label }) => (
		<NavLink
			to={to}
			className={({ isActive }) =>
				`flex items-center relative overflow-hidden group transition-all duration-300 ease-in-out rounded ${
					isCollapsed ? "justify-center" : "px-6"
				} ${
					isActive
						? "bg-blue-800 text-white"
						: "text-gray-300 hover:bg-blue-900 hover:text-white"
				} py-3 text-base font-medium w-full`
			}
			title={isCollapsed ? label : undefined}
		>
			<div
				className={`flex items-center w-full relative transition-all duration-300 ease-in-out ${
					isCollapsed ? "justify-center" : "justify-start"
				}`}
			>
				<Icon
					className={`flex-shrink-0 transition-all duration-300 ${
						isCollapsed ? "mr-0" : "mr-3"
					}`}
					size={20}
				/>
				<span
					className={`whitespace-nowrap transition-all duration-300 ease-in-out ${
						isCollapsed
							? "opacity-0 translate-x-4 w-0"
							: "opacity-100 translate-x-0 w-auto"
					}`}
				>
					{label}
				</span>
			</div>
		</NavLink>
	);

	const BottomNavItem = ({ to, icon: Icon, label }) => (
		<NavLink
			to={to}
			className={({ isActive }) =>
				`flex items-center relative overflow-hidden group transition-all duration-300 ease-in-out rounded shadow-sm ${
					isCollapsed ? "justify-center py-3" : "px-6 py-3"
				} ${
					isActive
						? "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 text-white"
						: "bg-blue-600/20 text-blue-100 hover:bg-gradient-to-r hover:from-blue-600 hover:via-blue-500 hover:to-blue-700 hover:text-white"
				}`
			}
			title={isCollapsed ? label : undefined}
		>
			<div
				className={`flex items-center w-full relative transition-all duration-300 ease-in-out ${
					isCollapsed ? "justify-center" : "justify-start"
				}`}
			>
				<Icon
					className={`flex-shrink-0 transition-all duration-300 ${
						isCollapsed ? "mr-0" : "mr-3"
					}`}
					size={20}
				/>
				<span
					className={`whitespace-nowrap transition-all duration-300 ease-in-out ${
						isCollapsed
							? "opacity-0 translate-x-4 w-0"
							: "opacity-100 translate-x-0 w-auto"
					}`}
				>
					{label}
				</span>
			</div>
		</NavLink>
	);

	return (
		<aside
			className={`group fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 shadow-xl transition-all duration-300 ease-in-out ${
				isCollapsed ? "w-16" : "w-72"
			} md:relative`}
		>
			{/* Sidebar Header */}
			<div
				className={`flex items-center ${
					isCollapsed ? "justify-center" : "justify-between"
				} p-4 bg-gradient-to-r from-indigo-700 to-purple-700`}
			>
				{/* Logo/Title Area */}
				<div
					className={`flex items-center overflow-hidden transition-all duration-300 ease-in-out ${
						isCollapsed ? "w-0 opacity-0 scale-75" : "w-full opacity-100 scale-100"
					}`}
				>
					{!isCollapsed && (
						<span className="text-lg font-bold text-white whitespace-nowrap">
							Admin Panel
						</span>
					)}
				</div>

				{/* Collapse Toggle */}
				<button
					onClick={() => setIsCollapsed(!isCollapsed)}
					className="p-2 text-white hover:bg-indigo-600 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white"
				>
					{isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
				</button>
			</div>

			{/* Navigation Links */}
			<nav
				className={`mt-6 space-y-1 transition-all duration-300 ease-in-out ${
					isCollapsed ? "px-0" : "px-2"
				}`}
			>
				<NavItem to="/admin/dashboard" icon={BarChart2} label="Dashboard" />
				<NavItem to="/admin/bots" icon={Brain} label="Bots" />
				<NavItem to="/admin/users" icon={User} label="Users" />
			</nav>

			{/* Bottom Navigation */}
			<div
				className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ease-in-out mb-4 ${
					isCollapsed ? "px-0 opacity-75" : "px-2 opacity-100"
				}`}
			>
				<BottomNavItem to="/" icon={MessageCircle} label="Switch to Chat" />
			</div>
		</aside>
	);
};

export default DashboardSidebar;
