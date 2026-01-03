import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./screens/LoginPage";
import { AdminLayout } from "./screens/admin/AdminLayout";
import { AdminDashboardPage } from "./screens/admin/AdminDashboardPage";
import { AdminAffiliatesPage } from "./screens/admin/AdminAffiliatesPage";
import { AdminAffiliateDetailPage } from "./screens/admin/AdminAffiliateDetailPage";
import { AffiliateLayout } from "./screens/affiliate/AffiliateLayout";
import { AffiliateDashboardPage } from "./screens/affiliate/AffiliateDashboardPage";
import { AffiliateSettingsPage } from "./screens/affiliate/AffiliateSettingsPage";
import { RequireSession } from "./session/RequireSession";
import { BridgeRecordSalePage } from "./screens/bridge/BridgeRecordSalePage";

export function AppRouter() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/bridge/record-sale" element={<BridgeRecordSalePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <RequireSession role="company_admin">
              <AdminLayout />
            </RequireSession>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="affiliates" element={<AdminAffiliatesPage />} />
          <Route
            path="affiliates/:affiliateId"
            element={<AdminAffiliateDetailPage />}
          />
        </Route>

        <Route
          path="/affiliate"
          element={
            <RequireSession role="affiliate">
              <AffiliateLayout />
            </RequireSession>
          }
        >
          <Route index element={<AffiliateDashboardPage />} />
          <Route path="settings" element={<AffiliateSettingsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
