/**
 * Partner Portal Feature Module
 *
 * Exports for the partner portal feature.
 * Fluxo: Onboarding → Compra Créditos → Criar Entrega → Upload → Voucher
 */

// Pages
export { PartnerDashboard } from "./PartnerDashboard";
export { CreditsPage } from "./CreditsPage";
export { CreateDeliveryPage } from "./CreateDeliveryPage";
export { DeliveryDetailPage } from "./DeliveryDetailPage";
export { DeliveriesListPage } from "./DeliveriesListPage";
// ProLandingPage foi movido para o projeto landingpage (pro.html)
export { PartnerLoginPage } from "./PartnerLoginPage";
export { PartnerRegisterPage } from "./PartnerRegisterPage";
export { PartnerSettingsPage } from "./PartnerSettingsPage";
export { DeliveryUploadPage } from "./DeliveryUploadPage";
export { PartnerNotificationsPage } from "./PartnerNotificationsPage";

// Components
export { VoucherCard } from "./VoucherCard";

// Hooks
export { usePartnerUpload } from "./usePartnerUpload";

// API
export * from "./api";

// Types
export type * from "./types";
