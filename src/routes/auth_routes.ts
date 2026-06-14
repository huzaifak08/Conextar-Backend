import { Router } from "express";
import * as AuthController from "../controllers/auth_controller";
import { requireAuth } from "../middlewares/auth_middleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/verify-email", AuthController.verifyEmail);
router.post("/resend-code", AuthController.resendVerificationCode);
router.post("/signin", AuthController.signin);
router.post("/refresh-session", AuthController.maintainSession);
router.post("/logout", AuthController.logout);

// Secured Endpoint Test Grouping
router.delete("/purge-profile", requireAuth, AuthController.deleteAccount);

export default router;
