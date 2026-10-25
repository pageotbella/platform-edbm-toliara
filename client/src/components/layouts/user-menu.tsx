import { ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useSignOut } from "@/features/auth/hooks";
import { useSession } from "@/lib/auth-client";
import { ROLE_HOME, ROLE_LABELS, type Role } from "@/config/constants";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { data: session, isPending } = useSession();
  const logout = useSignOut();

  if (isPending) return <Skeleton className="h-9 w-32" />;

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        {!compact && (
          <Link to="/connexion" className={cn(buttonVariants({ variant: "ghost" }), "h-9")}>Se connecter</Link>
        )}
        <Link to="/inscription" className={cn(buttonVariants(), "h-9 px-3")}>
          <UserRound /> Espace investisseur
        </Link>
      </div>
    );
  }

  const role = session.user.role as Role;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-1.5 py-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {initials(session.user.name)}
        </span>
        {!compact && (
          <span className="hidden text-left leading-tight lg:block">
            <span className="block max-w-36 truncate text-sm font-semibold">{session.user.name}</span>
            <span className="label-caps block text-[9px] text-primary">{ROLE_LABELS[role]}</span>
          </span>
        )}
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block truncate font-semibold text-foreground">{session.user.name}</span>
            <span className="block truncate text-xs font-normal">{session.user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to={ROLE_HOME[role]} />}>
          <LayoutDashboard /> Mon espace
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to={`${ROLE_HOME[role]}/profil`} />}>
          <UserRound /> Mon profil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} variant="destructive">
          <LogOut /> Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
