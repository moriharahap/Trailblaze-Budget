import { Router, type IRouter } from "express";
import healthRouter from "./health";
import playerRouter from "./player";
import adminRouter from "./admin";
import adminAuthRouter from "./adminAuth";
import { requireAdmin } from "../lib/adminAuth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(playerRouter);
// Login/logout/session are public; every other /admin/* route needs a session.
router.use(adminAuthRouter);
router.use("/admin", requireAdmin);
router.use(adminRouter);

export default router;
