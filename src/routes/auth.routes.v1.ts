import { Router } from "express";
import authControllerV1 from "../controllers/auth.controller.v1.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const authRouter = Router();

// ─── Public Routes ────────────────────────────────────────────────────────────
authRouter.post("/signup", authControllerV1.post.signup);
authRouter.post("/login", authControllerV1.post.login);
authRouter.post("/forgot-password", authControllerV1.post.forgotPassword);
authRouter.post("/reset-password", authControllerV1.post.resetPassword);
authRouter.post("/refresh-token", authControllerV1.post.refreshAccessToken);
authRouter.post("/seed-user", authControllerV1.post.seedDummyUser); // DEV ONLY

// ─── Protected Routes ─────────────────────────────────────────────────────────
authRouter.get("/me", verifyJWT, authControllerV1.get.me);
authRouter.get("/logout", authControllerV1.post.logout);
authRouter.post("/logout", authControllerV1.post.logout);
authRouter.patch("/me", verifyJWT, authControllerV1.patch.updateMe);
authRouter.post("/change-password", verifyJWT, authControllerV1.post.changePassword);

export default authRouter;
