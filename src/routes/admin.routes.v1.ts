import { Router } from "express";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";
import {
    userControllerV1,
    creditControllerV1,
    accessLevelControllerV1,
    workspaceControllerV1,
    analyticsControllerV1,
    settingsControllerV1,
} from "../controllers/admin.controller.v1.js";

const adminRouter = Router();

// All admin routes require a valid JWT AND admin role
adminRouter.use(verifyJWT, verifyAdmin);

// ─── Analytics ────────────────────────────────────────────────────────────────
adminRouter.get("/analytics", analyticsControllerV1.get.getAnalytics);

// ─── User Management ──────────────────────────────────────────────────────────
adminRouter.get("/users", userControllerV1.get.listUsers);
adminRouter.get("/users/:userId", userControllerV1.get.getUser);
adminRouter.post("/users", userControllerV1.post.addUser);
adminRouter.put("/users/:userId", userControllerV1.put.updateUser);
adminRouter.delete("/users/:userId", userControllerV1.delete.deleteUser);

// ─── Credits ──────────────────────────────────────────────────────────────────
adminRouter.get("/users/:userId/credits", creditControllerV1.get.listCredits);
adminRouter.post("/users/:userId/credits", creditControllerV1.post.addCredit);
adminRouter.put("/credits/:creditId", creditControllerV1.put.updateCredit);

// ─── Access Level ─────────────────────────────────────────────────────────────
adminRouter.get("/users/:userId/access-level", accessLevelControllerV1.get.getAccessLevel);
adminRouter.put("/users/:userId/access-level", accessLevelControllerV1.post.updateAccessLevel);

// ─── Workspaces ──────────────────────────────────────────────────────────────
adminRouter.get("/users/:userId/workspaces", workspaceControllerV1.get.getUserWorkspaces);
adminRouter.post("/workspaces", workspaceControllerV1.post.createWorkspace);
adminRouter.post("/workspaces/:workspaceId/members", workspaceControllerV1.post.addMember);
adminRouter.delete("/workspaces/:workspaceId/members/:memberId", workspaceControllerV1.delete.removeMember);

// ─── Settings ────────────────────────────────────────────────────────────────
adminRouter.get("/settings/default-access", settingsControllerV1.get.getDefaultAccessSetting);
adminRouter.put("/settings/default-access", settingsControllerV1.put.updateDefaultAccessSetting);
adminRouter.get("/settings/default-assets", settingsControllerV1.get.getDefaultAssetSetting);
adminRouter.put("/settings/default-assets", settingsControllerV1.put.updateDefaultAssetSetting);



export default adminRouter;
