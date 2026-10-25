import type { RequestHandler } from "express";
import { z, type ZodType } from "zod";

export const validate =
  (schema: ZodType, source: "body" | "query" | "params" = "body"): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      res.status(400).json({ message: "Données invalides", errors: z.flattenError(result.error).fieldErrors });
      return;
    }
    if (source === "body") req.body = result.data;
    else res.locals[source] = result.data; // req.query est en lecture seule avec Express 5
    next();
  };