import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Sans baseURL : utilise l'origine courante (/api/auth) via le proxy Vite
export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: "string", input: false },
        status: { type: "string", input: false },
        phone: { type: "string", required: false },
      },
    }),
  ],
});
export const { signIn, signUp, signOut, useSession, requestPasswordReset, resetPassword } = authClient;
