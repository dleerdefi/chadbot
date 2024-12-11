import Sidebar from "./DashboardSidebar";

const DashboardLayout = ({ children }) => {

	return (
		<div className="flex h-screen bg-gray-700">
			{/* Sidebar */}
			<Sidebar />

			{/* Main Content */}
			<div className="flex-1 overflow-y-auto">
				<main className="pl-12 md:pl-0">{children}</main>
			</div>
		</div>
	);
};

export default DashboardLayout;
