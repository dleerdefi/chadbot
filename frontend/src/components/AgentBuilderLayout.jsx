import Sidebar from "./AgentBuilderSidebar";

const AgentBuilderLayout = ({ children }) => {
	return (
		<div className="flex h-screen bg-gray-700">
			{/* Sidebar */}
			<Sidebar isAdmin={false} />

			{/* Main Content */}
			<div className="flex-1 overflow-y-auto">
				<main className="pl-12 md:pl-0">{children}</main>
			</div>
		</div>
	);
};

export default AgentBuilderLayout;
