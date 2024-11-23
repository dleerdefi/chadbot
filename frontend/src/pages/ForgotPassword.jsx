import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const { handleForgotPassword, user, loading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		if (user) {
			navigate("/");
		}
	}, [user]);

	const handleSubmit = (e) => {
		e.preventDefault();
		handleForgotPassword({ email }, () => {
			setEmail("");
		});
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
			<form
				onSubmit={handleSubmit}
				className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm space-y-4"
			>
				<h2 className="text-2xl font-bold text-center text-white">Forgot Password</h2>
				<input
					type="email"
					placeholder="Please enter your email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					autoComplete="email"
					className="w-full p-2 text-gray-900 rounded-md border border-gray-600 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
				/>
				<button
					disabled={loading}
					type="submit"
					className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition duration-300"
				>
					Submit
				</button>
				<div className="text-center text-sm text-gray-400 mt-4">
					<span>Get Back to </span>
					<Link to="/login" className="text-green-500 hover:text-green-400">
						Login Page
					</Link>
				</div>
			</form>
		</div>
	);
};

export default ForgotPassword;
