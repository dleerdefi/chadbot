import React, { useState } from "react";
import axios from "../axiosConfig";
import { useNavigate } from "react-router-dom";
import { signOut, getAuth } from "firebase/auth";
import { auth } from "../firebase";
import "../AccountSection.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000"; // Adjust this if your backend is on a different port

const AccountSection = ({ user, setUser }) => {
	const [username, setUsername] = useState(user.username || "");
	const [bio, setBio] = useState(user.bio || "");
	const [profilePic, setProfilePic] = useState(user.profilePic || "");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const navigate = useNavigate();

	const updateProfile = async () => {
		try {
			const response = await axios.post("/api/update-profile", { username, bio });
			console.log("Profile update response:", response.data);
			setUser(response.data.user);
			setSuccess("Profile updated successfully");
			setError("");
		} catch (error) {
			console.error("Error updating profile:", error);
			setError("Failed to update profile: " + (error.response?.data?.error || error.message));
			setSuccess("");
		}
	};

	const handleFileUpload = async (event) => {
		const file = event.target.files[0];
		const formData = new FormData();
		formData.append("profilePic", file);

		try {
			const firebaseUser = getAuth().currentUser;
			const idToken = await firebaseUser.getIdToken(true);
			const response = await axios.post(`${API_URL}/api/upload-profile-pic`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
					Authorization: `Bearer ${idToken}`,
				},
			});
			console.log("Upload response:", response.data);
			const fullProfilePicUrl = `${API_URL}${response.data.profilePicUrl}`;
			setProfilePic(fullProfilePicUrl);
			setUser({ ...user, profilePic: fullProfilePicUrl });
			setSuccess("Profile picture uploaded successfully");
			setError("");
		} catch (error) {
			console.error("Error uploading profile picture:", error);
			setError(
				"Failed to upload profile picture: " +
					(error.response?.data?.error || error.message)
			);
			setSuccess("");
		}
	};

	const handleLogout = async () => {
		try {
			await signOut(auth);
			setUser(null);
			navigate("/login");
		} catch (error) {
			console.error("Error signing out:", error);
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
				const firebaseUser = getAuth().currentUser;
				const idToken = await firebaseUser.getIdToken(true);
				await axios.delete(`${API_URL}/api/delete-account`, {
					headers: { Authorization: `Bearer ${idToken}` },
				});
				// Log out the user and redirect to home page
				await handleLogout();
			} catch (error) {
				console.error("Error deleting account:", error);
				setError("Failed to delete account. Please try again.");
			}
		}
	};

	const fullProfilePicUrl = profilePic ? `${API_URL}${profilePic}` : "/default-avatar.png";

	return (
		<div className="account-section">
			<h3>Account</h3>
			<img
				src={fullProfilePicUrl}
				alt="Profile"
				className="profile-pic"
				style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "50%" }}
			/>
			<input type="file" onChange={handleFileUpload} accept="image/*" />
			<p>Email: {user.email}</p>
			<div>
				<label htmlFor="username">Username:</label>
				<input
					type="text"
					id="username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>
			</div>
			<div>
				<label htmlFor="bio">Bio:</label>
				<textarea
					id="bio"
					value={bio}
					onChange={(e) => setBio(e.target.value)}
					rows="4"
					style={{ width: "100%", marginBottom: "10px" }}
				/>
			</div>
			<button onClick={updateProfile}>Update Profile</button>
			{error && <p style={{ color: "red" }}>{error}</p>}
			{success && <p style={{ color: "green" }}>{success}</p>}
			<button onClick={handleLogout} className="logout-button">
				Log Out
			</button>
			<button onClick={handleDeleteAccount} className="delete-account-btn">
				Delete Account
			</button>
		</div>
	);
};

export default AccountSection;
