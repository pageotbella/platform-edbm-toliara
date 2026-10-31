// Formes des réponses de l'API (dates sérialisées en chaînes ISO).
// Elles reprennent les sélections des modules serveur (server/src/modules/*).
import type { OpportunityStatus, RequestStatus, Role } from "@/config/constants";

export type Paginated<T> = { items: T[]; total: number; pageCount: number };

// ── Référentiels ──────────────────────────────────────────────

export type Sector = { id: string; name: string; slug: string; description: string | null; isActive: boolean };
export type SectorSummary = { id: string; name: string; slug: string; description: string | null; count: number; total: number };
export type ManagedSector = Sector & { opportunities: number; published: number; investment: number };

export type Commune = { id: string; districtId: string; name: string };
export type District = { id: string; regionId: string; name: string };
export type Region = { id: string; name: string; code: string };
export type RegionTree = Region & { districts: (District & { communes: Commune[] })[] };
export type RegionSummary = Region & { count: number; districts: number; total: number };
export type ManagedRegion = Region & {
  opportunities: number;
  districts: (District & { opportunities: number; communes: (Commune & { opportunities: number })[] })[];
};

export type ContactSettings = { name: string; address: string; email: string; phone: string; hours: string };

// ── Opportunités ──────────────────────────────────────────────

// Colonnes communes à toutes les cartes (server/src/modules/opportunities/opportunity-card.ts)
export type OpportunityCardData = {
  id: string;
  slug: string;
  reference: string | null;
  title: string;
  description: string;
  status: OpportunityStatus;
  estimatedInvestment: number | null;
  currency: string;
  investmentModel: string | null;
  projectType: string | null;
  isFeatured: boolean;
  latitude: number | null;
  longitude: number | null;
  publishedAt: string | null;
  sectorId: string;
  regionId: string;
  sector: string;
  sectorSlug: string;
  region: string;
  district: string | null;
  coverKey: string | null;
};

export type OpportunityList = Paginated<OpportunityCardData> & { sumInvestment: number };

export type MapRegion = { id: string; name: string; total: number; sectors: { name: string; count: number }[] };
export type MapData = { points: OpportunityCardData[]; regions: MapRegion[] };

export type FilterOptions = {
  sectors: { id: string; name: string }[];
  regions: { id: string; name: string }[];
  districts: { id: string; name: string; regionId: string }[];
  communes: { id: string; name: string; districtId: string }[];
  projectTypes: string[];
};

export type KeyFigures = {
  opportunities: number;
  totalInvestment: number;
  sectors: number;
  regions: number;
  requests: number;
  investors: number;
};

export type OpportunityMedia = {
  id: string;
  opportunityId: string;
  fileKey: string;
  title: string | null;
  isCover: boolean;
  sortOrder: number;
};

export type PublicDocument = {
  id: string;
  name: string;
  type: string | null;
  fileKey: string;
  mimeType: string | null;
  isPublic: boolean;
  createdAt: string;
};

