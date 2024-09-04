import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../utils/axiosInstance";
import { auth } from "../lib/firebase";
import { useApp } from "../contexts/AppContext";
import { useWebSocket } from "../contexts/WebSocketContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const Account = ({ collapsed, toggleCollapse }) => {
	const { user, setUser } = useAuth();
	const { updateUser } = useWebSocket();
	const [username, setUsername] = React.useState(user.username || "");
	const [bio, setBio] = React.useState(user.bio || "");
	const { setSuccess, setError } = useApp();
	const navigate = useNavigate();
	const accountRef = useRef(null);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (accountRef.current && !accountRef.current.contains(event.target)) {
				toggleCollapse(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [toggleCollapse]);

	const updateProfile = async () => {
		try {
			const response = await axiosInstance.post("/api/update-profile", { username, bio });
			setUser(response.data.user);
			updateUser(response.data.user);
			setSuccess("Profile updated successfully");
		} catch (error) {
			setError("Failed to update profile: " + (error.response?.data?.error || error.message));
		}
	};

	const handleFileUpload = async (event) => {
		const file = event.target.files[0];
		const formData = new FormData();
		formData.append("profilePic", file);

		try {
			const response = await axiosInstance.post(`/api/upload-profile-pic`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			setUser(response.data.user);
			updateUser(response.data.user);
			setSuccess("Profile picture uploaded successfully");
		} catch (error) {
			setError(
				"Failed to upload profile picture: " +
					(error.response?.data?.error || error.message)
			);
		}
	};

	const handleLogout = async () => {
		try {
			await signOut(auth);
			setUser(null);
			navigate("/login");
		} catch (error) {
			setError("Failed to log out");
		}
	};

	const handleDeleteAccount = async () => {
		if (
			window.confirm(
				"Are you sure you want to delete your account? This action cannot be undone."
			)
		) {
			try {
				await axiosInstance.delete(`/api/delete-account`);
				await handleLogout();
			} catch (error) {
				setError("Failed to delete account. Please try again.");
			}
		}
	};

	return (
		<>
			{collapsed && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-10"
					onClick={toggleCollapse}
					style={{ pointerEvents: collapsed ? "auto" : "none" }}
				/>
			)}

			<div
				ref={accountRef}
				className={`absolute transition-all duration-300 ease-in-out bg-gray-800 h-full right-0 top-0 flex flex-col overflow-auto scrollbar-hidden ${
					collapsed ? "w-80 p-4 translate-x-0" : "w-0 translate-x-full"
				} z-20`}
			>
				<div className="flex items-center mb-4">
					<img
						src={`${API_URL}${user.profilePic}`}
						alt="Profile"
						className={`w-16 h-16 rounded-full border-2 border-gray-700 text-xs ${
							collapsed ? "mx-auto" : ""
						}`}
					/>
					{collapsed && (
						<div className="ml-4 flex flex-col">
							<h3 className="text-xl text-white mb-2">{user.username}</h3>
							<p className="text-gray-400">{user.email}</p>
						</div>
					)}
				</div>
				{collapsed && (
					<div className="flex flex-col space-y-4">
						<input
							type="file"
							onChange={handleFileUpload}
							accept="image/*"
							className="text-sm text-gray-200 file:bg-blue-500 file:text-white file:py-2 file:px-4 file:rounded-md file:cursor-pointer hover:file:bg-blue-600"
						/>
						<div className="space-y-2">
							<label
								htmlFor="username"
								className="block text-white text-sm font-semibold"
							>
								Username:
							</label>
							<input
								type="text"
								id="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="p-2 rounded-md border border-gray-600 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
								placeholder="Enter your username"
							/>
						</div>
						<div className="space-y-2">
							<label htmlFor="bio" className="block text-white text-sm font-semibold">
								Bio:
							</label>
							<textarea
								id="bio"
								value={bio}
								onChange={(e) => setBio(e.target.value)}
								rows="4"
								className="p-2 rounded-md border border-gray-600 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
								placeholder="Write something about yourself"
							/>
						</div>
						<div className="space-y-2 flex flex-col">
							<button
								onClick={updateProfile}
								className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors duration-200"
							>
								Update Profile
							</button>
							<button
								onClick={handleLogout}
								className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors duration-200"
							>
								Log Out
							</button>
							<button
								onClick={handleDeleteAccount}
								className="bg-red-700 text-white py-2 px-4 rounded-md hover:bg-red-800 transition-colors duration-200"
							>
								Delete Account
							</button>
						</div>
					</div>
				)}
			</div>
		</>
	);
};

export default Account;
