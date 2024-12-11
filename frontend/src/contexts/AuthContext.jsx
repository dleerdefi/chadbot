import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	sendPasswordResetEmail,
	GoogleAuthProvider,
	signInWithPopup,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import axiosInstance, {
	storeTokens,
	clearTokens,
	refreshFirebaseToken,
} from "../lib/axiosInstance";
import { useApp } from "./AppContext";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const { setError, setSuccess } = useApp();

	// Helper function to handle Firebase authentication errors
	const handleAuthError = (error) => {
		console.error("Auth error:", error);
		clearTokens();
		setLoading(false);

		if (error.code === "auth/email-already-in-use") {
			setError("This email is already registered.");
		} else if (error.code === "auth/weak-password") {
			setError("Password should be at least 6 characters.");
		} else if (error.code === "auth/user-not-found") {
			setError("No user found with this email.");
		} else if (error.code === "auth/wrong-password") {
			setError("Incorrect password.");
		} else if (error.response?.data?.message) {
			setError(error.response.data.message);
		} else {
			setError(error.message || "An error occurred. Please try again.");
		}
	};

	// Fetch current user data from backend
	const fetchCurrentUser = async (firebaseToken) => {
		const response = await axiosInstance.get(`/api/users/me`, {
			headers: { Authorization: `Bearer ${firebaseToken}` },
		});

		return { ...response.data, firebaseToken };
	};

	// Firebase auth state listener
	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
			try {
				if (firebaseUser) {
					setLoading(true);
					const firebaseToken = await firebaseUser.getIdToken();

					const userData = await fetchCurrentUser(firebaseToken);
					storeTokens(userData.token, firebaseToken);
					setUser(userData.user);
				} else {
					clearTokens();
					setUser(null);
				}
			} catch (error) {
				clearTokens();
				setUser(null);
			} finally {
				setLoading(false);
			}
		});

		return () => unsubscribe();
	}, []);

	// Login handler
	const login = useCallback(async ({ email, password }, callback) => {
		setLoading(true);
		try {
			// Firebase authentication
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const firebaseToken = await userCredential.user.getIdToken();

			// Backend authentication
			const response = await axiosInstance.post(`/api/users/login`, null, {
				headers: { Authorization: `Bearer ${firebaseToken}` },
			});

			// Store tokens and update user state
			storeTokens(response.data.token, firebaseToken);
			setUser(response.data.user);
			callback();
			setSuccess("Logged in successfully!");
		} catch (error) {
			console.log(error);

			handleAuthError(error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Register handler
	const register = useCallback(
		async ({ email, password, username }, callback) => {
			setLoading(true);
			try {
				// Create Firebase account
				const userCredential = await createUserWithEmailAndPassword(auth, email, password);
				const firebaseToken = await userCredential.user.getIdToken();
				// Register with backend
				const response = await axiosInstance.post(
					`/api/users/register`,
					{
						username,
						photoURL: userCredential.user.photoURL || "",
					},
					{
						headers: { Authorization: `Bearer ${firebaseToken}` },
					}
				);

				// Store tokens and update user state
				storeTokens(response.data.token, firebaseToken);
				setUser(response.data.user);
				setSuccess("Registration successful!");
				callback();
			} catch (error) {
				// If backend registration fails, delete Firebase account
				if (error.response && auth.currentUser) {
					await auth.currentUser.delete();
				}
				handleAuthError(error);
			} finally {
				setLoading(false);
			}
		},
		[setError, setSuccess]
	);

	// Google Sign In handler
	const handleGoogleSignIn = async () => {
		setLoading(true);
		try {
			const provider = new GoogleAuthProvider();
			const result = await signInWithPopup(auth, provider);
			const firebaseToken = await result.user.getIdToken();

			console.log(result);

			// Authenticate with backend
			const response = await axiosInstance.post(
				`/api/users/google`,
				{
					photoURL: result.user.photoURL || "",
				},
				{
					headers: { Authorization: `Bearer ${firebaseToken}` },
				}
			);

			storeTokens(response.data.token, firebaseToken);
			setUser(response.data.user);
			setSuccess("Logged in with Google successfully!");
		} catch (error) {
			handleAuthError(error);
		} finally {
			setLoading(false);
		}
	};

	// Logout handler
	const logout = useCallback(async () => {
		try {
			await auth.signOut();
			clearTokens();
			setUser(null);
			setSuccess("Logged out successfully!");
		} catch (error) {
			console.log(error, "logout");
			handleAuthError(error);
		}
	}, []);

	// Logout handler
	const deleteAccount = async () => {
		try {
			await axiosInstance.delete(`/api/users/delete-account`);
			setUser(null);
			clearTokens();
			setSuccess("Account deleted successfully!");
		} catch (error) {
			if (error.response?.data?.message) {
				setError(error.response.data.message);
			} else {
				setError(error.message || "An error occurred. Please try again.");
			}
		}
	};

	// Password reset handler
	const handleForgotPassword = async ({ email }, callback) => {
		try {
			if (!email) {
				setError("Please enter your email to reset the password.");
				return;
			}

			setLoading(true);
			await sendPasswordResetEmail(auth, email);
			setSuccess("Password reset email sent! Check your inbox.");
			callback();
		} catch (error) {
			handleAuthError(error);
		} finally {
			setLoading(false);
		}
	};

	// Token refresh handler
	const refreshUserSession = async () => {
		try {
			const newFirebaseToken = await refreshFirebaseToken();
			const userData = await fetchCurrentUser(newFirebaseToken);
			setUser(userData);
			return true;
		} catch (error) {
			handleAuthError(error);
			return false;
		}
	};

	const value = {
		user,
		setUser,
		loading,
		login,
		logout,
		register,
		handleForgotPassword,
		handleGoogleSignIn,
		refreshUserSession,
		deleteAccount,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export default AuthProvider;
