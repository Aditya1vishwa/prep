import { Router } from "express";
import { workspaceControllerV1 } from "../controllers/admin.controller.v1.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const workspaceRouterv1 = Router();

workspaceRouterv1.use(verifyJWT);

workspaceRouterv1.get("/", workspaceControllerV1.get.listMyWorkspaces);
workspaceRouterv1.post("/", workspaceControllerV1.post.createWorkspace);
workspaceRouterv1.post("/:workspaceId/members", workspaceControllerV1.post.addMember);
workspaceRouterv1.put("/:workspaceId/members/:memberId", workspaceControllerV1.put.updateMemberStatus);
workspaceRouterv1.delete("/:workspaceId/members/:memberId", workspaceControllerV1.delete.removeMember);

export default workspaceRouterv1;
