import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  CLIENT_URL: z.url(),
  // E-mails transactionnels (Resend) : sans clé, les e-mails sont seulement affichés dans la console
  RESEND_API_KEY: z.string().optional(),
  // L'expéditeur doit appartenir à un domaine vérifié dans Resend
  MAIL_FROM: z.string().min(3).default("EDBM Toliara <onboarding@resend.dev>"),
});

export const env = schema.parse(process.env);
