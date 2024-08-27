import React from "react";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import "./App.css";
import { useApp } from "./contexts/AppContext";

const App = () => {
	const {error, setError, success, setSuccess} = useApp();
	

	console.log(error, success)
	console.log(setError, setSuccess)
	return <RouterProvider router={router} />;
};

export default App;
