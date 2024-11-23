import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);

	return (
		<AppContext.Provider value={{ error, setError, success, setSuccess }}>
			{children}
		</AppContext.Provider>
	);
};

export const useApp = () => useContext(AppContext);
