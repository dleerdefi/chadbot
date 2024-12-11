import { createContext, useContext, useState } from "react";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
	const [error, setError] = useState(null);
	const [success, setSuccess] = useState(null);
	const [isCollapsed, setIsCollapsed] = useState(false); //admin sidebar

	return (
		<AppContext.Provider
			value={{ error, setError, success, setSuccess, isCollapsed, setIsCollapsed }}
		>
			{children}
		</AppContext.Provider>
	);
};

export const useApp = () => useContext(AppContext);
