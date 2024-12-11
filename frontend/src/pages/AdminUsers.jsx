import React, { useEffect, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import axiosInstance from "../lib/axiosInstance";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp } from "../contexts/AppContext";
import { UserX, UserCheck, UserCog } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminUsers = () => {
	const [users, setUsers] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isUsersLoading, setIsUsersLoading] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [actionUser, setActionUser] = useState(null);
	const [actionType, setActionType] = useState(null);
	const { setError, setSuccess } = useApp();

	const USERS_PER_PAGE = 10;

	useEffect(() => {
		// Fetch users
		(async (page) => {
			try {
				setIsUsersLoading(true);
				const response = await axiosInstance.get(
					`/api/users/admin?page=${page}&limit=${USERS_PER_PAGE}`
				);

				setUsers(response.data.users);
				setTotalPages(response.data.totalPages);
				setIsUsersLoading(false);
			} catch (error) {
				setError("Failed to fetch users");
				setIsUsersLoading(false);
			}
		})(currentPage);
	}, [currentPage]);

	// Action handlers
	const handleDelete = async () => {
		if (!actionUser) return;
		try {
			setIsLoading(true);
			await axiosInstance.delete(`/api/users/admin/delete-account/${actionUser._id}`);
			setUsers((prev) => prev.filter((user) => user._id !== actionUser._id));
			setSuccess("Account deleted successfully");
		} catch (error) {
			setError("Failed to delete account");
		} finally {
			setActionUser(null);
			setActionType(null);
			setIsLoading(false);
		}
	};

	const handleBan = async () => {
		if (!actionUser) return;
		try {
			setIsLoading(true);
			const { data } = await axiosInstance.put(
				`/api/users/admin/ban-account/${actionUser._id}`
			);
			setUsers((prev) => {
				const userIndex = prev.findIndex((user) => user._id === actionUser._id);
				if (userIndex !== -1) {
					const newUsers = [...prev];
					newUsers[userIndex] = data.user;
					return newUsers;
				}
				return prev;
			});
			setSuccess("Account banned successfully");
		} catch (error) {
			setError("Failed to ban account");
		} finally {
			setActionUser(null);
			setActionType(null);
			setIsLoading(false);
		}
	};

	const handleUnban = async () => {
		if (!actionUser) return;
		try {
			setIsLoading(true);
			const { data } = await axiosInstance.put(
				`/api/users/admin/unban-account/${actionUser._id}`
			);
			setUsers((prev) => {
				const userIndex = prev.findIndex((user) => user._id === actionUser._id);
				if (userIndex !== -1) {
					const newUsers = [...prev];
					newUsers[userIndex] = data.user;
					return newUsers;
				}
				return prev;
			});
			setSuccess("Account unbanned successfully");
		} catch (error) {
			setError("Failed to unban account");
		} finally {
			setActionUser(null);
			setActionType(null);
			setIsLoading(false);
		}
	};

	// Confirm action trigger
	const confirmAction = (user, type) => {
		setActionUser(user);
		setActionType(type);
	};

	// Generate page numbers
	const generatePageNumbers = () => {
		const pageNumbers = [];
		const maxPageButtons = 5;

		let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
		let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

		if (endPage - startPage + 1 < maxPageButtons) {
			startPage = Math.max(1, endPage - maxPageButtons + 1);
		}

		for (let i = startPage; i <= endPage; i++) {
			pageNumbers.push(i);
		}

		return pageNumbers;
	};

	// Render confirmation dialog based on action type
	const renderConfirmationDialog = () => {
		if (!actionUser) return null;

		const dialogConfig = {
			delete: {
				title: "Delete User Account",
				description: `Are you sure you want to permanently delete the account for ${actionUser.username}?`,
				action: handleDelete,
				variant: "destructive",
			},
			ban: {
				title: "Ban User Account",
				description: `Are you sure you want to ban the account for ${actionUser.username}?`,
				action: handleBan,
				variant: "destructive",
			},
			unban: {
				title: "Unban User Account",
				description: `Are you sure you want to unban the account for ${actionUser.username}?`,
				action: handleUnban,
				variant: "default",
			},
		};

		const config = dialogConfig[actionType];

		return (
			<AlertDialog open={!!actionUser} onOpenChange={() => setActionUser(null)}>
				<AlertDialogContent className="bg-blue-950/80 border-blue-800/80 text-blue-100">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-blue-200 text-xl">
							{config.title}
						</AlertDialogTitle>
						<AlertDialogDescription className="text-blue-300">
							{config.description}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							className="
							bg-blue-900/50 
							text-blue-200 
							hover:bg-blue-900/70 
							border-blue-800 
							hover:text-blue-100
						"
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={config.action}
							className={`
							${
								config.variant === "destructive"
									? "bg-red-900/70 text-red-200 hover:bg-red-900"
									: "bg-blue-700 text-blue-100 hover:bg-blue-600"
							}
						`}
						>
							Confirm
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		);
	};

	return (
		<DashboardLayout>
			<div className="bg-blue-950/50 min-h-screen p-4 sm:p-8 text-blue-100">
				<div className="bg-gray-900/40 rounded-xl shadow-2xl overflow-hidden">
					{/* Header */}
					<div className="bg-blue-900/10 px-4 sm:px-6 py-4 flex justify-between items-center border-b border-blue-800">
						<h1 className="text-xl sm:text-3xl font-bold text-blue-200 flex items-center gap-2 sm:gap-3">
							<UserCog className="w-6 h-6 sm:w-8 sm:h-8" />
							User Management
						</h1>
					</div>

					{/* Users Table */}
					<div className="overflow-x-auto">
						<Table className="w-full">
							<TableHeader className="bg-blue-700/50 justify-between">
								<TableRow>
									<TableHead className="w-[100px]">User ID</TableHead>
									<TableHead>Username</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-center">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isUsersLoading ? (
									Array.from({ length: USERS_PER_PAGE }).map((_, index) => (
										<TableRow key={`skeleton-${index}`}>
											<TableCell colSpan={6}>
												<Skeleton className="h-9 bg-gray-600/30 mx-2" />
											</TableCell>
										</TableRow>
									))
								) : users.length > 0 ? (
									<>
										{users.map((user) => (
											<TableRow
												key={user._id}
												className="hover:bg-blue-900/60 transition-colors"
											>
												<TableCell className="font-medium text-blue-300 truncate max-w-[100px]">
													{user._id}
												</TableCell>
												<TableCell className="text-blue-300 truncate">
													{user.username}
												</TableCell>
												<TableCell className="text-blue-300 truncate">
													{user.email}
												</TableCell>
												<TableCell>
													<span
														className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-300 bg-green-900/50`}
													>
														{user.isAdmin ? "Admin" : "User"}
													</span>
												</TableCell>
												<TableCell>
													<span
														className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
															user.isBanned
																? "bg-red-900/50 text-red-300"
																: "bg-green-900/50 text-green-300"
														}`}
													>
														{user.isBanned ? "Banned" : "Active"}
													</span>
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-center space-x-2">
														<Button
															variant="destructive"
															disabled={isLoading}
															onClick={() =>
																confirmAction(user, "delete")
															}
															size="sm"
															className="bg-red-900/70 hover:bg-red-900 text-red-200 flex items-center gap-2"
														>
															<UserX className="w-4 h-4" />
															Delete
														</Button>
														{user.isBanned ? (
															<Button
																variant="outline"
																disabled={isLoading}
																onClick={() =>
																	confirmAction(user, "unban")
																}
																size="sm"
																className="bg-blue-900/30 text-blue-200 hover:text-blue-50 hover:bg-blue-800/50 flex items-center gap-2"
															>
																<UserCheck className="w-4 h-4" />
																Unban
															</Button>
														) : (
															<Button
																variant="outline"
																disabled={isLoading}
																onClick={() =>
																	confirmAction(user, "ban")
																}
																size="sm"
																className="bg-blue-900/30 text-blue-200 hover:text-blue-50 hover:bg-blue-800/50 flex items-center gap-2"
															>
																<UserCheck className="w-4 h-4" />
																Ban
															</Button>
														)}
													</div>
												</TableCell>
											</TableRow>
										))}
										{/* Placeholder rows */}
										{Array.from({ length: USERS_PER_PAGE - users.length }).map(
											(_, index) => (
												<TableRow
													className="border-none hover:bg-inherit"
													key={`placeholder-${index}`}
												>
													<TableCell
														colSpan={6}
														className="py-[34.45px]"
													/>
												</TableRow>
											)
										)}
									</>
								) : (
									// No users case
									Array.from({ length: USERS_PER_PAGE }).map((_, index) => (
										<TableRow key={index}>
											<TableCell
												colSpan={6}
												className="text-center text-blue-300"
											>
												<Skeleton className="h-12 bg-gray-600/30 w-full" />
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					<div className="bg-blue-900/30 p-4">
						<Pagination>
							<PaginationContent className="flex justify-center items-center space-x-2">
								<PaginationItem>
									<PaginationPrevious
										href="#"
										onClick={(e) => {
											e.preventDefault();
											setCurrentPage(Math.max(1, currentPage - 1));
										}}
										className={`
                                            ${
												currentPage === 1
													? "opacity-50 cursor-not-allowed"
													: "hover:bg-blue-800/50"
											} 
                                            text-blue-200
                                        `}
									/>
								</PaginationItem>

								{generatePageNumbers().map((number) => (
									<PaginationItem key={number}>
										<PaginationLink
											href="#"
											onClick={(e) => {
												e.preventDefault();
												setCurrentPage(number);
											}}
											className={`
                                                ${
													currentPage === number
														? "bg-blue-700 text-white"
														: "bg-blue-900/30 text-blue-300 hover:bg-blue-800/50"
												}
                                            `}
										>
											{number}
										</PaginationLink>
									</PaginationItem>
								))}

								<PaginationItem>
									<PaginationNext
										href="#"
										onClick={(e) => {
											e.preventDefault();
											setCurrentPage(Math.min(totalPages, currentPage + 1));
										}}
										className={`
                                            ${
												currentPage === totalPages
													? "opacity-50 cursor-not-allowed"
													: "hover:bg-blue-800/50"
											} 
                                            text-blue-200
                                        `}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				</div>

				{/* Confirmation Dialog */}
				{renderConfirmationDialog()}
			</div>
		</DashboardLayout>
	);
};

export default AdminUsers;
