import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import expressWinston from "express-winston";
import winston from "winston";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

if (!fs.existsSync("logs")) fs.mkdirSync("logs");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Application = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.CORS_ORIGIN,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
].filter(Boolean) as string[];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log(`CORS blocked for origin: ${origin}`);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    })
);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ─── Static Files ─────────────────────────────────────────────────────────────
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use(
    expressWinston.logger({
        transports: [
            new winston.transports.File({ filename: "logs/api.log" }),
            ...(process.env.NODE_ENV !== "production"
                ? [new winston.transports.Console()]
                : []),
        ],
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
        ),
        meta: true,
        msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}}",
        expressFormat: true,
        colorize: false,
    })
);

// ─── Route Imports ────────────────────────────────────────────────────────────
import authRouter from "./routes/auth.routes.v1.js";
import adminRouter from "./routes/admin.routes.v1.js";
import workspaceRouterv1 from "./routes/workspace.routes.v1.js";
import notificationRouter from "./routes/notification.routes.v1.js";

// ─── API Routes ───────────────────────────────────────────────────────────────

/// V1 Routes ///
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/workspaces", workspaceRouterv1);
app.use("/api/v1/notifications", notificationRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err.message);
    const status = err.statusCode || 500;
    res.status(status).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

export default app;
