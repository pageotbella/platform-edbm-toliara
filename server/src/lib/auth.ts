import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import { env } from "@/config/env";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { appUrl, resetPasswordMail, verifyEmailMail } from "./email-templates";
import { sendMailLater } from "./mailer";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.CLIENT_URL],
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Connexion refusée tant que l'adresse n'est pas confirmée (un nouveau lien est alors renvoyé)
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    // Lien direct vers la page du portail qui appelle POST /api/auth/reset-password
    sendResetPassword: async ({ user, token }) => {
      sendMailLater(user.email, resetPasswordMail(user.name, appUrl(`/reinitialiser-mot-de-passe?token=${token}`)));
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      // Le lien passe par l'origine du portail (même origine que l'API derrière le proxy), puis
      // revient sur la page de connexion (?verifie=1, avec &error=… si le lien est invalide ou expiré)
      const link = new URL(url);
      link.searchParams.set("callbackURL", appUrl("/connexion?verifie=1"));
      sendMailLater(user.email, verifyEmailMail(user.name, appUrl(link.pathname + link.search)));
    },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "investisseur", input: false },
      status: { type: "string", required: false, defaultValue: "actif", input: false },
      phone: { type: "string", required: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    // Pas de cookieCache : supprimer les sessions d'un utilisateur (désactivation,
    // changement de rôle, réinitialisation) doit couper l'accès immédiatement
  },
  databaseHooks: {
    user: {
      create: {
        // Inscription libre : investisseur par défaut, ou porteur de projet si le formulaire le demande.
        // Le rôle reste fixé par le serveur (input: false) : seule la valeur « porteur » est reconnue.
        before: async (u, ctx) => {
          const type = (ctx?.body as { accountType?: unknown } | undefined)?.accountType;
          if (ctx?.path === "/sign-up/email" && type === "porteur") {
            return { data: { ...u, role: "porteur" } };
          }
        },
        after: async (u) => {
          await db.insert(schema.investorProfiles).values({ userId: u.id }).onConflictDoNothing();
        },
      },
    },
    session: {
      create: {
        // Refuse la connexion d'un compte désactivé
        before: async (s) => {
          const [u] = await db
            .select({ status: schema.user.status })
            .from(schema.user)
            .where(eq(schema.user.id, s.userId));
          if (u?.status !== "actif") {
            throw new APIError("FORBIDDEN", { message: "Ce compte est désactivé. Contactez l'EDBM." });
          }
        },
      },
    },
  },
});

export type SessionUser = typeof auth.$Infer.Session.user;
