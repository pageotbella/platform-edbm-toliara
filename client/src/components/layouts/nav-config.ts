import {
  BarChart3, Bell, FilePlus2, FileText, FolderKanban, Heart, History, Inbox, KeyRound, LayoutDashboard, LayoutGrid, Map,
  MapPinned, Send, Settings, Shapes, UserRound, Users, type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string; label: string; icon: LucideIcon; exact?: boolean;
  badge?: "notifications" | "requests";
  /** Entrée visible seulement avec cette permission d'agent (« selon permission », section 7) */
  perm?: "canManageSectors" | "canManageRegions";
};
export type NavSection = { title?: string; items: NavItem[] };
export type Space = "investisseur" | "porteur" | "edbm" | "admin";

/** Espaces du personnel EDBM (menus « selon permission », compteur de demandes) */
export const isStaffSpace = (space: Space) => space === "edbm" || space === "admin";

// Menus des espaces connectés (section 19 pour l'investisseur)
export const NAV: Record<Space, { label: string; sections: NavSection[] }> = {
  investisseur: {
    label: "Espace investisseur",
    sections: [
      {
        items: [
          { href: "/investisseur", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
          { href: "/investisseur/opportunites", label: "Catalogue des opportunités", icon: LayoutGrid },
          { href: "/investisseur/carte", label: "Carte interactive", icon: Map },
          { href: "/investisseur/favoris", label: "Mes favoris", icon: Heart },
          { href: "/investisseur/demandes", label: "Mes demandes d'intérêt", icon: Send },
          { href: "/investisseur/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
          { href: "/investisseur/profil", label: "Mon profil", icon: UserRound },
        ],
      },
    ],
  },
  // Porteur de projet : dépôt en ligne et suivi de ses projets
  porteur: {
    label: "Espace porteur",
    sections: [
      {
        items: [
          { href: "/porteur", label: "Mes projets", icon: FolderKanban, exact: true },
          { href: "/porteur/projets/nouveau", label: "Déposer un projet", icon: FilePlus2, exact: true },
          { href: "/porteur/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
          { href: "/porteur/profil", label: "Mon profil", icon: UserRound },
        ],
      },
    ],
  },
  // Espace EDBM (section 37)
  edbm: {
    label: "Espace EDBM",
    sections: [
      {
        title: "Instruction & catalogue",
        items: [
          { href: "/edbm", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
          { href: "/edbm/opportunites", label: "Opportunités", icon: FolderKanban },
          { href: "/edbm/opportunites/nouvelle", label: "Nouvelle opportunité", icon: FilePlus2, exact: true },
          { href: "/edbm/documents", label: "Documents & médias", icon: FileText },
        ],
      },
      {
        title: "Investisseurs",
        items: [{ href: "/edbm/demandes", label: "Demandes d'intérêt", icon: Inbox, badge: "requests" }],
      },
      {
        title: "Référentiels",
        items: [
          { href: "/edbm/secteurs", label: "Secteurs", icon: Shapes, perm: "canManageSectors" },
          { href: "/edbm/regions", label: "Régions & districts", icon: MapPinned, perm: "canManageRegions" },
        ],
      },
      {
        title: "Suivi",
        items: [
          { href: "/edbm/statistiques", label: "Statistiques", icon: BarChart3 },
          { href: "/edbm/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
          { href: "/edbm/profil", label: "Mon profil", icon: UserRound },
        ],
      },
    ],
  },
  // Administration (section 37) : les écrans métier réutilisent ceux de l'espace EDBM
  admin: {
    label: "Administration",
    sections: [
      { title: "Vue d'ensemble", items: [{ href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true }] },
      {
        title: "Sécurité & accès",
        items: [
          { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
          { href: "/admin/roles", label: "Rôles & permissions", icon: KeyRound },
          { href: "/admin/journal", label: "Journal d'activité", icon: History },
        ],
      },
      {
        title: "Référentiels",
        items: [
          { href: "/admin/secteurs", label: "Secteurs", icon: Shapes },
          { href: "/admin/regions", label: "Régions & districts", icon: MapPinned },
        ],
      },
      {
        title: "Données",
        items: [
          { href: "/admin/opportunites", label: "Opportunités", icon: FolderKanban },
          { href: "/admin/documents", label: "Documents & médias", icon: FileText },
          { href: "/admin/demandes", label: "Demandes d'intérêt", icon: Inbox, badge: "requests" },
          { href: "/admin/statistiques", label: "Statistiques", icon: BarChart3 },
        ],
      },
      {
        title: "Configuration",
        items: [
          { href: "/admin/parametres", label: "Paramètres", icon: Settings },
          { href: "/admin/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
          { href: "/admin/profil", label: "Mon profil", icon: UserRound },
        ],
      },
    ],
  },
};

/** Libellé de l'espace d'un écran partagé (prop `base`) : « Espace EDBM » ou « Administration ». */
export const spaceLabel = (base: string) => (base === "/admin" ? NAV.admin.label : NAV.edbm.label);
