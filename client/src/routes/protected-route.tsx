import { Navigate, Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layouts/app-shell";
import { NAV, type Space } from "@/components/layouts/nav-config";
import { PageSkeleton } from "@/components/common/page-skeleton";
import { ROLE_HOME, type Role } from "@/config/constants";
import { useSession } from "@/lib/auth-client";

// Espace connecté (garde d'affichage uniquement : le serveur vérifie les droits sur chaque route).
// Sans session → /connexion?next=… ; mauvais rôle → espace du rôle.
export function ProtectedRoute({ roles, space }: { roles: Role[]; space: Space }) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (!isPending && !session) {
    const next = location.pathname + location.search;
    return <Navigate to={`/connexion?next=${encodeURIComponent(next)}`} replace />;
  }
  const role = session?.user.role as Role | undefined;
  if (role && !roles.includes(role)) return <Navigate to={ROLE_HOME[role] ?? "/"} replace />;

  return (
    <AppShell space={space}>
      <title>{`${NAV[space].label} — EDBM Toliara`}</title>
      {isPending ? <PageSkeleton /> : <Outlet />}
      <ScrollRestoration />
    </AppShell>
  );
}