type OpportunityFields = {
  id: string;
  slug: string;
  reference: string | null;
  title: string;
  description: string;
  sectorId: string;
  subSector: string | null;
  projectType: string | null;
  regionId: string;
  districtId: string | null;
  communeId: string | null;
  latitude: number | null;
  longitude: number | null;
  estimatedInvestment: number | null;
  currency: string;
  investmentModel: string | null;
  potential: string | null;
  targetMarket: string | null;
  resources: string | null;
  infrastructures: string | null;
  zoneAdvantages: string | null;
  isFeatured: boolean;
  status: OpportunityStatus;
  createdBy: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OpportunityDetail = OpportunityFields & {
  sector: string;
  sectorSlug: string;
  region: string;
  district: string | null;
  commune: string | null;
  media: OpportunityMedia[];
  documents: PublicDocument[];
  similar: OpportunityCardData[];
};

// Portefeuille de l'espace EDBM
export type StaffOpportunityRow = OpportunityCardData & {
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  createdByRole: string | null;
  commune: string | null;
  documents: number;
  media: number;
  requests: number;
  views: number;
};

export type StaffOpportunityList = Paginated<StaffOpportunityRow> & {
  all: number;
  statusCounts: Partial<Record<OpportunityStatus, number>>;
};

export type StaffDocument = PublicDocument & { opportunityId: string; uploadedBy: string; uploadedByName: string | null };

export type StaffOpportunity = OpportunityFields & {
  sector: string;
  sectorSlug: string;
  region: string;
  district: string | null;
  commune: string | null;
  createdByName: string | null;
  /** Coordonnées du porteur pour un projet déposé en ligne, sinon null */
  submitter: { name: string; email: string; phone: string | null; company: string | null } | null;
  media: OpportunityMedia[];
  documents: StaffDocument[];
  stats: { requests: number; views: number; favorites: number };
  transitions: OpportunityStatus[];
  canPublish: boolean;
};

export type PendingOpportunity = {
  id: string;
  title: string;
  status: OpportunityStatus;
  reference: string | null;
  updatedAt: string;
};

export type OpportunityOption = { id: string; title: string; reference: string | null };

// ── Favoris ───────────────────────────────────────────────────

export type FavoriteRow = OpportunityCardData & { favoriteId: string; addedAt: string };

// ── Demandes d'intérêt ────────────────────────────────────────

export type InterestRequestRow = {
  id: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  amount: number | null;
  message: string | null;
  edbmResponse: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  company: string | null;
  country: string | null;
  phone: string | null;
  userId: string;
  opportunityId: string;
  opportunity: string;
  slug: string;
  reference: string | null;
  opportunityStatus: OpportunityStatus;
  estimatedInvestment: number | null;
  currency: string;
  sector: string;
  sectorSlug: string;
  region: string;
  district: string | null;
};

export type StatusHistoryEntry = { status: string; at: string; by: string | null };

export type MyRequestDetail = InterestRequestRow & { history: StatusHistoryEntry[] };

export type StaffRequestRow = InterestRequestRow & { handledBy: string | null; handledByName: string | null; late: boolean };

export type StaffRequestList = { items: StaffRequestRow[]; counts: Partial<Record<RequestStatus, number>> };

export type StaffRequestDetail = InterestRequestRow & {
  handledBy: string | null;
  internalNote: string | null;
  handledByName: string | null;
  investor: { name: string; email: string; since: string; description: string | null } | null;
  history: StatusHistoryEntry[];
};

// ── Notifications et profil ───────────────────────────────────

export type Notification = {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: string;
  company: string | null;
  country: string | null;
  interestSectorId: string | null;
  interestSector: string | null;
  description: string | null;
};

// ── Documents ─────────────────────────────────────────────────

export type DocumentRow = PublicDocument & {
  uploadedBy: string | null;
  opportunityId: string;
  opportunity: string;
  reference: string | null;
  opportunityStatus: OpportunityStatus;
};

export type DocumentList = Paginated<DocumentRow> & { stats: { documents: number; privateDocs: number; media: number } };

export type RecentDocument = {
  id: string;
  name: string;
  type: string | null;
  fileKey: string;
  createdAt: string;
  opportunity: string;
};

// ── Statistiques ──────────────────────────────────────────────

export type NamedCount = { name: string; n: number };
export type MonthlyCount = { month: string; n: number };

export type StatsOverview = {
  opportunities: Record<"total" | OpportunityStatus, number>;
  requests: { total: number; nouvelle: number; byStatus: Record<string, number> };
  bySector: NamedCount[];
  byRegion: NamedCount[];
  topViewed: { id: string; title: string; slug: string; sector: string; views: number; requests: number }[];
  sectorViews: NamedCount[];
  monthly: MonthlyCount[];
  totals: { views: number; views30: number; favorites: number; investment: number };
};

export type InvestorDashboard = {
  stats: { opportunities: number; favorites: number; requests: number; openRequests: number };
  latest: OpportunityCardData[];
  favorites: OpportunityCardData[];
  requests: InterestRequestRow[];
  notifications: Notification[];
};

export type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: unknown;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
};

export type AdminStats = {
  users: { total: number; active: number; inactive: number; investisseur: number; porteur: number; agent: number; admin: number };
  opportunities: { total: number; published: number };
  sectors: { total: number; active: number };
  regions: { total: number; districts: number; communes: number };
  requests: { total: number; open: number };
  recent: AuditRow[];
  signups: MonthlyCount[];
  requestsByRegion: NamedCount[];
};

// ── Administration ────────────────────────────────────────────

export type Permissions = { canPublish: boolean; canManageSectors: boolean; canManageRegions: boolean };

export type StaffMe = Permissions & { role: string; newRequests: number };

export type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: "actif" | "desactive";
  createdAt: string;
  company: string | null;
  country: string | null;
  canPublish: boolean | null;
  canManageSectors: boolean | null;
  canManageRegions: boolean | null;
  lastActive: string | null;
  requests: number;
  opportunities: number;
};

export type UserList = Paginated<UserRow> & {
  counts: { all: number; investisseur: number; porteur: number; agent: number; admin: number; desactive: number };
};

export type AgentPermissions = Permissions & { id: string; name: string; email: string; status: string };

export type AuditList = Paginated<AuditRow> & { entities: string[]; actors: { id: string; name: string }[] };

// Espace porteur de projet
export type PorteurProjectRow = OpportunityCardData & {
  createdAt: string;
  updatedAt: string;
  documents: number;
  media: number;
  requests: number;
};

export type PorteurProjectStep = { status: OpportunityStatus; note: string | null; at: string };

export type PorteurProject = Omit<OpportunityFields, "isFeatured" | "infrastructures" | "zoneAdvantages" | "createdBy"> & {
  sector: string;
  region: string;
  district: string | null;
  commune: string | null;
  media: Pick<OpportunityMedia, "id" | "fileKey" | "title" | "isCover">[];
  documents: { id: string; name: string; type: string | null; fileKey: string; createdAt: string }[];
  history: PorteurProjectStep[];
  /** Remarque de l'EDBM quand le projet lui a été renvoyé pour compléments */
  lastNote: string | null;
  canEdit: boolean;
  canSubmit: boolean;
  canEditFiles: boolean;
  canDelete: boolean;
};
