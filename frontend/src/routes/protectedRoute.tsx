import { Navigate, Outlet } from "react-router-dom";
import { useStore } from "@/store/store";

const ProtectedRoute = () => {
  const { accessToken } = useStore();

  // For testing purposes, allow access to dashboard without authentication
  // TODO: Remove this in production
  if (accessToken || window.location.pathname === '/app/dashboard') return <Outlet />;

  return <Navigate to="/" replace />;
};

export default ProtectedRoute;
