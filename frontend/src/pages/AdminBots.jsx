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
import { Brain, Trash2, Edit2, PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const AdminBots = () => {
	const [bots, setBots] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [isBotsLoading, setIsBotsLoading] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [actionBot, setActionBot] = useState(null);
	const [actionType, setActionType] = useState(null);
	const { setError, setSuccess } = useApp();
	const navigate = useNavigate();

	const BOTS_PER_PAGE = 10;

	useEffect(() => {
		// Fetch bots
		(async (page) => {
			try {
				setIsBotsLoading(true);
				const response = await axiosInstance.get(
					`/api/bots/admin?page=${page}&limit=${BOTS_PER_PAGE}`
				);

				setBots(response.data.bots);
				setTotalPages(response.data.totalPages);
				setIsBotsLoading(false);
			} catch (error) {
				setError("Failed to fetch bots");
				setIsBotsLoading(false);
			}
		})(currentPage);
	}, [currentPage]);

	// Action handlers
	const handleDelete = async () => {
		if (!actionBot) return;
		try {
			setIsLoading(true);
			await axiosInstance.delete(`/api/bots/${actionBot._id}`);
			setBots((prev) => prev.filter((bot) => bot._id !== actionBot._id));
			setSuccess("Bot deleted successfully");
		} catch (error) {
			setError("Failed to delete Bot");
		} finally {
			setActionBot(null);
			setActionType(null);
			setIsLoading(false);
		}
	};

	// Confirm action trigger
	const confirmAction = (bot, type) => {
		setActionBot(bot);
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
		if (!actionBot) return null;

		const dialogConfig = {
			delete: {
				title: "Delete Bot",
				description: `Are you sure you want to permanently delete the bot: ${actionBot.username}?`,
				action: handleDelete,
				variant: "destructive",
			},
		};

		const config = dialogConfig[actionType];

		return (
			<AlertDialog open={!!actionBot} onOpenChange={() => setActionBot(null)}>
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
							<Brain className="w-6 h-6 sm:w-8 sm:h-8" />
							Bot Management
						</h1>
						<Button
							onClick={() => navigate("/admin/bot/new")}
							className="
								bg-blue-700/70 
								text-green-100 
								hover:bg-blue-700 
								flex items-center 
								gap-2 
								transition-colors 
								duration-300 
								ease-in-out
							"
						>
							<PlusCircle className="w-5 h-5" />
							Create Bot
						</Button>
					</div>

					{/* Bots Table */}
					<div className="overflow-x-auto">
						<Table className="w-full">
							<TableHeader className="bg-blue-700/50 justify-between">
								<TableRow>
									<TableHead className="w-[100px]">Bot ID</TableHead>
									<TableHead className="text-left">Username</TableHead>
									<TableHead className="text-left">Role</TableHead>
									<TableHead className="text-left">Type</TableHead>
									<TableHead className="text-center">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isBotsLoading ? (
									Array.from({ length: BOTS_PER_PAGE }).map((_, index) => (
										<TableRow key={`skeleton-${index}`}>
											<TableCell colSpan={6}>
												<Skeleton className="h-9 bg-gray-600/30 mx-2" />
											</TableCell>
										</TableRow>
									))
								) : bots.length > 0 ? (
									<>
										{bots.map((bot) => (
											<TableRow
												key={bot._id}
												className="hover:bg-blue-900/60 transition-colors"
											>
												<TableCell className="font-medium text-blue-300 truncate max-w-[100px]">
													{bot._id}
												</TableCell>
												<TableCell className="text-blue-300 truncate ">
													{bot.username}
												</TableCell>
												<TableCell className="text-blue-300 truncate ">
													{bot.botRole}
												</TableCell>
												<TableCell className="text-blue-300 truncate">
													{bot.botType}
												</TableCell>

												<TableCell className="text-right">
													<div className="flex justify-center space-x-2">
														<Button
															variant="destructive"
															disabled={isLoading}
															onClick={() =>
																confirmAction(bot, "delete")
															}
															size="sm"
															className="bg-red-900/70 hover:bg-red-900 text-red-200 flex items-center gap-2"
														>
															<Trash2 className="w-4 h-4" />
															Delete
														</Button>
														<Button
															variant="outline"
															disabled={isLoading}
															onClick={() =>
																navigate(`/admin/bot/${bot._id}`)
															}
															size="sm"
															className="bg-blue-900/30 text-blue-200 hover:text-blue-50 hover:bg-blue-800/50 flex items-center gap-2"
														>
															<Edit2 className="w-4 h-4" />
															Edit
														</Button>
													</div>
												</TableCell>
											</TableRow>
										))}
										{/* Placeholder rows */}
										{Array.from({ length: BOTS_PER_PAGE - bots.length }).map(
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
									Array.from({ length: BOTS_PER_PAGE }).map((_, index) => (
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

export default AdminBots;
