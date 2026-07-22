import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./shared/layout/AppShell";
import { ProtectedRoute } from "./shared/auth/ProtectedRoute";
import { useAuth } from "./shared/auth/AuthContext";
import { LoginPage } from "./modules/auth/pages/LoginPage";
import { StaffAdminPage } from "./modules/staff/pages/StaffAdminPage";
import { RoomBoardPage } from "./modules/rooms/pages/RoomBoardPage";
import { BookingsPage } from "./modules/rooms/pages/BookingsPage";
import { CheckOutPage } from "./modules/rooms/pages/CheckOutPage";
import { ManageRoomsPage } from "./modules/rooms/pages/ManageRoomsPage";
import { HousekeepingPage } from "./modules/rooms/pages/HousekeepingPage";
import { TableMapPage } from "./modules/restaurant/pages/TableMapPage";
import { OrderScreenPage } from "./modules/restaurant/pages/OrderScreenPage";
import { MenuManagerPage } from "./modules/restaurant/pages/MenuManagerPage";
import { StoreListPage } from "./modules/liquor/pages/StoreListPage";
import { StoreInventoryPage } from "./modules/liquor/pages/StoreInventoryPage";
import { DashboardPage } from "./modules/reporting/pages/DashboardPage";

const defaultPathByRole: Record<string, string> = {
  MANAGEMENT: "/reporting",
  ROOMS: "/rooms",
  RESTAURANT: "/restaurant",
  LIQUOR: "/liquor",
};

function HomeRedirect() {
  const { staff } = useAuth();
  return <Navigate to={staff ? defaultPathByRole[staff.role] : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />

        <Route path="rooms" element={<ProtectedRoute roles={["ROOMS"]}><RoomBoardPage /></ProtectedRoute>} />
        <Route path="rooms/bookings" element={<ProtectedRoute roles={["ROOMS"]}><BookingsPage /></ProtectedRoute>} />
        <Route path="rooms/bookings/:id/checkout" element={<ProtectedRoute roles={["ROOMS"]}><CheckOutPage /></ProtectedRoute>} />
        <Route path="rooms/manage" element={<ProtectedRoute roles={["ROOMS"]}><ManageRoomsPage /></ProtectedRoute>} />
        <Route path="rooms/housekeeping" element={<ProtectedRoute roles={["ROOMS"]}><HousekeepingPage /></ProtectedRoute>} />

        <Route path="restaurant" element={<ProtectedRoute roles={["RESTAURANT"]}><TableMapPage /></ProtectedRoute>} />
        <Route path="restaurant/orders/:id" element={<ProtectedRoute roles={["RESTAURANT"]}><OrderScreenPage /></ProtectedRoute>} />
        <Route path="restaurant/menu" element={<ProtectedRoute roles={["RESTAURANT"]}><MenuManagerPage /></ProtectedRoute>} />

        <Route path="liquor" element={<ProtectedRoute roles={["LIQUOR"]}><StoreListPage /></ProtectedRoute>} />
        <Route path="liquor/stores/:storeId" element={<ProtectedRoute roles={["LIQUOR"]}><StoreInventoryPage /></ProtectedRoute>} />

        <Route path="reporting" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

        <Route path="staff" element={<ProtectedRoute roles={["MANAGEMENT"]}><StaffAdminPage /></ProtectedRoute>} />

        <Route path="*" element={<HomeRedirect />} />
      </Route>
    </Routes>
  );
}
