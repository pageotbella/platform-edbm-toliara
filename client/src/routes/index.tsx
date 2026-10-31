import type { ComponentType } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { PublicLayout } from "@/components/layouts/public-layout";
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignupPage } from "@/features/auth/pages/auth-pages";
import { InvestorMapPage, MapPage } from "@/features/map/pages/map-page";
import { CataloguePage } from "@/features/opportunities/pages/catalogue-page";
import { OpportunityDetailPage } from "@/features/opportunities/pages/opportunity-detail-page";
import { RegionPage, RegionsPage } from "@/features/regions/pages/regions-pages";
import { SectorPage, SectorsPage } from "@/features/sectors/pages/sectors-pages";
import { AboutPage } from "@/pages/about-page";
import { ContactPage } from "@/pages/contact-page";
import { HomePage } from "@/pages/home-page";
import { NotFoundPage } from "@/pages/not-found-page";
import { ProtectedRoute } from "./protected-route";

// Écran d'un espace privé chargé à la demande (hors du bundle du portail public)
const page = (path: string, load: () => Promise<ComponentType>): RouteObject => ({
  path,
  lazy: async () => ({ Component: await load() }),
});
const index = (load: () => Promise<ComponentType>): RouteObject => ({
  index: true,
  lazy: async () => ({ Component: await load() }),
});

const views = {
  notifications: () => import("@/features/notifications/components/notifications-view"),
  profile: () => import("@/features/auth/components/profile-view"),
  portfolio: () => import("@/features/opportunities/components/portfolio"),
  editor: () => import("@/features/opportunities/components/opportunity-editor"),
  staffPages: () => import("@/features/opportunities/pages/staff-pages"),
  documents: () => import("@/features/documents/components/documents-view"),
  pipeline: () => import("@/features/interest-requests/components/requests-pipeline"),
  requestPages: () => import("@/features/interest-requests/pages/request-pages"),
  sectors: () => import("@/features/sectors/components/sectors-view"),
  regions: () => import("@/features/regions/components/regions-view"),
  partnerProjects: () => import("@/features/partner-projects/components/partner-projects-view"),
  stats: () => import("@/features/stats/components/stats-view"),
};

// Écrans communs à l'espace EDBM et à l'administration (prop `base`)
function staffRoutes(base: "/edbm" | "/admin"): RouteObject[] {
  return [
    page("opportunites", async () => { const { Portfolio } = await views.portfolio(); return () => <Portfolio base={base} />; }),
    page("opportunites/nouvelle", async () => { const { OpportunityEditor } = await views.editor(); return () => <OpportunityEditor base={base} />; }),
    page("opportunites/:id", async () => { const { EditOpportunityPage } = await views.staffPages(); return () => <EditOpportunityPage base={base} />; }),
    page("documents", async () => { const { DocumentsView } = await views.documents(); return () => <DocumentsView base={base} />; }),
    page("demandes", async () => { const { RequestsPipeline } = await views.pipeline(); return () => <RequestsPipeline base={base} />; }),
    page("demandes/:id", async () => { const { StaffRequestPage } = await views.requestPages(); return () => <StaffRequestPage base={base} />; }),
    page("secteurs", async () => { const { SectorsView } = await views.sectors(); return () => <SectorsView base={base} />; }),
    page("regions", async () => { const { RegionsView } = await views.regions(); return () => <RegionsView base={base} />; }),
    page("projets-partenaires", async () => { const { PartnerProjectsView } = await views.partnerProjects(); return () => <PartnerProjectsView base={base} />; }),
    page("statistiques", async () => { const { StatsView } = await views.stats(); return () => <StatsView base={base} />; }),
    page("notifications", async () => (await views.notifications()).NotificationsView),
    page("profil", async () => { const { ProfileView } = await views.profile(); return () => <ProfileView showCompany={false} />; }),
  ];
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/opportunites", element: <CataloguePage /> },
      { path: "/opportunites/:slug", element: <OpportunityDetailPage /> },
      { path: "/carte", element: <MapPage /> },
      { path: "/secteurs", element: <SectorsPage /> },
      { path: "/secteurs/:slug", element: <SectorPage /> },
      { path: "/regions", element: <RegionsPage /> },
      { path: "/regions/:id", element: <RegionPage /> },
      { path: "/projets-partenaires", lazy: async () => ({ Component: (await import("@/features/partner-projects/components/partner-projects-page")).PartnerProjectsPage }) },
      { path: "/a-propos", element: <AboutPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/connexion", element: <LoginPage /> },
      { path: "/inscription", element: <SignupPage /> },
      { path: "/mot-de-passe-oublie", element: <ForgotPasswordPage /> },
      { path: "/reinitialiser-mot-de-passe", element: <ResetPasswordPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  {
    // Espace investisseur (section 19)
    path: "/investisseur",
    element: <ProtectedRoute roles={["investisseur"]} space="investisseur" />,
    hydrateFallbackElement: <PageSkeleton />,
    children: [
      index(async () => (await import("@/features/stats/components/investor-dashboard")).InvestorDashboard),
      page("opportunites", async () => (await views.staffPages()).InvestorCataloguePage),
      { path: "carte", element: <InvestorMapPage /> },
      page("favoris", async () => (await import("@/features/favorites/components/favorites-view")).FavoritesView),
      page("demandes", async () => (await import("@/features/interest-requests/components/my-requests")).RequestsView),
      page("demandes/:id", async () => (await views.requestPages()).MyRequestPage),
      page("notifications", async () => (await views.notifications()).NotificationsView),
      page("profil", async () => (await views.profile()).ProfileView),
    ],
  },
  {
    // Espace porteur de projet : dépôt en ligne et suivi
    path: "/porteur",
    element: <ProtectedRoute roles={["porteur"]} space="porteur" />,
    hydrateFallbackElement: <PageSkeleton />,
    children: [
      index(async () => (await import("@/features/porteur/components/my-projects")).MyProjects),
      page("projets/nouveau", async () => (await import("@/features/porteur/components/project-form")).NewProjectPage),
      page("projets/:id", async () => (await import("@/features/porteur/components/project-page")).ProjectPage),
      page("projets/:id/modifier", async () => (await import("@/features/porteur/components/project-form")).EditProjectPage),
      page("notifications", async () => (await views.notifications()).NotificationsView),
      page("profil", async () => (await views.profile()).ProfileView),
    ],
  },
  {
    // Espace EDBM (agents et administrateurs)
    path: "/edbm",
    element: <ProtectedRoute roles={["agent", "admin"]} space="edbm" />,
    hydrateFallbackElement: <PageSkeleton />,
    children: [
      index(async () => (await import("@/features/stats/components/staff-dashboard")).StaffDashboard),
      ...staffRoutes("/edbm"),
    ],
  },
  {
    // Administration : écrans propres + écrans de l'espace EDBM montés avec base="/admin"
    path: "/admin",
    element: <ProtectedRoute roles={["admin"]} space="admin" />,
    hydrateFallbackElement: <PageSkeleton />,
    children: [
      index(async () => (await import("@/features/stats/components/admin-dashboard")).AdminDashboard),
      page("utilisateurs", async () => (await import("@/features/users/pages/users-page")).UsersPage),
      page("roles", async () => (await import("@/features/users/components/roles-view")).RolesView),
      page("journal", async () => (await import("@/features/audit-logs/components/audit-view")).AuditView),
      page("parametres", async () => (await import("@/features/settings/components/settings-view")).SettingsView),
      ...staffRoutes("/admin"),
    ],
  },
]);
