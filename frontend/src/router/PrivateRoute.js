import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Loading from "../components/Loading";

const PrivateRoute = ({ component: Component }) => {
	const { user, loading } = useAuth();


	if (loading) {
		return <Loading />
	}


	return user ? <Component /> : <Navigate to="/login" />;
};

export default PrivateRoute;
