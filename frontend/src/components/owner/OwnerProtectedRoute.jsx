import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function OwnerProtectedRoute({ children }) {
  const { user, loading } = useAuth();

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

  return user && user.user_type === "hostel_owner" ? children : <Navigate to="/login" />;
}