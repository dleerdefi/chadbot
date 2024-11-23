import axios from "axios";
import { getAuth } from "firebase/auth";

const JWT_TOKEN_KEY = "jwt_token";
const FIREBASE_TOKEN_KEY = "firebase_token";

const axiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	timeout: 60000,
});

const getStoredTokens = () => ({
	jwtToken: localStorage.getItem(JWT_TOKEN_KEY),
	firebaseToken: localStorage.getItem(FIREBASE_TOKEN_KEY),
});

const storeTokens = (jwtToken, firebaseToken) => {
	if (jwtToken) localStorage.setItem(JWT_TOKEN_KEY, jwtToken);
	if (firebaseToken) localStorage.setItem(FIREBASE_TOKEN_KEY, firebaseToken);
};

const clearTokens = () => {
	localStorage.removeItem(JWT_TOKEN_KEY);
	localStorage.removeItem(FIREBASE_TOKEN_KEY);
};

const refreshFirebaseToken = async () => {
	const auth = getAuth();
	const user = auth.currentUser;

	if (!user) throw new Error("No Firebase user found");

	try {
		const newToken = await user.getIdToken(true);
		storeTokens(null, newToken); // Store new Firebase token
		return newToken;
	} catch (error) {
		console.error("Failed to refresh Firebase token:", error);
		throw error;
	}
};

const refreshJWT = async (firebaseToken) => {
	try {
		const response = await axios.post(
			`${import.meta.env.VITE_API_URL}/api/users/token-refresh`,
			null,
			{
				headers: { Authorization: `Bearer ${firebaseToken}` },
			}
		);
		const { token: newJWTToken } = response.data;
		storeTokens(newJWTToken, null); // Store the new JWT token
		return newJWTToken;
	} catch (error) {
		console.error("Failed to refresh JWT:", error);
		throw error;
	}
};

// List of routes that do not require tokens
const UNPROTECTED_ROUTES = ["/api/users/register", "/api/users/login", "/api/users/google"];

// Request interceptor
axiosInstance.interceptors.request.use(
	async (config) => {
		// Skip token attachment for unprotected routes
		if (UNPROTECTED_ROUTES.some((route) => config.url?.includes(route))) {
			return config;
		}

		const { jwtToken, firebaseToken } = getStoredTokens();

		// Prioritize JWT token if available; otherwise, use Firebase token
		config.headers.Authorization = jwtToken ? `Bearer ${jwtToken}` : `Bearer ${firebaseToken}`;

		return config;
	},
	(error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (originalRequest._retry) return Promise.reject(error);

		if (error.response?.status === 401) {
			originalRequest._retry = true;

			try {
				// Refresh Firebase token, then JWT token if necessary
				const newFirebaseToken = await refreshFirebaseToken();
				const newJWTToken = await refreshJWT(newFirebaseToken);

				// Set Authorization header with the new JWT token if available, else Firebase token
				originalRequest.headers.Authorization = newJWTToken
					? `Bearer ${newJWTToken}`
					: `Bearer ${newFirebaseToken}`;

				return axiosInstance(originalRequest); // Retry the original request
			} catch (refreshError) {
				console.error("Token refresh failed:", refreshError);
				clearTokens();
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export { getStoredTokens, storeTokens, clearTokens, refreshFirebaseToken, refreshJWT };
export default axiosInstance;
