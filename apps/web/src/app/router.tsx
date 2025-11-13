import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { MomentsListPage } from "@/features/moments/pages/MomentsListPage";
import { MomentDetailPage } from "@/features/moments/pages/MomentDetailPage";
import { CapsulePage } from "@/features/capsule/pages/CapsulePage";
import { VaultPage } from "@/features/vault/pages/VaultPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { SaudePage } from "@/pages/SaudePage";
import { VisitasPage } from "@/pages/VisitasPage";
import { PerfilCriancaPage } from "@/pages/PerfilCriancaPage";
import { MomentDraftPage } from "@/pages/MomentDraftPage";
import { MomentAvulsoPage } from "@/pages/MomentAvulsoPage";

export function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Main app routes with layout */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/momentos" element={<MomentsListPage />} />
          <Route path="/momentos/:id" element={<MomentDetailPage />} />
          <Route path="/capsula" element={<CapsulePage />} />
          <Route path="/cofre" element={<VaultPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route
            path="/jornada/moment/draft/:template_id"
            element={<MomentDraftPage />}
          />
          <Route path="/jornada/moment/avulso" element={<MomentAvulsoPage />} />
          <Route path="/saude" element={<SaudePage />} />
          <Route path="/visitas" element={<VisitasPage />} />
          <Route
            path="/jornada/perfil-crianca"
            element={<PerfilCriancaPage />}
          />
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
