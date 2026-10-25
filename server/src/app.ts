import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "@/config/env";
import { auth } from "@/lib/auth";
import { errorHandler, notFound } from "@/middlewares/error-handler";
import { authLimiter } from "@/middlewares/rate-limit";
import { apiRouter } from "@/routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));

// Better Auth AVANT express.json() (Express 5 : "*splat")
app.use(["/api/auth/sign-in", "/api/auth/sign-up"], authLimiter);
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use("/api", apiRouter);

app.use(notFound);
app.use(errorHandler);