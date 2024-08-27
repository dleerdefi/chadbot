import axios from "axios";
import { getAuth } from "firebase/auth";
import refreshToken from "./refreshToken";

const axiosInstance = axios.create({
	baseURL: process.env.REACT_APP_API_URL,
});

axiosInstance.interceptors.request.use(
	async (config) => {
		try {
			const auth = getAuth();
			const user = auth.currentUser;

			if (user) {
				const idToken = await refreshToken();
				config.headers["Authorization"] = `Bearer ${idToken}`;
			} else {
				console.log("No Firebase user found");
			}
		} catch (error) {
			console.error("Error getting Firebase ID token:", error);
		}

		return config;
	},
	(error) => {
		console.error("Error in request interceptor:", error);
		return Promise.reject(error);
	}
);

axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response && error.response.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;
			try {
				const auth = getAuth();
				const user = auth.currentUser;

				if (user) {
					const idToken = await refreshToken();
					if (idToken) {
						originalRequest.headers["Authorization"] = `Bearer ${idToken}`;
						return axiosInstance(originalRequest);
					}
				}

			} catch (refreshError) {
				console.error("Error refreshing token:", refreshError);
			}
		}

		return Promise.reject(error);
	}
);

export default axiosInstance;
