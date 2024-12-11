import React from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Construction, Clock, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const AdminDashboard = () => {
	return (
		<DashboardLayout>
			<div className="bg-blue-950/50 min-h-screen flex items-center justify-center p-4">
				<Card className="max-w-2xl w-full bg-gray-900/40 border-blue-800/30 shadow-2xl">
					<CardContent className="p-8 text-center">
						<div className="flex flex-col items-center space-y-6">
							<Construction
								className="w-24 h-24 text-blue-300 mb-4 animate-pulse"
								strokeWidth={1.5}
							/>

							<h1 className="text-4xl font-bold text-blue-100 mb-4">Coming Soon</h1>

							<div className="flex items-center space-x-4 mb-6">
								<Clock className="w-6 h-6 text-blue-400" />
								<p className="text-xl text-blue-200">
									We're working hard to bring you something awesome
								</p>
							</div>

							<div className="bg-blue-950/70 p-4 rounded-lg border border-blue-800/50 mb-6">
								<p className="text-blue-300 italic">
									"Great things take time. Stay tuned for an incredible new
									feature!"
								</p>
							</div>

							<div className="flex space-x-4">
								<Button
									variant="outline"
									className="border-blue-500 bg-gray-800 text-blue-100 
									hover:bg-blue-500/10 hover:text-blue-300"
								>
									<Rocket className="mr-2 h-4 w-4" />
									Get Notified
								</Button>
								<Button
									className="bg-blue-600 text-white 
									hover:bg-blue-700 
									focus:ring-2 focus:ring-blue-500"
								>
									Learn More
								</Button>
							</div>

							<div className="mt-8 text-blue-300 text-sm">
								<p>🚧 Feature under development 🚧</p>
								<p className="mt-2 opacity-70">Expected launch: Coming quarters</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
};

export default AdminDashboard;
