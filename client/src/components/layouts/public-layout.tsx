import { Outlet, ScrollRestoration } from "react-router-dom";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

// Portail public : en-tête, contenu, pied de page
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <ScrollRestoration />
    </div>
  );
}
