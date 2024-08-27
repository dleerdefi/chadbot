import { auth } from "../lib/firebase";

const refreshToken = async () => {
	const currentUser = auth.currentUser;
	if (currentUser) {
		try {
			return await currentUser.getIdToken(true);
		} catch (error) {
			console.error("Error refreshing token:", error);
			return null;
		}
	}
	return null;
};

export default refreshToken;
