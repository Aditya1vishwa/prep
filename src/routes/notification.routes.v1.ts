import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import notificationControllerV1 from "../controllers/notification.controller.v1.js";

const notificationRouter = Router();

notificationRouter.use(verifyJWT);

notificationRouter.get("/", notificationControllerV1.get.listMyNotifications);
notificationRouter.post("/", notificationControllerV1.post.createNotification);
notificationRouter.patch("/read-all", notificationControllerV1.patch.markAllRead);
notificationRouter.patch("/:notificationId/read", notificationControllerV1.patch.markOneRead);

export default notificationRouter;
