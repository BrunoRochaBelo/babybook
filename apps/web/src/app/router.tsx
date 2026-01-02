import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { PartnerLayout } from "@/layouts/PartnerLayout";
import RequireAuth from "@/components/Auth/RequireAuth";
import RequirePhotographer from "@/components/Auth/RequirePhotographer";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { CheckoutSuccessPage } from "@/pages/CheckoutSuccessPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { MomentDetailPage } from "@/features/moments/pages/MomentDetailPage";
import { CapsulePage } from "@/features/capsule/pages/CapsulePage";
import { VaultPage } from "@/features/vault/pages/VaultPage";
import { ProfilePage } from "@/features/profile/pages/ProfilePage";
import { SaudePage } from "@/pages/SaudePage";
import { VisitasPage } from "@/pages/VisitasPage";
import { PerfilCriancaPage } from "@/pages/PerfilCriancaPage";
import { MomentDraftPage } from "@/features/moments/pages/MomentDraftPage";
import { MomentAvulsoPage } from "@/pages/MomentAvulsoPage";
// Partner Portal
import {
  PartnerDashboard,
  CreditsPage,
  CreateDeliveryPage,
  DeliveryDetailPage,
  DeliveriesListPage,
  PartnerLoginPage,
  PartnerRegisterPage,
  PartnerSettingsPage,
  DeliveryUploadPage,
  PartnerNotificationsPage,
} from "@/features/partner-portal";
// Voucher Redemption
import { VoucherRedemptionPage } from "@/features/vouchers";
// Onboarding
import { OnboardingPage } from "@/features/onboarding";
// Add Moment Wizard
import { AddMomentPage } from "@/pages/AddMomentPage";
// Share Page
import { SharedMomentPage } from "@/pages/SharedMomentPage";
import { ImportDeliveryPage } from "@/pages/ImportDeliveryPage";
// B2C Settings Pages
import {
  MinhaContaPage,
  NotificacoesPage,
  PrivacidadePage,
  AjudaPage,
  TermosPage,
  FamiliaPage,
  AssinaturaPage,
  ArmazenamentoPage,
} from "@/features/settings";

function LegacyMomentosRedirect() {
  return <Navigate to="/jornada" replace />;
}

function LegacyMomentosDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/jornada/moment/${id}` : "/jornada"} replace />;
}

function LegacyJourneyChaptersRedirect() {
  return <Navigate to="/jornada" replace />;
}

export function AppRouter() {
  return (
    <Router future={{ v7_relativeSplatPath: true }}>
      <Routes>
        {/* Main app routes with layout */}
        <Route
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route path="/jornada" element={<DashboardPage />} />
          <Route
            path="/dashboard"
            element={<Navigate to="/jornada" replace />}
          />
          {/* Rotas legadas: páginas antigas de momentos */}
          <Route path="/momentos" element={<LegacyMomentosRedirect />} />
          <Route
            path="/momentos/:id"
            element={<LegacyMomentosDetailRedirect />}
          />
          <Route path="/capsula" element={<CapsulePage />} />
          <Route path="/cofre" element={<VaultPage />} />
          <Route path="/perfil-usuario" element={<ProfilePage />} />
          <Route
            path="/perfil"
            element={<Navigate to="/perfil-usuario" replace />}
          />
          <Route
            path="/jornada/moment/draft/:template_id"
            element={<MomentDraftPage />}
          />
          <Route path="/jornada/moment/:id" element={<MomentDetailPage />} />
          <Route path="/jornada/moment/avulso" element={<MomentAvulsoPage />} />
          <Route path="/app/novo-momento" element={<AddMomentPage />} />
          {/* Rota legada: visão de capítulo completo */}
          <Route
            path="/jornada/capitulos/:chapterId"
            element={<LegacyJourneyChaptersRedirect />}
          />
          <Route path="/saude" element={<SaudePage />} />
          <Route path="/visitas" element={<VisitasPage />} />
          <Route
            path="/jornada/perfil-crianca"
            element={<PerfilCriancaPage />}
          />
          <Route
            path="/jornada/importar-entrega/:deliveryId"
            element={<ImportDeliveryPage />}
          />
          {/* B2C Settings Pages */}
          <Route path="/jornada/minha-conta" element={<MinhaContaPage />} />
          <Route path="/jornada/notificacoes" element={<NotificacoesPage />} />
          <Route path="/jornada/privacidade" element={<PrivacidadePage />} />
          <Route path="/jornada/familia" element={<FamiliaPage />} />
          <Route path="/jornada/assinatura" element={<AssinaturaPage />} />
          <Route
            path="/jornada/armazenamento"
            element={<ArmazenamentoPage />}
          />
          <Route path="/jornada/ajuda" element={<AjudaPage />} />
          <Route path="/jornada/termos" element={<TermosPage />} />
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/jornada" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Voucher Redemption - Public */}
        <Route
          path="/voucher/redeem/:code"
          element={<VoucherRedemptionPage />}
        />
        <Route path="/resgatar" element={<VoucherRedemptionPage />} />
        <Route path="/resgatar/:code" element={<VoucherRedemptionPage />} />
        <Route path="/resgate" element={<VoucherRedemptionPage />} />
        <Route path="/resgate/:code" element={<VoucherRedemptionPage />} />

        {/* Share Page - Public (for viral loop) */}
        <Route path="/share/:token" element={<SharedMomentPage />} />

        {/* Onboarding - Protected */}
        <Route
          path="/app/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />

        {/* Partner Portal - Public Pages (Login/Register in app, Landing moved to landingpage project) */}
        <Route path="/pro/login" element={<PartnerLoginPage />} />
        <Route path="/pro/register" element={<PartnerRegisterPage />} />

        {/* Partner Portal - Protected with PHOTOGRAPHER role and PartnerLayout */}
        <Route
          element={
            <RequirePhotographer>
              <PartnerLayout />
            </RequirePhotographer>
          }
        >
          <Route path="/partner" element={<PartnerDashboard />} />
          <Route path="/partner/credits" element={<CreditsPage />} />
          <Route path="/partner/settings" element={<PartnerSettingsPage />} />
          <Route
            path="/partner/notifications"
            element={<PartnerNotificationsPage />}
          />
          <Route path="/partner/deliveries" element={<DeliveriesListPage />} />
          <Route
            path="/partner/deliveries/new"
            element={<CreateDeliveryPage />}
          />
          <Route
            path="/partner/deliveries/:deliveryId"
            element={<DeliveryDetailPage />}
          />
          <Route
            path="/partner/deliveries/:deliveryId/upload"
            element={<DeliveryUploadPage />}
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/jornada" replace />} />
      </Routes>
    </Router>
  );
}
