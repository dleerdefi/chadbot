import { createBrowserRouter } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import AdminUsers from "../pages/AdminUsers";
import AdminBots from "../pages/AdminBots";
import CreateBot from "../pages/CreateBot.jsx";
import UpdateBot from "../pages/UpdateBot.jsx";

const router = createBrowserRouter([
	{
		path: "/login",
		element: <Login />,
	},
	{
		path: "/register",
		element: <Register />,
	},
	{
		path: "/forgot-password",
		element: <ForgotPassword />,
	},
	{
		path: "/admin/dashboard",
		element: <AdminRoute component={AdminDashboard} />,
	},
	{
		path: "/admin/users",
		element: <AdminRoute component={AdminUsers} />,
	},
	{
		path: "/admin/bots",
		element: <AdminRoute component={AdminBots} />,
	},
	{
		path: "/admin/bot/new",
		element: <AdminRoute component={CreateBot} />,
	},
	{
		path: "/admin/bot/:id",
		element: <AdminRoute component={UpdateBot} />,
	},
	{
		path: "/",
		element: <PrivateRoute component={Home} />,
	},
]);

export default router;
