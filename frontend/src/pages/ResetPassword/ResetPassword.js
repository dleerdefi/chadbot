// src/components/ResetPassword.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "../../firebase";

const ResetPassword = () => {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	const [oobCode, setOobCode] = useState("");

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const code = queryParams.get("oobCode");
		if (code) {
			setOobCode(code);
		} else {
			setError("Invalid password reset link.");
		}
	}, [location]);

	const handleResetPassword = async (e) => {
		e.preventDefault();
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}
		try {
			await confirmPasswordReset(auth, oobCode, password);
			setSuccess(true);
			setTimeout(() => navigate("/login"), 3000);
		} catch (error) {
			setError(error.message);
		}
	};

	if (success) {
		return <div>Password has been reset successfully. Redirecting to login...</div>;
	}

	return (
		<div>
			<h2>Reset Password</h2>
			{error && <p style={{ color: "red" }}>{error}</p>}
			<form onSubmit={handleResetPassword}>
				<div>
					<label>New Password</label>
					<input
						type="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
				</div>
				<div>
					<label>Confirm New Password</label>
					<input
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						required
					/>
				</div>
				<button type="submit">Reset Password</button>
			</form>
		</div>
	);
};

export default ResetPassword;
