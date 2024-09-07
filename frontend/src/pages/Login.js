import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	sendPasswordResetEmail,
	GoogleAuthProvider,
	signInWithPopup,
	getAuth,
} from "firebase/auth";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";

const Login = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { login, setUser, user } = useAuth();
	const { setError, setSuccess } = useApp();
	const auth = getAuth();
	const navigate = useNavigate();

	const handleEmailPasswordSubmit = (e) => {
		e.preventDefault();
		login(email, password);
	};

	const handleGoogleSignIn = async () => {
		try {
			const provider = new GoogleAuthProvider();
			const result = await signInWithPopup(auth, provider);
			const user = result.user;
			setUser(user);
		} catch (err) {
			setError(err.message);
		}
	};

	const handleForgotPassword = async () => {
		if (!email) {
			setError("Please enter your email to reset the password.");
			return;
		}
		try {
			await sendPasswordResetEmail(auth, email);
			setSuccess("Password reset email sent! Check your inbox.");
		} catch (err) {
			setError(err.message);
		}
	};

	useEffect(() => {
		if (user) {
			navigate("/");
		}
	}, [user]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
			<form
				onSubmit={handleEmailPasswordSubmit}
				className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm space-y-4"
			>
				<h2 className="text-2xl font-bold text-center text-white">Login</h2>
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					autoComplete="email"
					className="w-full p-2 text-gray-900 rounded-md border border-gray-600 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
				/>
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					autoComplete="current-password"
					className="w-full p-2 text-gray-900 rounded-md border border-gray-600 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
				/>
				<button
					type="submit"
					className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition duration-300"
				>
					Login
				</button>
				<button
					type="button"
					onClick={handleForgotPassword}
					className="w-full text-sm text-gray-400 hover:text-gray-300 transition duration-300"
				>
					Forgot Password?
				</button>
				<div className="flex items-center justify-center my-2">
					<span className="text-gray-500">OR</span>
				</div>
				<button
					type="button"
					onClick={handleGoogleSignIn}
					className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-300"
				>
					Sign in with Google
				</button>
				<div className="text-center text-sm text-gray-400 mt-4">
					<span>Don't have an account? </span>
					<Link to="/register" className="text-green-500 hover:text-green-400">
						Create Account
					</Link>
				</div>
			</form>
		</div>
	);
};

export default Login;