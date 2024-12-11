import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axiosInstance from "../lib/axiosInstance";
import * as z from "zod";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, Upload, RefreshCw } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { useApp } from "@/contexts/AppContext";

// Zod validation schema
const botSchema = z.object({
	username: z.string().min(2, { message: "Username must be at least 2 characters" }).refine(value => !/\s/.test(value), {
		message: "Username must be a single word without spaces"
	}),
	botRole: z.string().min(2, { message: "Bot role is required" }),
	botType: z.string().min(2, { message: "Bot type is required" }),
	bio: z.string().min(10, { message: "Bio must be at least 10 characters" }),
	botPersonality: z.string().min(10, { message: "Bot personality description is required" }),
});

const CreateBot = () => {
	const [profileImage, setProfileImage] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const { setError, setSuccess } = useApp();

	// Initialize form with zod resolver
	const form = useForm({
		resolver: zodResolver(botSchema),
		defaultValues: {
			username: "",
			botRole: "",
			botType: "",
			bio: "",
			botPersonality: "",
		},
	});

	// Handle image upload
	const handleImageUpload = (event) => {
		const file = event.target.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onloadend = () => {
				setProfileImage(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	// Form submission handler
	const onSubmit = async (botData) => {
		setIsLoading(true);
		try {
			const formData = new FormData();
			formData.append("username", botData.username);
			formData.append("botRole", botData.botRole);
			formData.append("botType", botData.botType);
			formData.append("bio", botData.bio);
			formData.append("botPersonality", botData.botPersonality);

			// Append profile picture if exists
			const fileInput = document.getElementById("profile-picture");
			if (fileInput && fileInput.files[0]) {
				formData.append("bot", fileInput.files[0]);
			}

			await axiosInstance.post("/api/bots/new", formData);

			form.reset();
			setProfileImage(null);
			if (fileInput) {
				fileInput.value = "";
			}
			setSuccess("Bot created successfully");
		} catch (error) {
			if (error.response?.data?.message) {
				setError(error.response.data.message);
			} else {
				setError(error.message || "Error Creating Bot");
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<DashboardLayout>
			<div className="bg-blue-950/50 mx-auto px-4 py-8 min-h-screen flex justify-center items-center ">
				<Card className="max-w-3xl w-full mx-auto bg-gray-900/40 border-blue-800/30 shadow-2xl">
					<CardHeader className="border-b border-blue-800">
						<CardTitle className="flex items-center gap-2 text-blue-100">
							<Bot className="w-6 h-6 text-blue-300" />
							Create New Bot
						</CardTitle>
					</CardHeader>
					<CardContent className="bg-gray-900/40 py-6">
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
								<div className="flex space-x-6 items-center">
									{/* Profile Picture Upload */}
									<div className="flex flex-col items-center">
										<Avatar className="w-24 h-24 mb-4 ring-2 ring-blue-500/50">
											<AvatarImage
												src={profileImage || "/default-bot-avatar.png"}
												alt="Bot Profile"
												className="object-cover"
											/>
											<AvatarFallback className="bg-blue-950/90">
												<Bot className="w-12 h-12 text-blue-300" />
											</AvatarFallback>
										</Avatar>
										<input
											type="file"
											id="profile-picture"
											accept="image/*"
											className="hidden"
											onChange={handleImageUpload}
										/>
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="border-blue-500 bg-gray-800 text-blue-100 hover:bg-blue-500/10 hover:text-blue-300"
											onClick={() =>
												document.getElementById("profile-picture").click()
											}
										>
											<Upload className="mr-2 h-4 w-4" /> Upload Picture
										</Button>
									</div>

									{/* Username and Bot Type */}
									<div className="flex-grow space-y-4">
										<FormField
											control={form.control}
											name="username"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-blue-100">
														Username
													</FormLabel>
													<FormControl>
														<Input
															placeholder="Enter bot username"
															className="bg-blue-950/90 border-blue-800 text-blue-100 
															focus:ring-blue-500/50  focus:border-blue-500 
															!placeholder-gray-300/70"
															{...field}
														/>
													</FormControl>
													<FormMessage className="text-red-400" />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="botType"
											render={({ field }) => (
												<FormItem>
													<FormLabel className="text-blue-100">
														Bot Type
													</FormLabel>
													<Select
														onValueChange={field.onChange}
														defaultValue={field.value}
													>
														<FormControl>
															<SelectTrigger
																className="bg-blue-950/30 border-blue-800 
																text-gray-300/70
																focus:ring-blue-500/50  
																focus:border-blue-500"
															>
																<SelectValue placeholder="Select bot type" />
															</SelectTrigger>
														</FormControl>
														<SelectContent className="bg-blue-950 border-blue-800">
															<SelectItem
																value="basic"
																className="focus:bg-blue-700/30 
																text-blue-100 
																focus:text-blue-50"
															>
																Basic
															</SelectItem>
															<SelectItem
																value="dev"
																className="focus:bg-blue-700/30 
																text-blue-100 
																focus:text-blue-50"
															>
																Dev
															</SelectItem>
															<SelectItem
																value="qc"
																className="focus:bg-blue-700/30 
																text-blue-100 
																focus:text-blue-50"
															>
																QC
															</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage className="text-red-400" />
												</FormItem>
											)}
										/>
									</div>
								</div>

								{/* Bot Role */}
								<FormField
									control={form.control}
									name="botRole"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-blue-100">
												Bot Role
											</FormLabel>
											<FormControl>
												<Input
													placeholder="Define bot's primary role"
													className="bg-blue-950/90 border-blue-800 
													text-blue-100 
													focus:ring-blue-500/50  
													focus:border-blue-500
													!placeholder-gray-300/70"
													{...field}
												/>
											</FormControl>
											<FormDescription className="text-blue-300">
												Describe the main purpose or function of your bot
											</FormDescription>
											<FormMessage className="text-red-400" />
										</FormItem>
									)}
								/>

								{/* Bio */}
								<FormField
									control={form.control}
									name="bio"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-blue-100">Bio</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Write a brief description about the bot"
													className="resize-none bg-blue-950/90 
													border-blue-800 
													text-blue-100 
													focus:ring-blue-500/50  
													focus:border-blue-500
													!placeholder-gray-300/70"
													{...field}
												/>
											</FormControl>
											<FormDescription className="text-blue-300">
												A short description that helps users understand your
												bot
											</FormDescription>
											<FormMessage className="text-red-400" />
										</FormItem>
									)}
								/>

								{/* Bot Personality */}
								<FormField
									control={form.control}
									name="botPersonality"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-blue-100">
												Bot Personality
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Describe the bot's personality traits"
													className="resize-none h-24 bg-blue-950/90 
													border-blue-800 
													text-blue-100 
													focus:ring-blue-500/50  
													focus:border-blue-500
													!placeholder-gray-300/70"
													{...field}
												/>
											</FormControl>
											<FormDescription className="text-blue-300">
												Define the communication style, tone, and key
												characteristics
											</FormDescription>
											<FormMessage className="text-red-400" />
										</FormItem>
									)}
								/>

								{/* Submit Button */}
								<Button
									type="submit"
									className="w-full bg-blue-600 text-white 
									hover:bg-blue-700 
									focus:ring-2 focus:ring-blue-500 
									focus:ring-offset-2 focus:ring-offset-blue-950"
									disabled={isLoading}
								>
									{isLoading ? (
										<>
											<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
											Creating Bot...
										</>
									) : (
										"Create Bot"
									)}
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	);
};

export default CreateBot;
