import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

const Register = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [username, setUsername] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const navigate = useNavigate();
	const { register, user, loading } = useAuth();

	useEffect(() => {
		if (user) {
			navigate("/");
		}
	}, [user]);

	const handleRegisterSubmit = async (e) => {
		e.preventDefault();

		await register({ email, password, username }, () => {
			setEmail("");
			setPassword("");
			setUsername("");
		});
	};

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
			<form
				onSubmit={handleRegisterSubmit}
				className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-sm space-y-4"
			>
				<h2 className="text-2xl font-bold text-center text-white">Register</h2>
				<input
					type="text"
					placeholder="Username"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					required
					autoComplete="name"
					className="w-full p-2 text-gray-900 rounded-md border border-gray-600 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
				/>
				<input
					type="email"
					placeholder="Email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					autoComplete="email"
					className="w-full p-2 text-gray-900 rounded-md border border-gray-600 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
				/>
				<div className="relative">
					<input
						type={showPassword ? "text" : "password"}
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						autoComplete="new-password"
						className="w-full p-2 text-gray-900 rounded-md border border-gray-600 bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
					/>
					<button
						type="button"
						onClick={togglePasswordVisibility}
						className="absolute right-2 top-2 text-gray-600"
					>
						{showPassword ? <AiFillEyeInvisible size={24} /> : <AiFillEye size={24} />}
					</button>
				</div>
				<button
					disabled={loading}
					type="submit"
					className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition duration-300"
				>
					Register
				</button>
				<div className="text-center text-sm text-gray-400 mt-4">
					<span>Already have an account? </span>
					<Link to="/login" className="text-green-500 hover:text-green-400">
						Login
					</Link>
				</div>
			</form>
		</div>
	);
};

export default Register;
