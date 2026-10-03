import { Router, type IRouter } from "express";
import { AdminLoginBody } from "@workspace/api-zod";
import {
  isAdminConfigured,
  hasValidSession,
  checkPassword,
  issueSession,
  clearSession,
  clientKey,
  isThrottled,
  recordFailure,
  clearFailures,
} from "../lib/adminAuth";

const router: IRouter = Router();

router.get("/admin/session", (req, res): void => {
  res.json({ authenticated: hasValidSession(req), configured: isAdminConfigured() });
});

router.post("/admin/login", (req, res): void => {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: "Admin is locked: the ADMIN_PASSWORD secret is not set" });
    return;
  }
  const key = clientKey(req);
  if (isThrottled(key)) {
    res.status(429).json({ error: "Too many failed attempts. Try again in a few minutes." });
    return;
  }
  const body = AdminLoginBody.safeParse(req.body);
  if (!body.success || !checkPassword(body.data.password)) {
    recordFailure(key);
    req.log.warn("Failed admin login attempt");
    res.status(401).json({ error: "Wrong password" });
    return;
  }
  clearFailures(key);
  issueSession(req, res);
  res.json({ authenticated: true, configured: true });
});

router.post("/admin/logout", (req, res): void => {
  clearSession(req, res);
  res.json({ authenticated: false, configured: isAdminConfigured() });
});

export default router;
