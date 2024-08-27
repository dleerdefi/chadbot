import React, { createContext, useState, useContext, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useApp } from "./AppContext";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const { setError, setSuccess } = useApp();

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
			if (firebaseUser) {
				try {
					setLoading(true);
					const response = await axiosInstance.get("/api/current_user");
					setUser({ ...response.data });
				} catch (err) {
					if (err.response?.data.message) {
						setError(err.response.data.message);
					} else {
						setError(err.message);
					}
					setUser(null);
				}
			} else {
				setUser(null);
			}

			setLoading(false);
		});

		return unsubscribe;
	}, []);

	const login = async (email, password) => {
		try {
			setLoading(true);
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const token = await userCredential.user.getIdToken();
			const response = await axiosInstance.get(
				`${process.env.REACT_APP_API_URL}/api/current_user`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			setUser({ ...response.data });
			setLoading(false);
			setSuccess("Logged in successfully!");
		} catch (err) {
			setLoading(false);

			if (err.response?.data.message) {
				setError(err.response.data.message);
			} else {
				setError(err.message);
			}
		}
	};

	const logout = async () => {
		try {
			await auth.signOut();
			setUser(null);
			setSuccess("Logged out successfully!");
		} catch (error) {
			setError(error);
			throw error;
		}
	};

	const register = async (email, password, username) => {
		try {
			setLoading(true);
			const userCredential = await auth.createUserWithEmailAndPassword(email, password);
			const token = await userCredential.user.getIdToken();
			const response = await axiosInstance.post("/register", { email, username });
			setUser({ ...response.data, token });
			setSuccess("Registered successfully!");
			setLoading(false);
		} catch (err) {
			if (err.response?.data.message) {
				setError(err.response.data.message);
			} else {
				setError(err.message);
			}
			setLoading(false);
		}
	};

	const value = {
		user,
		setUser,
		loading,
		login,
		logout,
		register,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
