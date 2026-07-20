import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { StaffRole } from "./authApi";

export function ProtectedRoute({ roles, children }: { roles?: StaffRole[]; children: React.ReactNode }) {
  const { staff } = useAuth();

  if (!staff) return <Navigate to="/login" replace />;
  if (roles && staff.role !== "MANAGEMENT" && !roles.includes(staff.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
