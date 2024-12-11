import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loading from "../components/Loading";
import { useApp } from "../contexts/AppContext";

const AdminRoute = ({ component: Component }) => {
	const { user, loading } = useAuth();
	const { setError } = useApp();

	if (loading) {
		return <Loading />;
	}

	if (!user) {
		return <Navigate to="/login" />;
	}

	if (!user.isAdmin) {
		setError("Not Authorized");
		return <Navigate to="/" />;
	}

	return <Component />;
};

export default AdminRoute;
