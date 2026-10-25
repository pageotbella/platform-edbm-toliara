import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { HttpError } from "@/utils/http-error";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Route introuvable" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  // Téléversement refusé par multer (taille, nombre de fichiers…)
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux (maximum 20 Mo)" : "Téléversement refusé";
    res.status(400).json({ message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: "Erreur interne du serveur" });
};
