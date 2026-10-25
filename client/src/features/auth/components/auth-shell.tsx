import { CheckCircle2 } from "lucide-react";

const POINTS = [
  "Enregistrez vos opportunités favorites",
  "Manifestez votre intérêt en quelques minutes",
  "Suivez l'état de vos demandes auprès de l'EDBM",
  "Accédez aux documents réservés aux membres",
];

// Mise en page des écrans de connexion / inscription
export function AuthShell({ title, description, children }: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-2 lg:py-16">
      <div className="relative hidden overflow-hidden bg-brand-gradient rounded-xl p-10 text-white lg:block">
        <div className="absolute -top-24 -right-24 size-80 rounded-full bg-brand-light/25 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="relative space-y-6">
          <p className="label-caps text-brand-light">Espace investisseur</p>
          <p className="text-3xl leading-10 font-bold">Investissez dans le potentiel du Grand Sud de Madagascar</p>
          <ul className="space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-white/85">
                <CheckCircle2 className="size-5 text-brand-light" /> {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md self-center">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-2 text-muted-foreground">{description}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
