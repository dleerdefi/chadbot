import React, { useState } from "react";
import axios from "../../axiosConfig";
import { useNavigate } from "react-router-dom";
import { signOut, getAuth } from "firebase/auth";
import { auth } from "../../firebase";
import "../AccountSection.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const Account = ({ user, setUser, collapsed }) => {
	const [username, setUsername] = useState(user.username || "");
	const [bio, setBio] = useState(user.bio || "");
	const [profilePic, setProfilePic] = useState(user.profilePic || "");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const navigate = useNavigate();

	const updateProfile = async () => {
		try {
			const response = await axios.post("/api/update-profile", { username, bio });
			setUser(response.data.user);
			setSuccess("Profile updated successfully");
			setError("");
		} catch (error) {
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
			const fullProfilePicUrl = `${API_URL}${response.data.profilePicUrl}`;
			setProfilePic(fullProfilePicUrl);
			setUser({ ...user, profilePic: fullProfilePicUrl });
			setSuccess("Profile picture uploaded successfully");
			setError("");
		} catch (error) {
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
				await handleLogout();
			} catch (error) {
				setError("Failed to delete account. Please try again.");
			}
		}
	};

	const fullProfilePicUrl = profilePic ? `${API_URL}${profilePic}` : "/default-avatar.png";

	if (collapsed) {
		return (
			<div className="account-section account-section--collapsed">
				<img src={fullProfilePicUrl} alt="Profile" className="account-section__avatar" />
			</div>
		);
	}

	return (
		<div className="account-section">
			<h3 className="account-section__title">Account</h3>
			<img src={fullProfilePicUrl} alt="Profile" className="account-section__avatar" />
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
			{error && <p className="account-section__error">{error}</p>}
			{success && <p className="account-section__success">{success}</p>}
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
