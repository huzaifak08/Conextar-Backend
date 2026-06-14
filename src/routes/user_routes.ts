import { Router } from "express";
import * as UserController from "../controllers/user_controller";
import { requireAuth } from "../middlewares/auth_middleware";

const router = Router();

router.use(requireAuth);

// 1. Profile Retrieval Enclaves
router.get("/me", UserController.getMyProfile);
router.get("/search/by-id/:id", UserController.getUserById);
router.get("/search/by-email", UserController.getUserByEmail);

// 2. State & Security Modification Handlers
router.put("/update", UserController.updateProfile);
router.patch("/change-password", UserController.changePassword);

export default router;
