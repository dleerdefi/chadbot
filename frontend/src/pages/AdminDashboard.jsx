import React, { useCallback, useEffect, useState } from "react";
import { Bot, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "../components/DashboardLayout";
import {
	LineChart,
	Line,
	XAxis,
	Tooltip,
	ResponsiveContainer,
	PieChart as RechartsPieChart,
	Pie,
	Cell,
} from "recharts";
import axiosInstance from "@/lib/axiosInstance";
import { useApp } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const AdminDashboard = () => {
	const [timeframe, setTimeframe] = useState("overall");
	const [isLoading, setIsLoading] = useState(true);
	const [dashboardData, setDashboardData] = useState(null);
	const { setError } = useApp();

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setIsLoading(true);
				const response = await axiosInstance.get(
					`/api/admin/dashboard-analytics?type=${timeframe}`
				);

				setDashboardData(response.data);
				setIsLoading(false);
			} catch (error) {
				setError("Failed to fetch dashboard data");
				setIsLoading(false);
			}
		};

		fetchDashboardData();
	}, [timeframe]);

	const renderMetricsSkeleton = useCallback(
		() => (
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{[...Array(3)].map((_, index) => (
					<Card key={index} className="bg-blue-950/30 border-blue-800/30">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24 bg-blue-800/20" />
							<Skeleton className="h-4 w-4 rounded-full bg-blue-800/20" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-20 bg-blue-800/20" />
							<Skeleton className="h-px w-full my-2 bg-blue-800/20" />
							<div className="flex items-center gap-1">
								<Skeleton className="h-4 w-4 bg-blue-800/20" />
								<Skeleton className="h-4 w-32 bg-blue-800/20" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		),
		[]
	);

	const renderChartSkeleton = useCallback(
		() => (
			<>
				<h3 className="mt-6">User & Bot Growth</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
					{[...Array(2)].map((_, index) => (
						<Card key={index} className="bg-blue-950/30 border-blue-800/30">
							<CardHeader>
								<Skeleton className="h-5 w-32 bg-blue-800/20" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-[300px] w-full bg-blue-800/20" />
							</CardContent>
						</Card>
					))}
				</div>
			</>
		),
		[]
	);

	const renderDistributionSkeleton = useCallback(
		() => (
			<>
				<h3 className="mt-6">User Role & Bot Type Distribution</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
					{[...Array(2)].map((_, index) => (
						<Card key={index} className="bg-blue-950/30 border-blue-800/30">
							<CardHeader>
								<Skeleton className="h-5 w-32 bg-blue-800/20" />
							</CardHeader>
							<CardContent>
								<div className="flex flex-col items-center">
									<Skeleton className="h-[250px] w-[250px] rounded-full bg-blue-800/20" />
									<div className="flex justify-center space-x-4 mt-4">
										{[...Array(3)].map((_, i) => (
											<div key={i} className="flex items-center space-x-2">
												<Skeleton className="h-4 w-4 rounded-full bg-blue-800/20" />
												<Skeleton className="h-4 w-16 bg-blue-800/20" />
											</div>
										))}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</>
		),
		[]
	);

	const renderTableSkeleton = useCallback(
		() => (
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{[...Array(2)].map((_, index) => (
					<Card key={index} className="bg-blue-950/30 border-blue-800/30">
						<CardHeader>
							<Skeleton className="h-5 w-32 bg-blue-800/20" />
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow className="border-blue-800">
										<TableHead className="text-blue-300">
											<Skeleton className="h-4 w-16 bg-blue-800/20" />
										</TableHead>
										<TableHead className="text-blue-300">
											<Skeleton className="h-4 w-16 bg-blue-800/20" />
										</TableHead>
										<TableHead className="text-blue-300">
											<Skeleton className="h-4 w-16 bg-blue-800/20" />
										</TableHead>
										{index === 1 && (
											<TableHead className="text-blue-300">
												<Skeleton className="h-4 w-16 bg-blue-800/20" />
											</TableHead>
										)}
									</TableRow>
								</TableHeader>
								<TableBody>
									{[...Array(5)].map((_, rowIndex) => (
										<TableRow key={rowIndex} className="border-blue-800/30">
											<TableCell>
												<Skeleton className="h-4 w-24 bg-blue-800/20" />
											</TableCell>
											<TableCell>
												<Skeleton className="h-6 w-16 bg-blue-800/20" />
											</TableCell>
											<TableCell>
												<Skeleton className="h-4 w-20 bg-blue-800/20" />
											</TableCell>
											{index === 1 && (
												<TableCell>
													<Skeleton className="h-4 w-20 bg-blue-800/20" />
												</TableCell>
											)}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				))}
			</div>
		),
		[]
	);

	return (
		<DashboardLayout>
			<div className="p-6 bg-blue-950/50 min-h-screen text-gray-100 space-y-6">
				{/* Header */}
				<div className="flex justify-between items-center">
					<h1 className="text-3xl font-bold text-blue-100">Dashboard</h1>
					<Select
						value={timeframe}
						onValueChange={(val) => {
							if (val !== timeframe) setTimeframe(val);

							return;
						}}
					>
						<SelectTrigger className="w-[180px] bg-blue-900/50 border-blue-800">
							<SelectValue placeholder="Select Timeframe" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="weekly">Weekly</SelectItem>
							<SelectItem value="monthly">Monthly</SelectItem>
							<SelectItem value="yearly">Yearly</SelectItem>
							<SelectItem value="overall">Overall</SelectItem>
						</SelectContent>
					</Select>
				</div>
				{/* Key Metrics */}
				{isLoading ? (
					renderMetricsSkeleton()
				) : (
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<Card className="bg-blue-950/30 border-blue-800/30">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-blue-200">
									Total Users
								</CardTitle>
								<Bot className="h-4 w-4 text-blue-400" />
							</CardHeader>
							<CardContent>
								{/* Display total bots prominently */}
								<div className="text-3xl font-bold text-blue-100">
									{dashboardData?.totalUsers}
								</div>
								{/* Add a divider for better visual separation */}
								<hr className="my-2 border-blue-800/40" />
								{/* Show recent bot creation activity */}
								<div className="text-sm text-blue-200">
									<p className="text-xs text-green-400 flex items-center">
										<TrendingUp className="h-4 w-4 mr-1" />
										{dashboardData?.recentUsers.length} users registered in
										{timeframe === "weekly"
											? " this week"
											: timeframe === "yearly"
											? " this year"
											: timeframe === "monthly"
											? " this month"
											: " total"}
									</p>
								</div>
							</CardContent>
						</Card>
						<Card className="bg-blue-950/30 border-blue-800/30">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-blue-200">
									Total Bots
								</CardTitle>
								<Bot className="h-4 w-4 text-blue-400" />
							</CardHeader>
							<CardContent>
								{/* Display total bots prominently */}
								<div className="text-3xl font-bold text-blue-100">
									{dashboardData?.totalBots}
								</div>
								{/* Add a divider for better visual separation */}
								<hr className="my-2 border-blue-800/40" />
								{/* Show recent bot creation activity */}
								<div className="text-sm text-blue-200">
									<p className="text-xs text-green-400 flex items-center">
										<TrendingUp className="h-4 w-4 mr-1" />
										{dashboardData?.recentBots.length} bots created in
										{timeframe === "weekly"
											? " this week"
											: timeframe === "yearly"
											? " this year"
											: timeframe === "monthly"
											? " this month"
											: " total"}
									</p>
								</div>
							</CardContent>
						</Card>
						<Card className="bg-blue-950/30 border-blue-800/30">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium text-blue-200">
									Total Bots
								</CardTitle>
								<Bot className="h-4 w-4 text-blue-400" />
							</CardHeader>
							<CardContent>
								{/* Display total bots prominently */}
								<div className="text-3xl font-bold text-blue-100">
									{dashboardData?.totalMessages}
								</div>
								{/* Add a divider for better visual separation */}
								<hr className="my-2 border-blue-800/40" />
								{/* Show recent bot creation activity */}
								<div className="text-sm text-blue-200">
									<p className="text-xs text-green-400 flex items-center">
										<TrendingUp className="h-4 w-4 mr-1" />
										{dashboardData?.messageActivity?.reduce(
											(sum, activity) => sum + activity.count,
											0
										) || 0}{" "}
										messages created in
										{timeframe === "weekly"
											? " this week"
											: timeframe === "yearly"
											? " this year"
											: timeframe === "monthly"
											? " this month"
											: " total"}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				)}
				{isLoading ? (
					renderChartSkeleton()
				) : (
					<div>
						<h3 className="mt-6">User & Bot Growth</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
							<Card className="bg-blue-950/30 border-blue-800/30">
								<CardHeader>
									<CardTitle className="text-blue-200">User Growth</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer className="px-2" width="100%" height={300}>
										<LineChart
											data={dashboardData?.userGrowth || []}
											margin={{ top: 10, right: 40, left: 40, bottom: 0 }}
										>
											<XAxis
												dataKey="label"
												stroke="#4299E1"
												className="text-blue-400"
												interval={0} // Show all ticks
											/>
											<Tooltip
												contentStyle={{
													backgroundColor: "#1A365D",
													color: "white",
													textTransform: "capitalize",
												}}
											/>
											<Line
												type="monotone"
												dataKey="registered"
												stroke="#3182CE"
												strokeWidth={3}
											/>
										</LineChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
							<Card className="bg-blue-950/30 border-blue-800/30">
								<CardHeader>
									<CardTitle className="text-blue-200">Bot Growth</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer className="px-2" width="100%" height={300}>
										<LineChart
											data={dashboardData?.botGrowth || []}
											margin={{ top: 10, right: 40, left: 40, bottom: 0 }}
										>
											<XAxis
												dataKey="label"
												stroke="#4299E1"
												className="text-blue-400"
												interval={0} // Show all ticks
											/>
											<Tooltip
												contentStyle={{
													backgroundColor: "#1A365D",
													color: "white",
													textTransform: "capitalize",
												}}
											/>
											<Line
												type="monotone"
												dataKey="created"
												stroke="#3182CE"
												strokeWidth={3}
											/>
										</LineChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						</div>
					</div>
				)}
				{isLoading ? (
					renderDistributionSkeleton()
				) : (
					<div>
						<h3 className="mt-6">User Role & Bot Type Distribution</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
							{/* User Role Distribution */}
							<Card className="bg-blue-950/30 border-blue-800/30">
								<CardHeader>
									<CardTitle className="text-blue-200">User Roles</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={300}>
										<div className="flex flex-col items-center">
											<RechartsPieChart width={400} height={250}>
												<Pie
													className="outline-none"
													data={dashboardData?.userRoleDistribution || []}
													cx="50%"
													cy="50%"
													labelLine={false}
													outerRadius={80}
													fill="#8884d8"
													dataKey="count"
													nameKey="role"
													label={({ name, percent }) =>
														`${name}: ${(percent * 100).toFixed(0)}%`
													}
												>
													{(
														dashboardData?.userRoleDistribution || []
													).map((entry, index) => (
														<Cell
															className="outline-none"
															key={`cell-${index}`}
															fill={COLORS[index % COLORS.length]}
														/>
													))}
												</Pie>
												<Tooltip
													contentStyle={{
														backgroundColor: "white",
														color: "#1A365D",
													}}
												/>
											</RechartsPieChart>
											{/* Custom Legend */}
											<div className="flex justify-center space-x-4 mt-4">
												{(dashboardData?.userRoleDistribution || []).map(
													(entry, index) => (
														<div
															key={`legend-${index}`}
															className="flex items-center space-x-2"
														>
															<div
																className="w-4 h-4 rounded-full"
																style={{
																	backgroundColor:
																		COLORS[
																			index % COLORS.length
																		],
																}}
															/>
															<span className="text-blue-200">
																{entry.role}: {entry.count}
															</span>
														</div>
													)
												)}
											</div>
										</div>
									</ResponsiveContainer>
								</CardContent>
							</Card>

							{/* Bot Type Distribution */}
							<Card className="bg-blue-950/30 border-blue-800/30">
								<CardHeader>
									<CardTitle className="text-blue-200">Bot Types</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer width="100%" height={300}>
										<div className="flex flex-col items-center">
											<RechartsPieChart width={400} height={250}>
												<Pie
													className="outline-none"
													data={dashboardData?.botTypeDistribution || []}
													cx="50%"
													cy="50%"
													labelLine={false}
													outerRadius={80}
													fill="#8884d8"
													dataKey="count"
													nameKey="type"
													label={({ name, percent }) =>
														`${name}: ${(percent * 100).toFixed(0)}%`
													}
												>
													{(dashboardData?.botTypeDistribution || []).map(
														(entry, index) => (
															<Cell
																className="outline-none"
																key={`cell-${index}`}
																fill={COLORS[index % COLORS.length]}
															/>
														)
													)}
												</Pie>
												<Tooltip
													contentStyle={{
														backgroundColor: "white",
														color: "#1A365D",
													}}
												/>
											</RechartsPieChart>
											{/* Custom Legend */}
											<div className="flex justify-center space-x-4 mt-4">
												{(dashboardData?.botTypeDistribution || []).map(
													(entry, index) => (
														<div
															key={`legend-${index}`}
															className="flex items-center space-x-2"
														>
															<div
																className="w-4 h-4 rounded-full"
																style={{
																	backgroundColor:
																		COLORS[
																			index % COLORS.length
																		],
																}}
															/>
															<span className="text-blue-200">
																{entry.type}: {entry.count}
															</span>
														</div>
													)
												)}
											</div>
										</div>
									</ResponsiveContainer>
								</CardContent>
							</Card>
						</div>
					</div>
				)}

				{/* Recent Users and Bots */}
				{isLoading ? (
					renderTableSkeleton()
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
						{/* Recent Users */}
						<Card className="bg-blue-950/30 border-blue-800/30">
							<CardHeader>
								<CardTitle className="text-blue-200">Recent Users</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow className="border-blue-800">
											<TableHead className="text-blue-300 text-left">
												Name
											</TableHead>
											<TableHead className="text-blue-300 text-left">
												Role
											</TableHead>
											<TableHead className="text-blue-300 text-left">
												Joined
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{dashboardData?.recentUsers?.slice(0, 10).map((user) => (
											<TableRow key={user._id} className="border-blue-800/30">
												<TableCell className="text-blue-100">
													{user.username}
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className={` -ms-2 ${
															user.isAdmin
																? "text-blue-400 border-blue-400"
																: "text-green-400 border-green-400"
														}`}
													>
														{user.isAdmin ? "Admin" : "User"}
													</Badge>
												</TableCell>
												<TableCell className="text-blue-200">
													{new Date(user.createdAt).toLocaleDateString()}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>

						{/* Recent Bots */}
						<Card className="bg-blue-950/30 border-blue-800/30">
							<CardHeader>
								<CardTitle className="text-blue-200">Recent Bots</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow className="border-blue-800">
											<TableHead className="text-blue-300 text-left">
												Name
											</TableHead>
											<TableHead className="text-blue-300 text-left">
												Role
											</TableHead>
											<TableHead className="text-blue-300 text-left">
												Type
											</TableHead>
											<TableHead className="text-blue-300 text-left">
												Created
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{dashboardData?.recentBots?.slice(0, 10).map((bot) => (
											<TableRow key={bot._id} className="border-blue-800/30">
												<TableCell className="text-blue-100">
													{bot.username}
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className="text-green-400 border-green-400  -ms-2"
													>
														{bot.botRole}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														variant="outline"
														className="text-blue-400 border-blue-400  -ms-2"
													>
														{bot.botType}
													</Badge>
												</TableCell>
												<TableCell className="text-blue-200">
													{new Date(bot.createdAt).toLocaleDateString()}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</div>
				)}
			</div>
		</DashboardLayout>
	);
};

export default AdminDashboard;
