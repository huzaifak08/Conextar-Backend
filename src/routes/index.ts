import { Router } from "express";
import authRoutes from "./auth_routes";
import userRoutes from "./user_routes";
import roundtableRoute from "./roundtable_route";
import participantRoute from "./participant_routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/roundtable", roundtableRoute);
router.use("/participant", participantRoute);

export default router;
