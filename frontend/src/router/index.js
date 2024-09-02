import { createBrowserRouter } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
// import Register from "../pages/Register";
// import ResetPassword from "../pages/ResetPassword";

const router = createBrowserRouter([
	{
		path: "/login",
		element: <Login />,
	},
	// {
	// 	path: "/register",
	// 	element: <Register />,
	// },
	// {
	// 	path: "/reset-password",
	// 	element: <ResetPassword />,
	// },
	{
		path: "/",
		element: <PrivateRoute component={Home} />,
	},
]);

export default router;
