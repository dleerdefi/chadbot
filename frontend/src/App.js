import React, { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { useApp } from "./contexts/AppContext";
import { ToastContainer, toast } from "react-toastify";

const App = () => {
	const { error, setError, success, setSuccess } = useApp();

	useEffect(() => {
		if (error) {
			console.log(error);
			toast.error(error);
			setError(null);
		}
	}, [error]);

	useEffect(() => {
		if (success) {
			toast.success(success);
			setSuccess(null);
		}
	}, [success]);

	return (
		<div className="app-container">
			<RouterProvider router={router} />
			<ToastContainer />
		</div>
	);
};

export default App;
