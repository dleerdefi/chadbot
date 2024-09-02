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
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
				<div className="bg-gray-800 p-6 rounded-lg shadow-md text-center text-white">
					Password has been reset successfully. Redirecting to login...
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
			<div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm">
				<h2 className="text-2xl font-bold text-center text-white mb-4">Reset Password</h2>
				{error && <p className="text-red-500 text-center mb-4">{error}</p>}
				<form onSubmit={handleResetPassword} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-1">
							New Password
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full p-2 text-gray-900 rounded-md border border-gray-600 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-1">
							Confirm New Password
						</label>
						<input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							className="w-full p-2 text-gray-900 rounded-md border border-gray-600 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
						/>
					</div>
					<button
						type="submit"
						className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition duration-300"
					>
						Reset Password
					</button>
				</form>
			</div>
		</div>
	);
};

export default ResetPassword;
