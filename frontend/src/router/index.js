import { createBrowserRouter } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
// import Register from "../pages/Register/Register";
// import ResetPassword from "../pages/ResetPassword/ResetPassword";
// import Account from "../pages/Account/Account";

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
	// {
	// 	path: "/account",
	// 	element: <PrivateRoute component={Account} />,
	// },
]);

export default router;
