import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, getAuth } from "firebase/auth";
import "./Account.css";
import { useAuth } from "../../contexts/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { auth } from "../../lib/firebase";
import { useApp } from "../../contexts/AppContext";
import { useWebSocket } from "../../contexts/WebSocketContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const Account = ({ collapsed }) => {
	const { user, setUser } = useAuth();
	const { updateMessagesUser } = useWebSocket();
	const [username, setUsername] = useState(user.username || "");
	const [bio, setBio] = useState(user.bio || "");
	const { setSuccess, setError } = useApp();
	const navigate = useNavigate();

	const updateProfile = async () => {
		try {
			const response = await axiosInstance.post("/api/update-profile", { username, bio });
			setUser(response.data.user);
			updateMessagesUser(response.data.user);
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
			updateMessagesUser(response.data.user);
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

	if (collapsed) {
		return (
			<div className="account-section account-section--collapsed">
				<img
					src={`${API_URL}${user.profilePic}`}
					alt="Profile"
					className="account-section__avatar"
				/>
			</div>
		);
	}

	return (
		<div className="account-section">
			<h3 className="account-section__title">Account</h3>
			<img
				src={`${API_URL}${user.profilePic}`}
				alt="Profile"
				className="account-section__avatar"
			/>
			<input
				type="file"
				onChange={handleFileUpload}
				accept="image/*"
				className="account-section__file-input"
			/>
			<p className="account-section__email">Email: {user.email}</p>
			<div className="account-section__field">
				<label htmlFor="username">Username:</label>
				<input
					type="text"
					id="username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					className="account-section__input"
				/>
			</div>
			<div className="account-section__field">
				<label htmlFor="bio">Bio:</label>
				<textarea
					id="bio"
					value={bio}
					onChange={(e) => setBio(e.target.value)}
					rows="4"
					className="account-section__textarea"
				/>
			</div>
			<button onClick={updateProfile} className="account-section__button">
				Update Profile
			</button>
			<button
				onClick={handleLogout}
				className="account-section__button account-section__button--logout"
			>
				Log Out
			</button>
			<button
				onClick={handleDeleteAccount}
				className="account-section__button account-section__button--delete"
			>
				Delete Account
			</button>
		</div>
	);
};

export default Account;
