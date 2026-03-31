import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getHomePathForRole, resolveRole } from "../../utils/authRole";

export default function OwnerProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem("access_token");
  const role = resolveRole(user);

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{
          background: "linear-gradient(180deg,#f7f4ee 0%, #f3efe8 55%, #f8f5ef 100%)",
        }}
      >
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-2 border-[#eadfc7]" />
          <div
            className="absolute inset-0 rounded-full border-t-2 animate-spin"
            style={{ borderTopColor: "#c9a84c" }}
          />
        </div>
        <p className="mt-5 text-sm font-semibold tracking-widest uppercase text-[#a07830]">
          StaySync AI
        </p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role !== "hostel_owner") {
    return <Navigate to={getHomePathForRole(role)} replace />;
  }

  return children;
}
