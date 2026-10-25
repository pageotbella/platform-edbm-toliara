import { get, post, put } from "@/lib/api";
import type { ContactSettings } from "@/types";
import type { ContactMessageInput } from "./schemas";

export const settingsApi = {
  // Coordonnées publiques de l'antenne (valeurs par défaut complétées côté serveur)
  contact: () => get<ContactSettings & { updatedAt: string | null }>("/settings/contact"),
  updateContact: (data: ContactSettings) => put("/settings/contact", data),
  // Formulaire de contact : message transmis par e-mail à l'adresse de l'antenne
  sendMessage: (data: ContactMessageInput) => post("/contact", data),
};
