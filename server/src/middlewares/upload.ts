import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import { UPLOAD_DIR } from "@/config/constants";
import { HttpError } from "@/utils/http-error";

export const uploadRoot = path.resolve(UPLOAD_DIR);

// Section 33 : validation des extensions, des tailles et du contenu réel des fichiers
export const UPLOAD_RULES = {
  image: { exts: [".png", ".jpg", ".jpeg", ".webp"], maxBytes: 5 * 1024 * 1024 },
  document: { exts: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"], maxBytes: 20 * 1024 * 1024 },
} as const;
export type UploadKind = keyof typeof UPLOAD_RULES;

export const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/** Signature binaire du fichier : on ne se fie ni au nom ni au type déclaré. */
function signatureMatches(ext: string, b: Uint8Array) {
  const starts = (...bytes: number[]) => bytes.every((v, i) => b[i] === v);
  switch (ext) {
    case ".pdf": return starts(0x25, 0x50, 0x44, 0x46); // %PDF
    case ".png": return starts(0x89, 0x50, 0x4e, 0x47);
    case ".jpg": case ".jpeg": return starts(0xff, 0xd8, 0xff);
    case ".webp": return starts(0x52, 0x49, 0x46, 0x46) && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    case ".docx": case ".xlsx": case ".pptx": return starts(0x50, 0x4b, 0x03, 0x04); // ZIP (Office Open XML)
    case ".doc": case ".xls": case ".ppt": return starts(0xd0, 0xcf, 0x11, 0xe0); // OLE2
    default: return false;
  }
}

// Fichier gardé en mémoire : il n'est écrit sur disque qu'après vérification
export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_RULES.document.maxBytes, files: 1 },
}).single("file");

export function checkFile(file: Express.Multer.File | undefined, kind: UploadKind) {
  if (!file || file.size === 0) throw new HttpError(400, "Aucun fichier reçu");
  const rule = UPLOAD_RULES[kind];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!(rule.exts as readonly string[]).includes(ext)) {
    throw new HttpError(400, `Format non accepté. Formats autorisés : ${rule.exts.join(", ")}`);
  }
  if (file.size > rule.maxBytes) throw new HttpError(400, `Fichier trop volumineux (maximum ${rule.maxBytes / 1024 / 1024} Mo)`);
  if (!signatureMatches(ext, file.buffer)) throw new HttpError(400, "Le contenu du fichier ne correspond pas à son extension");
  return { ext, mime: MIME_BY_EXT[ext]! };
}

// Nom aléatoire rangé par année : le nom d'origine n'est jamais utilisé comme chemin
export async function saveUpload(file: Express.Multer.File, ext: string) {
  const key = `${new Date().getFullYear()}/${randomUUID()}${ext}`;
  const full = uploadPath(key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, file.buffer);
  return key;
}

// Chemin absolu d'une clé, en refusant toute sortie du dossier d'upload
export function uploadPath(key: string) {
  const full = path.resolve(uploadRoot, key);
  if (!full.startsWith(uploadRoot + path.sep)) throw new HttpError(400, "Clé de fichier invalide");
  return full;
}

/** Supprime un fichier téléversé (sans erreur s'il n'existe plus). */
export async function deleteUpload(key: string) {
  await fs.rm(uploadPath(key), { force: true });
}
